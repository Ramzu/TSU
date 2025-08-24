import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin']);

// Users table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('user'),
  tsuBalance: decimal("tsu_balance", { precision: 18, scale: 8 }).default('0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TSU coin supply tracking
export const coinSupply = pgTable("coin_supply", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalSupply: decimal("total_supply", { precision: 18, scale: 8 }).notNull(),
  circulatingSupply: decimal("circulating_supply", { precision: 18, scale: 8 }).notNull(),
  reserveGold: decimal("reserve_gold", { precision: 18, scale: 2 }).notNull(),
  reserveBrics: decimal("reserve_brics", { precision: 18, scale: 2 }).notNull(),
  reserveCommodities: decimal("reserve_commodities", { precision: 18, scale: 2 }).notNull(),
  reserveAfrican: decimal("reserve_african", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Transaction types enum
export const transactionTypeEnum = pgEnum('transaction_type', ['purchase', 'sale', 'transfer', 'creation', 'exchange']);

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: varchar("currency").default('TSU'),
  fromAddress: varchar("from_address"),
  toAddress: varchar("to_address"),
  status: varchar("status").default('completed'),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content management table
export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  title: varchar("title"),
  value: text("value").notNull(),
  section: varchar("section"),
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  coinSupplyCreated: many(coinSupply),
  contentUpdated: many(content),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const coinSupplyRelations = relations(coinSupply, ({ one }) => ({
  createdBy: one(users, {
    fields: [coinSupply.createdBy],
    references: [users.id],
  }),
}));

export const contentRelations = relations(content, ({ one }) => ({
  updatedBy: one(users, {
    fields: [content.updatedBy],
    references: [users.id],
  }),
}));

// Schema types and validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertCoinSupplySchema = createInsertSchema(coinSupply).omit({
  id: true,
  createdAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertCoinSupply = z.infer<typeof insertCoinSupplySchema>;
export type CoinSupply = typeof coinSupply.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;
