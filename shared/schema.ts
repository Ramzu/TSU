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
  password: varchar("password"), // Hashed password
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

// TSU pricing and rates table
export const tsuRates = pgTable("tsu_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseCurrency: varchar("base_currency").notNull(), // USD, EUR, etc.
  tsuPrice: decimal("tsu_price", { precision: 18, scale: 8 }).notNull(), // Price of 1 TSU
  gasolineEquivalent: decimal("gasoline_equivalent", { precision: 10, scale: 4 }).default('1.0000'), // TSU to gasoline liter ratio
  cryptoRates: jsonb("crypto_rates"), // BTC, ETH rates to TSU
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment methods enum
export const paymentMethodEnum = pgEnum('payment_method', ['paypal', 'bitcoin', 'ethereum', 'bank_transfer', 'card']);

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  amountFiat: decimal("amount_fiat", { precision: 18, scale: 2 }),
  currencyFiat: varchar("currency_fiat"),
  amountCrypto: decimal("amount_crypto", { precision: 18, scale: 8 }),
  currencyCrypto: varchar("currency_crypto"),
  tsuAmount: decimal("tsu_amount", { precision: 18, scale: 8 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 8 }),
  fees: decimal("fees", { precision: 18, scale: 8 }),
  paymentStatus: varchar("payment_status").default('pending'),
  paymentProviderRef: varchar("payment_provider_ref"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const tsuRatesRelations = relations(tsuRates, ({ one }) => ({
  updatedBy: one(users, {
    fields: [tsuRates.updatedBy],
    references: [users.id],
  }),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [paymentTransactions.transactionId],
    references: [transactions.id],
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

export const insertTsuRatesSchema = createInsertSchema(tsuRates).omit({
  id: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

// Site metadata for social media sharing
export const siteMetadata = pgTable("site_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  keywords: text("keywords"),
  ogImage: varchar("og_image"), // URL to social media image
  twitterCard: varchar("twitter_card").default('summary_large_image'),
  siteName: varchar("site_name").default('TSU Wallet'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertSiteMetadataSchema = createInsertSchema(siteMetadata).omit({
  id: true,
  createdAt: true,
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
export type InsertTsuRates = z.infer<typeof insertTsuRatesSchema>;
export type TsuRates = typeof tsuRates.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertSiteMetadata = z.infer<typeof insertSiteMetadataSchema>;
export type SiteMetadata = typeof siteMetadata.$inferSelect;
