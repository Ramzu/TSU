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

// Country enum for African and BRICS nations
export const countryEnum = pgEnum('country', [
  'south_africa', 'nigeria', 'kenya', 'ghana', 'egypt', 'morocco', 'ethiopia', 'tanzania', 'uganda', 'rwanda',
  'botswana', 'namibia', 'zambia', 'zimbabwe', 'angola', 'mozambique', 'madagascar', 'mauritius', 'senegal', 'ivory_coast',
  'brazil', 'russia', 'india', 'china', 'iran', 'egypt_brics', 'ethiopia_brics', 'uae', 'saudi_arabia'
]);

// Account type enum
export const accountTypeEnum = pgEnum('account_type', ['individual', 'business']);

// Users table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // Hashed password
  accountType: accountTypeEnum("account_type").default('individual'),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  companyName: varchar("company_name"),
  businessType: varchar("business_type"),
  taxId: varchar("tax_id"),
  profileImageUrl: varchar("profile_image_url"),
  country: countryEnum("country"),
  role: userRoleEnum("role").default('user'),
  tsuBalance: decimal("tsu_balance", { precision: 18, scale: 8 }).default('0'),
  verifiedEthAddress: varchar("verified_eth_address"), // User's verified Ethereum wallet address
  verifiedBtcAddress: varchar("verified_btc_address"), // User's verified Bitcoin wallet address
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

// Payment verification tracking for replay protection
export const processedPayments = pgTable("processed_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentReference: varchar("payment_reference").notNull().unique(), // tx hash
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amountProcessed: decimal("amount_processed", { precision: 18, scale: 8 }).notNull(),
  tsuCredited: decimal("tsu_credited", { precision: 18, scale: 8 }).notNull(),
  verificationData: jsonb("verification_data"), // receipt, confirmations etc
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMTP configuration table for admin
export const smtpConfig = pgTable("smtp_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  host: varchar("host").notNull(),
  port: integer("port").notNull(),
  secure: boolean("secure").default(true), // true for 465, false for other ports
  username: varchar("username").notNull(),
  password: varchar("password").notNull(), // Encrypted
  fromEmail: varchar("from_email").notNull(),
  fromName: varchar("from_name").default('TSU Wallet'),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site metadata for social media sharing
export const siteMetadata = pgTable("site_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  keywords: text("keywords"),
  ogImage: varchar("og_image"), // URL to social media image
  ogType: varchar("og_type").default('website'), // Open Graph content type
  ogUrl: varchar("og_url"), // Canonical URL for the page
  twitterCard: varchar("twitter_card").default('summary_large_image'),
  siteName: varchar("site_name").default('TSU Wallet'),
  fbAppId: varchar("fb_app_id").default('966242223397117'), // Facebook App ID
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Registration status enum
export const registrationStatusEnum = pgEnum('registration_status', ['pending', 'approved', 'rejected', 'under_review']);

// Commodity registrations table
export const commodityRegistrations = pgTable("commodity_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  contactPhone: varchar("contact_phone"),
  location: varchar("location").notNull(),
  country: countryEnum("country").notNull(),
  commodityType: varchar("commodity_type").notNull(),
  quantity: varchar("quantity").notNull(),
  additionalInfo: text("additional_info"),
  status: registrationStatusEnum("status").default('pending'),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

// Currency conversion registrations table  
export const currencyRegistrations = pgTable("currency_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  contactPhone: varchar("contact_phone"),
  location: varchar("location").notNull(),
  country: countryEnum("country").notNull(),
  currencyType: varchar("currency_type").notNull(),
  amount: varchar("amount").notNull(),
  purpose: text("purpose"),
  additionalInfo: text("additional_info"),
  status: registrationStatusEnum("status").default('pending'),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

// Contact messages table
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  respondedBy: varchar("responded_by").references(() => users.id),
});

// Security Features Tables

// Login attempts tracking for security
export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  ipAddress: varchar("ip_address").notNull(),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  failureReason: varchar("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rate limiting for API protection
export const rateLimits = pgTable("rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: varchar("identifier").notNull(), // IP address or user ID
  endpoint: varchar("endpoint").notNull(),
  requestCount: integer("request_count").default(1),
  windowStart: timestamp("window_start").defaultNow(),
  resetAt: timestamp("reset_at").notNull(),
});

// KYC verification documents
export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  documentType: varchar("document_type").notNull(), // passport, national_id, etc.
  documentNumber: varchar("document_number"),
  documentUrl: varchar("document_url"), // URL to uploaded document
  status: varchar("status").default('pending'), // pending, approved, rejected
  verificationNotes: text("verification_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

// Notifications system
export const notificationTypeEnum = pgEnum('notification_type', ['transaction', 'security', 'kyc', 'system', 'payment']);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exchange rates for real-time pricing
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: varchar("from_currency").notNull(),
  toCurrency: varchar("to_currency").notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  source: varchar("source").default('manual'), // manual, api, calculated
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// API keys for partner integrations
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  keyHash: varchar("key_hash").notNull().unique(), // Hashed API key
  permissions: jsonb("permissions").notNull(), // Array of allowed endpoints/actions
  userId: varchar("user_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Security audit logs
export const securityLogs = pgTable("security_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // login, logout, password_change, etc.
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  severity: varchar("severity").default('info'), // info, warning, error, critical
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const smtpConfigRelations = relations(smtpConfig, ({ one }) => ({
  createdBy: one(users, {
    fields: [smtpConfig.createdBy],
    references: [users.id],
  }),
}));

export const commodityRegistrationsRelations = relations(commodityRegistrations, ({ one }) => ({
  reviewedBy: one(users, {
    fields: [commodityRegistrations.reviewedBy],
    references: [users.id],
  }),
}));

export const currencyRegistrationsRelations = relations(currencyRegistrations, ({ one }) => ({
  reviewedBy: one(users, {
    fields: [currencyRegistrations.reviewedBy],
    references: [users.id],
  }),
}));

export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  respondedBy: one(users, {
    fields: [contactMessages.respondedBy],
    references: [users.id],
  }),
}));

export const kycVerificationsRelations = relations(kycVerifications, ({ one }) => ({
  user: one(users, {
    fields: [kycVerifications.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [kycVerifications.reviewedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  updatedBy: one(users, {
    fields: [exchangeRates.updatedBy],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

export const securityLogsRelations = relations(securityLogs, ({ one }) => ({
  user: one(users, {
    fields: [securityLogs.userId],
    references: [users.id],
  }),
}));

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertSmtpConfigSchema = createInsertSchema(smtpConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteMetadataSchema = createInsertSchema(siteMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommodityRegistrationSchema = createInsertSchema(commodityRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCurrencyRegistrationSchema = createInsertSchema(currencyRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).omit({
  id: true,
  createdAt: true,
});

export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  windowStart: true,
});

export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
  id: true,
  submittedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
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
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertSmtpConfig = z.infer<typeof insertSmtpConfigSchema>;
export type SmtpConfig = typeof smtpConfig.$inferSelect;
export type InsertSiteMetadata = z.infer<typeof insertSiteMetadataSchema>;
export type SiteMetadata = typeof siteMetadata.$inferSelect;
export type InsertCommodityRegistration = z.infer<typeof insertCommodityRegistrationSchema>;
export type CommodityRegistration = typeof commodityRegistrations.$inferSelect;
export type InsertCurrencyRegistration = z.infer<typeof insertCurrencyRegistrationSchema>;
export type CurrencyRegistration = typeof currencyRegistrations.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;

export const insertProcessedPaymentSchema = createInsertSchema(processedPayments).omit({
  id: true,
  createdAt: true,
});

export type InsertProcessedPayment = z.infer<typeof insertProcessedPaymentSchema>;
export type ProcessedPayment = typeof processedPayments.$inferSelect;

// Country options for forms
export const COUNTRY_OPTIONS = [
  { value: 'south_africa', label: 'South Africa', region: 'Africa' },
  { value: 'nigeria', label: 'Nigeria', region: 'Africa' },
  { value: 'kenya', label: 'Kenya', region: 'Africa' },
  { value: 'ghana', label: 'Ghana', region: 'Africa' },
  { value: 'egypt', label: 'Egypt', region: 'Africa' },
  { value: 'morocco', label: 'Morocco', region: 'Africa' },
  { value: 'ethiopia', label: 'Ethiopia', region: 'Africa' },
  { value: 'tanzania', label: 'Tanzania', region: 'Africa' },
  { value: 'uganda', label: 'Uganda', region: 'Africa' },
  { value: 'rwanda', label: 'Rwanda', region: 'Africa' },
  { value: 'botswana', label: 'Botswana', region: 'Africa' },
  { value: 'namibia', label: 'Namibia', region: 'Africa' },
  { value: 'zambia', label: 'Zambia', region: 'Africa' },
  { value: 'zimbabwe', label: 'Zimbabwe', region: 'Africa' },
  { value: 'angola', label: 'Angola', region: 'Africa' },
  { value: 'mozambique', label: 'Mozambique', region: 'Africa' },
  { value: 'madagascar', label: 'Madagascar', region: 'Africa' },
  { value: 'mauritius', label: 'Mauritius', region: 'Africa' },
  { value: 'senegal', label: 'Senegal', region: 'Africa' },
  { value: 'ivory_coast', label: 'Ivory Coast', region: 'Africa' },
  { value: 'brazil', label: 'Brazil', region: 'BRICS' },
  { value: 'russia', label: 'Russia', region: 'BRICS' },
  { value: 'india', label: 'India', region: 'BRICS' },
  { value: 'china', label: 'China', region: 'BRICS' },
  { value: 'iran', label: 'Iran', region: 'BRICS' },
  { value: 'uae', label: 'United Arab Emirates', region: 'BRICS' },
  { value: 'saudi_arabia', label: 'Saudi Arabia', region: 'BRICS' },
] as const;
