import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "manager", "supplier"] }).notNull().default("supplier"),
  companyName: text("company_name"),
  active: boolean("active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  active: true
});

// Supplier model
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  rating: integer("rating").default(0),
  active: boolean("active").notNull().default(true),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  active: true,
  rating: true
});

// Auction model
export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  auctionCode: text("auction_code").notNull().unique(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  status: text("status", { enum: ["draft", "active", "closed", "completed"] }).notNull().default("draft"),
  auctionType: text("auction_type", { enum: ["standard", "urgent", "limited"] }).notNull().default("standard"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  specifications: text("specifications"),
  winningBidId: integer("winning_bid_id"),
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({
  id: true,
  createdAt: true,
  auctionCode: true,
  winningBidId: true,
  status: true
});

// Auction item model
export const auctionItems = pgTable("auction_items", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  partNumber: text("part_number").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unitOfMeasure: text("unit_of_measure").notNull(),
  estimatedPrice: integer("estimated_price"),
  description: text("description"),
  requiredDate: timestamp("required_date"),
});

export const insertAuctionItemSchema = createInsertSchema(auctionItems).omit({
  id: true
});

// Auction suppliers junction table
export const auctionSuppliers = pgTable("auction_suppliers", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
}, (table) => {
  return {
    unq: uniqueIndex("auction_supplier_unq").on(table.auctionId, table.supplierId),
  };
});

export const insertAuctionSupplierSchema = createInsertSchema(auctionSuppliers).omit({
  id: true,
  invitedAt: true,
  status: true
});

// Bid model
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull().references(() => auctions.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  totalAmount: integer("total_amount").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  note: text("note"),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  status: true
});

// Bid items model
export const bidItems = pgTable("bid_items", {
  id: serial("id").primaryKey(),
  bidId: integer("bid_id").notNull().references(() => bids.id),
  auctionItemId: integer("auction_item_id").notNull().references(() => auctionItems.id),
  pricePerUnit: integer("price_per_unit").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
});

export const insertBidItemSchema = createInsertSchema(bidItems).omit({
  id: true
});

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "warning", "success", "error"] }).notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  relatedId: integer("related_id"), // ID of the related entity (auction, bid, etc.)
  relatedType: text("related_type"), // Type of the related entity
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true
});

// Activity log model
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Auction = typeof auctions.$inferSelect;
export type InsertAuction = z.infer<typeof insertAuctionSchema>;

export type AuctionItem = typeof auctionItems.$inferSelect;
export type InsertAuctionItem = z.infer<typeof insertAuctionItemSchema>;

export type AuctionSupplier = typeof auctionSuppliers.$inferSelect;
export type InsertAuctionSupplier = z.infer<typeof insertAuctionSupplierSchema>;

export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;

export type BidItem = typeof bidItems.$inferSelect;
export type InsertBidItem = z.infer<typeof insertBidItemSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
