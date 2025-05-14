import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { insertUserSchema, insertSupplierSchema, insertAuctionSchema, insertAuctionItemSchema, insertBidSchema, insertBidItemSchema } from "@shared/schema";

// Extend session with user property
declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "autodom-secret"
  }));
  
  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Role-based authorization middleware
  const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session.userId || !req.session.role || !roles.includes(req.session.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // If user is a supplier, create supplier record
      if (userData.role === "supplier" && userData.companyName) {
        const supplierData = {
          userId: user.id,
          companyName: userData.companyName,
          contactPerson: userData.fullName,
          phone: req.body.phone || "", // Add additional validation as needed
          address: req.body.address || ""
        };
        
        await storage.createSupplier(supplierData);
      }
      
      // Create welcome notification
      await storage.createNotification({
        userId: user.id,
        title: "Добро пожаловать",
        message: "Добро пожаловать на платформу закупок Автодом!",
        type: "info"
      });
      
      // Log activity
      await storage.createActivityLog({
        userId: user.id,
        action: "User registered",
        entityType: "user",
        entityId: user.id,
        details: "User registered successfully"
      });
      
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) { // In a real app, use proper password hashing
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.active) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      
      // Set session data
      req.session.userId = user.id;
      req.session.role = user.role;
      
      // Log activity
      await storage.createActivityLog({
        userId: user.id,
        action: "User logged in",
        entityType: "user",
        entityId: user.id,
        details: "User logged in successfully"
      });
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session.userId;
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Log activity if userId exists
      if (userId) {
        storage.createActivityLog({
          userId,
          action: "User logged out",
          entityType: "user",
          entityId: userId,
          details: "User logged out successfully"
        });
      }
      
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // Supplier routes
  app.get("/api/suppliers", authenticate, async (req, res) => {
    try {
      const suppliers = await storage.listSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suppliers" });
    }
  });
  
  app.get("/api/suppliers/:id", authenticate, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(parseInt(req.params.id));
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to get supplier" });
    }
  });
  
  // Auction routes
  app.post("/api/auctions", authenticate, authorize(["admin", "manager"]), async (req, res) => {
    try {
      const auctionData = insertAuctionSchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });
      
      const auction = await storage.createAuction(auctionData);
      
      // Create auction items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createAuctionItem({
            ...item,
            auctionId: auction.id
          });
        }
      }
      
      // Invite suppliers if provided
      if (req.body.supplierIds && Array.isArray(req.body.supplierIds)) {
        for (const supplierId of req.body.supplierIds) {
          await storage.createAuctionSupplier({
            auctionId: auction.id,
            supplierId
          });
          
          // Get supplier to send notification
          const supplier = await storage.getSupplier(supplierId);
          if (supplier) {
            await storage.createNotification({
              userId: supplier.userId,
              title: "Новое приглашение к аукциону",
              message: `Вы приглашены к участию в аукционе: ${auction.title}`,
              type: "info",
              relatedId: auction.id,
              relatedType: "auction"
            });
          }
        }
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.session.userId,
        action: "Auction created",
        entityType: "auction",
        entityId: auction.id,
        details: `Created auction: ${auction.title}`
      });
      
      res.status(201).json(auction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create auction" });
    }
  });
  
  app.get("/api/auctions", authenticate, async (req, res) => {
    try {
      const status = req.query.status as string;
      let auctions;
      
      if (status) {
        auctions = await storage.listAuctionsByStatus(status);
      } else {
        auctions = await storage.listAuctions();
      }
      
      // If user is a supplier, filter to only show auctions they're invited to
      if (req.session.role === "supplier") {
        const supplier = await storage.getSupplierByUserId(req.session.userId);
        
        if (supplier) {
          const filteredAuctions = [];
          
          for (const auction of auctions) {
            const auctionSuppliers = await storage.listAuctionSuppliers(auction.id);
            const isInvited = auctionSuppliers.some(as => as.supplierId === supplier.id);
            
            if (isInvited) {
              filteredAuctions.push(auction);
            }
          }
          
          return res.json(filteredAuctions);
        }
      }
      
      res.json(auctions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get auctions" });
    }
  });
  
  app.get("/api/auctions/:id", authenticate, async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      // Get auction items
      const items = await storage.listAuctionItems(auctionId);
      
      // Get auction suppliers (only for admin/manager)
      let suppliers = [];
      if (req.session.role === "admin" || req.session.role === "manager") {
        suppliers = await storage.listAuctionSuppliers(auctionId);
      }
      
      // Get auction bids (filtered by role)
      let bids = await storage.listBids(auctionId);
      
      // If user is a supplier, only show their own bids
      if (req.session.role === "supplier") {
        const supplier = await storage.getSupplierByUserId(req.session.userId);
        
        if (supplier) {
          bids = bids.filter(bid => bid.supplierId === supplier.id);
        } else {
          bids = [];
        }
      }
      
      // For each bid, get bid items
      const bidsWithItems = await Promise.all(bids.map(async (bid) => {
        const bidItems = await storage.listBidItems(bid.id);
        return { ...bid, items: bidItems };
      }));
      
      res.json({
        ...auction,
        items,
        suppliers,
        bids: bidsWithItems
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get auction details" });
    }
  });
  
  app.patch("/api/auctions/:id", authenticate, authorize(["admin", "manager"]), async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      // Update auction
      const updatedAuction = await storage.updateAuction(auctionId, req.body);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.session.userId,
        action: "Auction updated",
        entityType: "auction",
        entityId: auctionId,
        details: `Updated auction: ${auction.title}`
      });
      
      res.json(updatedAuction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update auction" });
    }
  });
  
  // Bid routes
  app.post("/api/auctions/:id/bids", authenticate, authorize(["supplier"]), async (req, res) => {
    try {
      const auctionId = parseInt(req.params.id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.status !== "active") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      
      // Get supplier
      const supplier = await storage.getSupplierByUserId(req.session.userId);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      // Check if supplier is invited to this auction
      const auctionSuppliers = await storage.listAuctionSuppliers(auctionId);
      const isInvited = auctionSuppliers.some(as => as.supplierId === supplier.id);
      
      if (!isInvited) {
        return res.status(403).json({ message: "Supplier not invited to this auction" });
      }
      
      // Create bid
      const bidData = insertBidSchema.parse({
        auctionId,
        supplierId: supplier.id,
        totalAmount: req.body.totalAmount,
        deliveryDate: new Date(req.body.deliveryDate),
        note: req.body.note
      });
      
      const bid = await storage.createBid(bidData);
      
      // Create bid items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          await storage.createBidItem({
            bidId: bid.id,
            auctionItemId: item.auctionItemId,
            pricePerUnit: item.pricePerUnit,
            quantity: item.quantity,
            totalPrice: item.pricePerUnit * item.quantity
          });
        }
      }
      
      // Notify auction creator
      await storage.createNotification({
        userId: auction.createdBy,
        title: "Новое предложение по аукциону",
        message: `Поставщик ${supplier.companyName} сделал предложение по аукциону ${auction.auctionCode}`,
        type: "info",
        relatedId: auction.id,
        relatedType: "auction"
      });
      
      // Log activity
      await storage.createActivityLog({
        userId: req.session.userId,
        action: "Bid created",
        entityType: "bid",
        entityId: bid.id,
        details: `Created bid for auction: ${auction.title}`
      });
      
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bid" });
    }
  });
  
  app.patch("/api/bids/:id", authenticate, authorize(["admin", "manager"]), async (req, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const bid = await storage.getBid(bidId);
      
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Update bid status
      const updatedBid = await storage.updateBid(bidId, req.body.status);
      
      // Get auction
      const auction = await storage.getAuction(bid.auctionId);
      
      // Get supplier
      const supplier = await storage.getSupplier(bid.supplierId);
      
      if (supplier && updatedBid) {
        // Notify supplier
        await storage.createNotification({
          userId: supplier.userId,
          title: `Ваше предложение ${req.body.status === "accepted" ? "принято" : "отклонено"}`,
          message: `Ваше предложение по аукциону ${auction?.auctionCode || ""} было ${req.body.status === "accepted" ? "принято" : "отклонено"}`,
          type: req.body.status === "accepted" ? "success" : "info",
          relatedId: bid.auctionId,
          relatedType: "auction"
        });
        
        // If bid is accepted, update auction status and notify other suppliers
        if (req.body.status === "accepted") {
          await storage.updateAuction(bid.auctionId, { 
            status: "completed",
            winningBidId: bidId
          });
          
          // Notify other suppliers that auction is closed
          const auctionSuppliers = await storage.listAuctionSuppliers(bid.auctionId);
          
          for (const auctionSupplier of auctionSuppliers) {
            if (auctionSupplier.supplierId !== supplier.id) {
              const otherSupplier = await storage.getSupplier(auctionSupplier.supplierId);
              
              if (otherSupplier) {
                await storage.createNotification({
                  userId: otherSupplier.userId,
                  title: "Аукцион завершен",
                  message: `Аукцион ${auction?.auctionCode || ""} был завершен`,
                  type: "info",
                  relatedId: bid.auctionId,
                  relatedType: "auction"
                });
              }
            }
          }
        }
      }
      
      // Log activity
      await storage.createActivityLog({
        userId: req.session.userId,
        action: `Bid ${req.body.status}`,
        entityType: "bid",
        entityId: bidId,
        details: `${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)} bid for auction: ${auction?.title || ""}`
      });
      
      res.json(updatedBid);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bid" });
    }
  });
  
  // Notification routes
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const notifications = await storage.listUserNotifications(req.session.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  
  app.patch("/api/notifications/:id", authenticate, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });
  
  // Activity log routes
  app.get("/api/activity", authenticate, authorize(["admin", "manager"]), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.listActivityLogs(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity logs" });
    }
  });
  
  // Stats routes (for dashboard)
  app.get("/api/stats", authenticate, async (req, res) => {
    try {
      // Get counts by status
      const allAuctions = await storage.listAuctions();
      const activeAuctions = allAuctions.filter(a => a.status === "active").length;
      const completedAuctions = allAuctions.filter(a => a.status === "completed").length;
      
      // Get user-specific stats
      let userStats = {};
      
      if (req.session.role === "supplier") {
        const supplier = await storage.getSupplierByUserId(req.session.userId);
        
        if (supplier) {
          // Count bids by status for this supplier
          const bids = await storage.listBidsBySupplier(supplier.id);
          
          const pendingBids = bids.filter(b => b.status === "pending").length;
          const acceptedBids = bids.filter(b => b.status === "accepted").length;
          const rejectedBids = bids.filter(b => b.status === "rejected").length;
          
          userStats = {
            pendingBids,
            acceptedBids,
            rejectedBids,
            totalBids: bids.length
          };
        }
      } else {
        // For managers and admins, count bids by status
        let pendingBids = 0;
        let acceptedBids = 0;
        
        for (const auction of allAuctions) {
          const bids = await storage.listBids(auction.id);
          pendingBids += bids.filter(b => b.status === "pending").length;
          acceptedBids += bids.filter(b => b.status === "accepted").length;
        }
        
        userStats = {
          pendingBids,
          acceptedBids
        };
      }
      
      res.json({
        activeAuctions,
        completedAuctions,
        totalAuctions: allAuctions.length,
        ...userStats
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  return httpServer;
}
