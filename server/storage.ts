import { 
  users, type User, type InsertUser,
  suppliers, type Supplier, type InsertSupplier,
  auctions, type Auction, type InsertAuction,
  auctionItems, type AuctionItem, type InsertAuctionItem,
  auctionSuppliers, type AuctionSupplier, type InsertAuctionSupplier,
  bids, type Bid, type InsertBid,
  bidItems, type BidItem, type InsertBidItem,
  notifications, type Notification, type InsertNotification,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Supplier methods
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierByUserId(userId: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  listSuppliers(): Promise<Supplier[]>;
  updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier | undefined>;
  
  // Auction methods
  getAuction(id: number): Promise<Auction | undefined>;
  getAuctionByCode(code: string): Promise<Auction | undefined>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  listAuctions(): Promise<Auction[]>;
  listAuctionsByStatus(status: string): Promise<Auction[]>;
  updateAuction(id: number, auction: Partial<Auction>): Promise<Auction | undefined>;
  
  // Auction Item methods
  getAuctionItem(id: number): Promise<AuctionItem | undefined>;
  createAuctionItem(auctionItem: InsertAuctionItem): Promise<AuctionItem>;
  listAuctionItems(auctionId: number): Promise<AuctionItem[]>;
  
  // Auction Supplier methods
  createAuctionSupplier(auctionSupplier: InsertAuctionSupplier): Promise<AuctionSupplier>;
  listAuctionSuppliers(auctionId: number): Promise<AuctionSupplier[]>;
  updateAuctionSupplier(id: number, status: string): Promise<AuctionSupplier | undefined>;
  
  // Bid methods
  getBid(id: number): Promise<Bid | undefined>;
  createBid(bid: InsertBid): Promise<Bid>;
  listBids(auctionId: number): Promise<Bid[]>;
  listBidsBySupplier(supplierId: number): Promise<Bid[]>;
  updateBid(id: number, status: string): Promise<Bid | undefined>;
  
  // Bid Item methods
  createBidItem(bidItem: InsertBidItem): Promise<BidItem>;
  listBidItems(bidId: number): Promise<BidItem[]>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  listUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Activity Log methods
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  listActivityLogs(limit?: number): Promise<ActivityLog[]>;
  listUserActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suppliers: Map<number, Supplier>;
  private auctions: Map<number, Auction>;
  private auctionItems: Map<number, AuctionItem>;
  private auctionSuppliers: Map<number, AuctionSupplier>;
  private bids: Map<number, Bid>;
  private bidItems: Map<number, BidItem>;
  private notifications: Map<number, Notification>;
  private activityLogs: Map<number, ActivityLog>;
  
  private currentUserId: number;
  private currentSupplierId: number;
  private currentAuctionId: number;
  private currentAuctionItemId: number;
  private currentAuctionSupplierId: number;
  private currentBidId: number;
  private currentBidItemId: number;
  private currentNotificationId: number;
  private currentActivityLogId: number;
  
  constructor() {
    this.users = new Map();
    this.suppliers = new Map();
    this.auctions = new Map();
    this.auctionItems = new Map();
    this.auctionSuppliers = new Map();
    this.bids = new Map();
    this.bidItems = new Map();
    this.notifications = new Map();
    this.activityLogs = new Map();
    
    this.currentUserId = 1;
    this.currentSupplierId = 1;
    this.currentAuctionId = 1;
    this.currentAuctionItemId = 1;
    this.currentAuctionSupplierId = 1;
    this.currentBidId = 1;
    this.currentBidItemId = 1;
    this.currentNotificationId = 1;
    this.currentActivityLogId = 1;
    
    // Seed some data
    this.seedData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Ensure role is not undefined (default to 'supplier')
    const role = insertUser.role || 'supplier';
    const companyName = insertUser.companyName || null;
    const user: User = { 
      ...insertUser,
      id, 
      role,
      companyName,
      active: true 
    };
    this.users.set(id, user);
    return user;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Supplier methods
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async getSupplierByUserId(userId: number): Promise<Supplier | undefined> {
    return Array.from(this.suppliers.values()).find(
      (supplier) => supplier.userId === userId
    );
  }
  
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentSupplierId++;
    const supplier: Supplier = { 
      ...insertSupplier, 
      id, 
      active: true,
      address: insertSupplier.address || null,
      rating: 0
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }
  
  async listSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).filter(s => s.active);
  }
  
  async updateSupplier(id: number, supplierData: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, ...supplierData };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  // Auction methods
  async getAuction(id: number): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }
  
  async getAuctionByCode(code: string): Promise<Auction | undefined> {
    return Array.from(this.auctions.values()).find(
      (auction) => auction.auctionCode === code
    );
  }
  
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = this.currentAuctionId++;
    const auctionCode = `AUC-${Math.floor(Math.random() * 9000) + 1000}${id}`;
    
    const auction: Auction = {
      ...insertAuction,
      id,
      auctionCode,
      status: "draft",
      createdAt: new Date(),
      winningBidId: null
    };
    
    this.auctions.set(id, auction);
    return auction;
  }
  
  async listAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values());
  }
  
  async listAuctionsByStatus(status: string): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      (auction) => auction.status === status
    );
  }
  
  async updateAuction(id: number, auctionData: Partial<Auction>): Promise<Auction | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;
    
    const updatedAuction = { ...auction, ...auctionData };
    this.auctions.set(id, updatedAuction);
    return updatedAuction;
  }
  
  // Auction Item methods
  async getAuctionItem(id: number): Promise<AuctionItem | undefined> {
    return this.auctionItems.get(id);
  }
  
  async createAuctionItem(insertAuctionItem: InsertAuctionItem): Promise<AuctionItem> {
    const id = this.currentAuctionItemId++;
    const auctionItem: AuctionItem = { ...insertAuctionItem, id };
    this.auctionItems.set(id, auctionItem);
    return auctionItem;
  }
  
  async listAuctionItems(auctionId: number): Promise<AuctionItem[]> {
    return Array.from(this.auctionItems.values()).filter(
      (item) => item.auctionId === auctionId
    );
  }
  
  // Auction Supplier methods
  async createAuctionSupplier(insertAuctionSupplier: InsertAuctionSupplier): Promise<AuctionSupplier> {
    const id = this.currentAuctionSupplierId++;
    const auctionSupplier: AuctionSupplier = {
      ...insertAuctionSupplier,
      id,
      invitedAt: new Date(),
      status: "pending"
    };
    this.auctionSuppliers.set(id, auctionSupplier);
    return auctionSupplier;
  }
  
  async listAuctionSuppliers(auctionId: number): Promise<AuctionSupplier[]> {
    return Array.from(this.auctionSuppliers.values()).filter(
      (item) => item.auctionId === auctionId
    );
  }
  
  async updateAuctionSupplier(id: number, status: string): Promise<AuctionSupplier | undefined> {
    const auctionSupplier = this.auctionSuppliers.get(id);
    if (!auctionSupplier) return undefined;
    
    const updatedAuctionSupplier = { ...auctionSupplier, status };
    this.auctionSuppliers.set(id, updatedAuctionSupplier);
    return updatedAuctionSupplier;
  }
  
  // Bid methods
  async getBid(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
  }
  
  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.currentBidId++;
    const bid: Bid = {
      ...insertBid,
      id,
      status: "pending",
      createdAt: new Date()
    };
    this.bids.set(id, bid);
    return bid;
  }
  
  async listBids(auctionId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.auctionId === auctionId
    );
  }
  
  async listBidsBySupplier(supplierId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.supplierId === supplierId
    );
  }
  
  async updateBid(id: number, status: string): Promise<Bid | undefined> {
    const bid = this.bids.get(id);
    if (!bid) return undefined;
    
    const updatedBid = { ...bid, status };
    this.bids.set(id, updatedBid);
    
    // If accepted, update the auction with the winning bid
    if (status === "accepted") {
      const auction = this.auctions.get(bid.auctionId);
      if (auction) {
        this.auctions.set(bid.auctionId, {
          ...auction,
          winningBidId: id,
          status: "completed"
        });
      }
    }
    
    return updatedBid;
  }
  
  // Bid Item methods
  async createBidItem(insertBidItem: InsertBidItem): Promise<BidItem> {
    const id = this.currentBidItemId++;
    const bidItem: BidItem = { ...insertBidItem, id };
    this.bidItems.set(id, bidItem);
    return bidItem;
  }
  
  async listBidItems(bidId: number): Promise<BidItem[]> {
    return Array.from(this.bidItems.values()).filter(
      (item) => item.bidId === bidId
    );
  }
  
  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async listUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Activity Log methods
  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const activityLog: ActivityLog = {
      ...insertActivityLog,
      id,
      createdAt: new Date()
    };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
  
  async listActivityLogs(limit = 20): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async listUserActivityLogs(userId: number, limit = 20): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  // Seed data for initial testing
  private seedData() {
    // Create admin user
    const admin: InsertUser = {
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@autodom.com",
      fullName: "Admin User",
      role: "admin",
      companyName: "Автодом"
    };
    this.createUser(admin).then((user) => {
      // Create activity log for admin creation
      this.createActivityLog({
        userId: user.id,
        action: "User created",
        entityType: "user",
        entityId: user.id,
        details: "Admin user was created"
      });
    });

    // Create manager user
    const manager: InsertUser = {
      username: "manager",
      password: "manager123", // In a real app, this would be hashed
      email: "manager@autodom.com",
      fullName: "Антон Макаров",
      role: "manager",
      companyName: "Автодом"
    };
    this.createUser(manager).then((user) => {
      // Create welcome notification
      this.createNotification({
        userId: user.id,
        title: "Добро пожаловать",
        message: "Добро пожаловать в систему закупок запчастей Автодом!",
        type: "info"
      });
      
      // Create auctions
      this.createAuction({
        title: "Закупка тормозных дисков",
        description: "Требуются тормозные диски для различных моделей автомобилей",
        createdBy: user.id,
        auctionType: "standard",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        specifications: "См. приложенную спецификацию"
      }).then(auction => {
        this.createAuctionItem({
          auctionId: auction.id,
          partNumber: "BD-12345",
          name: "Тормозной диск передний BMW 3-series",
          quantity: 50,
          unitOfMeasure: "шт",
          estimatedPrice: 5000,
          description: "Оригинальный тормозной диск",
          requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
        
        // Update auction status to active
        this.updateAuction(auction.id, { status: "active" });
        
        // Log activity
        this.createActivityLog({
          userId: user.id,
          action: "Auction created",
          entityType: "auction",
          entityId: auction.id,
          details: "Created auction for brake discs"
        });
      });
      
      this.createAuction({
        title: "Масляные фильтры BMW",
        description: "Требуются масляные фильтры для автомобилей BMW",
        createdBy: user.id,
        auctionType: "urgent",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        specifications: "См. приложенную спецификацию"
      }).then(auction => {
        this.createAuctionItem({
          auctionId: auction.id,
          partNumber: "OF-54321",
          name: "Масляный фильтр BMW",
          quantity: 100,
          unitOfMeasure: "шт",
          estimatedPrice: 1200,
          description: "Оригинальный масляный фильтр",
          requiredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        });
        
        // Update auction status to active
        this.updateAuction(auction.id, { status: "active" });
        
        // Log activity
        this.createActivityLog({
          userId: user.id,
          action: "Auction created",
          entityType: "auction",
          entityId: auction.id,
          details: "Created urgent auction for oil filters"
        });
      });
      
      this.createAuction({
        title: "Свечи зажигания BOSCH",
        description: "Требуются свечи зажигания BOSCH для различных моделей автомобилей",
        createdBy: user.id,
        auctionType: "standard",
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        specifications: "См. приложенную спецификацию"
      }).then(auction => {
        this.createAuctionItem({
          auctionId: auction.id,
          partNumber: "SP-98765",
          name: "Свечи зажигания BOSCH",
          quantity: 200,
          unitOfMeasure: "шт",
          estimatedPrice: 500,
          description: "Оригинальные свечи зажигания",
          requiredDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        });
        
        // Update auction status to active
        this.updateAuction(auction.id, { status: "active" });
        
        // Log activity
        this.createActivityLog({
          userId: user.id,
          action: "Auction created",
          entityType: "auction",
          entityId: auction.id,
          details: "Created auction for spark plugs"
        });
      });
    });
    
    // Create supplier users and their companies
    const supplierUsers = [
      {
        username: "glavautoz",
        password: "supplier123",
        email: "info@glavautoz.ru",
        fullName: "Иван Петров",
        role: "supplier",
        companyName: "ГлавАвтоЗапчасть"
      },
      {
        username: "avtoplus",
        password: "supplier123",
        email: "info@avtoplus.ru",
        fullName: "Анна Сидорова",
        role: "supplier",
        companyName: "Автозапчасти Плюс"
      },
      {
        username: "maxauto",
        password: "supplier123",
        email: "info@maxauto.ru",
        fullName: "Максим Соколов",
        role: "supplier",
        companyName: "МаксАвто"
      }
    ];
    
    supplierUsers.forEach(async (supplierData) => {
      const user = await this.createUser(supplierData);
      
      const supplier = await this.createSupplier({
        userId: user.id,
        companyName: supplierData.companyName,
        contactPerson: supplierData.fullName,
        phone: "+7" + Math.floor(Math.random() * 9000000000 + 1000000000),
        address: "г. Москва, ул. Примерная, д. " + Math.floor(Math.random() * 100 + 1)
      });
      
      // Create welcome notification
      await this.createNotification({
        userId: user.id,
        title: "Добро пожаловать",
        message: "Добро пожаловать на платформу закупок Автодом!",
        type: "info"
      });
      
      // Log activity
      await this.createActivityLog({
        userId: user.id,
        action: "User created",
        entityType: "user",
        entityId: user.id,
        details: "Supplier user was created"
      });
    });
  }
}

export const storage = new MemStorage();
