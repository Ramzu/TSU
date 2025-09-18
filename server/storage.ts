import {
  users,
  transactions,
  coinSupply,
  content,
  tsuRates,
  paymentTransactions,
  siteMetadata,
  passwordResetTokens,
  smtpConfig,
  commodityRegistrations,
  currencyRegistrations,
  contactMessages,
  notifications,
  kycVerifications,
  exchangeRates,
  securityLogs,
  loginAttempts,
  processedPayments,
  type User,
  type UpsertUser,
  type InsertTransaction,
  type Transaction,
  type InsertCoinSupply,
  type CoinSupply,
  type InsertContent,
  type Content,
  type InsertTsuRates,
  type TsuRates,
  type InsertPaymentTransaction,
  type PaymentTransaction,
  type InsertSiteMetadata,
  type SiteMetadata,
  type InsertPasswordResetToken,
  type PasswordResetToken,
  type InsertSmtpConfig,
  type SmtpConfig,
  type InsertCommodityRegistration,
  type CommodityRegistration,
  type InsertCurrencyRegistration,
  type CurrencyRegistration,
  type InsertContactMessage,
  type ContactMessage,
  type InsertNotification,
  type Notification,
  type InsertKycVerification,
  type KycVerification,
  type InsertExchangeRate,
  type ExchangeRate,
  type InsertSecurityLog,
  type SecurityLog,
  type InsertLoginAttempt,
  type LoginAttempt,
  type InsertProcessedPayment,
  type ProcessedPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: 'user' | 'admin' | 'super_admin'): Promise<User[]>;
  getUsersByCountry(country: string): Promise<User[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  getAllTransactions(limit?: number): Promise<Transaction[]>;
  
  // Coin supply operations
  createCoinSupply(coinSupply: InsertCoinSupply): Promise<CoinSupply>;
  getLatestCoinSupply(): Promise<CoinSupply | undefined>;
  
  // Content operations
  getContent(key: string): Promise<Content | undefined>;
  getAllContent(): Promise<Content[]>;
  upsertContent(content: InsertContent): Promise<Content>;
  
  // Admin operations
  promoteUserToAdmin(userId: string, role: 'admin' | 'super_admin'): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  // TSU rates operations
  getTsuRates(): Promise<TsuRates | undefined>;
  upsertTsuRates(rates: InsertTsuRates): Promise<TsuRates>;
  
  // Payment operations
  createPaymentTransaction(payment: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  updatePaymentStatus(id: string, status: string, providerRef?: string): Promise<void>;
  
  // Site metadata operations
  getSiteMetadata(): Promise<SiteMetadata | undefined>;
  upsertSiteMetadata(metadata: InsertSiteMetadata): Promise<SiteMetadata>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  cleanupExpiredTokens(): Promise<void>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
  
  // SMTP configuration operations
  getSmtpConfig(): Promise<SmtpConfig | undefined>;
  upsertSmtpConfig(config: InsertSmtpConfig): Promise<SmtpConfig>;
  
  // Commodity registration operations
  createCommodityRegistration(registration: InsertCommodityRegistration): Promise<CommodityRegistration>;
  getAllCommodityRegistrations(): Promise<CommodityRegistration[]>;
  updateCommodityRegistration(id: string, updates: Partial<CommodityRegistration>): Promise<CommodityRegistration>;
  
  // Currency registration operations
  createCurrencyRegistration(registration: InsertCurrencyRegistration): Promise<CurrencyRegistration>;
  getAllCurrencyRegistrations(): Promise<CurrencyRegistration[]>;
  updateCurrencyRegistration(id: string, updates: Partial<CurrencyRegistration>): Promise<CurrencyRegistration>;
  
  // Contact message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  updateContactMessage(id: string, updates: Partial<ContactMessage>): Promise<ContactMessage>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // KYC operations
  createKycVerification(kyc: InsertKycVerification): Promise<KycVerification>;
  getUserKycVerification(userId: string): Promise<KycVerification | undefined>;
  getAllKycVerifications(): Promise<KycVerification[]>;
  updateKycStatus(kycId: string, status: string, notes?: string, reviewerId?: string): Promise<void>;
  
  // Exchange rate operations
  createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate>;
  getAllExchangeRates(): Promise<ExchangeRate[]>;
  getExchangeRatesByCurrency(fromCurrency: string, toCurrency?: string): Promise<ExchangeRate[]>;
  updateExchangeRate(rateId: string, newRate: string): Promise<void>;
  
  // Security operations
  createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog>;
  getUserSecurityLogs(userId: string, limit?: number): Promise<SecurityLog[]>;
  createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt>;
  getRecentLoginAttempts(email: string, hoursBack?: number): Promise<LoginAttempt[]>;
  
  // Payment verification for replay protection
  getProcessedPayment(paymentReference: string): Promise<ProcessedPayment | undefined>;
  recordProcessedPayment(payment: InsertProcessedPayment): Promise<ProcessedPayment>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ tsuBalance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getUsersByRole(role: 'user' | 'admin' | 'super_admin'): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByCountry(country: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.country, country as any));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getAllTransactions(limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  // Coin supply operations
  async createCoinSupply(coinSupplyData: InsertCoinSupply): Promise<CoinSupply> {
    const [newCoinSupply] = await db
      .insert(coinSupply)
      .values(coinSupplyData)
      .returning();
    return newCoinSupply;
  }

  async getLatestCoinSupply(): Promise<CoinSupply | undefined> {
    const [latest] = await db
      .select()
      .from(coinSupply)
      .orderBy(desc(coinSupply.createdAt))
      .limit(1);
    return latest;
  }

  // Content operations
  async getContent(key: string): Promise<Content | undefined> {
    const [contentItem] = await db
      .select()
      .from(content)
      .where(and(eq(content.key, key), eq(content.isActive, true)));
    return contentItem;
  }

  async getAllContent(): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(eq(content.isActive, true))
      .orderBy(content.section, content.key);
  }

  async upsertContent(contentData: InsertContent): Promise<Content> {
    const [contentItem] = await db
      .insert(content)
      .values(contentData)
      .onConflictDoUpdate({
        target: content.key,
        set: {
          ...contentData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return contentItem;
  }

  // Admin operations
  async promoteUserToAdmin(userId: string, role: 'admin' | 'super_admin'): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    await db
      .delete(users)
      .where(eq(users.id, userId));
  }
  
  // TSU rates operations
  async getTsuRates(): Promise<TsuRates | undefined> {
    const [rates] = await db.select().from(tsuRates).where(eq(tsuRates.isActive, true)).orderBy(desc(tsuRates.updatedAt));
    return rates;
  }

  async upsertTsuRates(ratesData: InsertTsuRates): Promise<TsuRates> {
    // Deactivate old rates
    await db.update(tsuRates).set({ isActive: false });
    
    // Insert new rates
    const [rates] = await db
      .insert(tsuRates)
      .values({ ...ratesData, isActive: true })
      .returning();
    return rates;
  }
  
  // Payment operations
  async createPaymentTransaction(paymentData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [payment] = await db
      .insert(paymentTransactions)
      .values(paymentData)
      .returning();
    return payment;
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const [payment] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return payment;
  }

  async updatePaymentStatus(id: string, status: string, providerRef?: string): Promise<void> {
    const updateData: any = { paymentStatus: status };
    if (providerRef) {
      updateData.paymentProviderRef = providerRef;
    }
    
    await db
      .update(paymentTransactions)
      .set(updateData)
      .where(eq(paymentTransactions.id, id));
  }

  // Site metadata operations
  async getSiteMetadata(): Promise<SiteMetadata | undefined> {
    const [metadata] = await db
      .select()
      .from(siteMetadata)
      .where(eq(siteMetadata.isActive, true))
      .orderBy(desc(siteMetadata.createdAt))
      .limit(1);
    return metadata;
  }

  async upsertSiteMetadata(metadataData: InsertSiteMetadata): Promise<SiteMetadata> {
    // Deactivate existing metadata
    await db
      .update(siteMetadata)
      .set({ isActive: false })
      .where(eq(siteMetadata.isActive, true));

    // Create new metadata
    const [metadata] = await db
      .insert(siteMetadata)
      .values(metadataData)
      .returning();
    return metadata;
  }

  // Password reset operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false)
      ));
    return tokenData;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await db
      .delete(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.used, false),
        // Delete expired tokens
        eq(passwordResetTokens.expiresAt, now)
      ));
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: newPasswordHash,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // SMTP configuration operations
  async getSmtpConfig(): Promise<SmtpConfig | undefined> {
    const [config] = await db
      .select()
      .from(smtpConfig)
      .where(eq(smtpConfig.isActive, true))
      .orderBy(desc(smtpConfig.createdAt))
      .limit(1);
    return config;
  }

  async upsertSmtpConfig(configData: InsertSmtpConfig): Promise<SmtpConfig> {
    // First, deactivate all existing configs
    await db
      .update(smtpConfig)
      .set({ isActive: false, updatedAt: new Date() });

    // Then insert the new config
    const [config] = await db
      .insert(smtpConfig)
      .values({
        ...configData,
        isActive: true,
      })
      .returning();
    return config;
  }

  // Commodity registration operations
  async createCommodityRegistration(registrationData: InsertCommodityRegistration): Promise<CommodityRegistration> {
    const [registration] = await db
      .insert(commodityRegistrations)
      .values(registrationData)
      .returning();
    return registration;
  }

  async getAllCommodityRegistrations(): Promise<CommodityRegistration[]> {
    return await db
      .select()
      .from(commodityRegistrations)
      .orderBy(desc(commodityRegistrations.createdAt));
  }

  async updateCommodityRegistration(id: string, updates: Partial<CommodityRegistration>): Promise<CommodityRegistration> {
    const [registration] = await db
      .update(commodityRegistrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commodityRegistrations.id, id))
      .returning();
    return registration;
  }

  // Currency registration operations
  async createCurrencyRegistration(registrationData: InsertCurrencyRegistration): Promise<CurrencyRegistration> {
    const [registration] = await db
      .insert(currencyRegistrations)
      .values(registrationData)
      .returning();
    return registration;
  }

  async getAllCurrencyRegistrations(): Promise<CurrencyRegistration[]> {
    return await db
      .select()
      .from(currencyRegistrations)
      .orderBy(desc(currencyRegistrations.createdAt));
  }

  async updateCurrencyRegistration(id: string, updates: Partial<CurrencyRegistration>): Promise<CurrencyRegistration> {
    const [registration] = await db
      .update(currencyRegistrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(currencyRegistrations.id, id))
      .returning();
    return registration;
  }

  // Contact message operations
  async createContactMessage(messageData: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db
      .insert(contactMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessage(id: string, updates: Partial<ContactMessage>): Promise<ContactMessage> {
    const [message] = await db
      .update(contactMessages)
      .set(updates)
      .where(eq(contactMessages.id, id))
      .returning();
    return message;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, limit = 10): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // KYC operations
  async createKycVerification(kyc: InsertKycVerification): Promise<KycVerification> {
    const [verification] = await db
      .insert(kycVerifications)
      .values(kyc)
      .returning();
    return verification;
  }

  async getUserKycVerification(userId: string): Promise<KycVerification | undefined> {
    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.submittedAt))
      .limit(1);
    return verification;
  }

  async getAllKycVerifications(): Promise<KycVerification[]> {
    return await db
      .select()
      .from(kycVerifications)
      .orderBy(desc(kycVerifications.submittedAt));
  }

  async updateKycStatus(kycId: string, status: string, notes?: string, reviewerId?: string): Promise<void> {
    await db
      .update(kycVerifications)
      .set({
        status: status as any,
        verificationNotes: notes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(kycVerifications.id, kycId));
  }

  // Exchange rate operations
  async createExchangeRate(rate: InsertExchangeRate): Promise<ExchangeRate> {
    const [newRate] = await db
      .insert(exchangeRates)
      .values(rate)
      .returning();
    return newRate;
  }

  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.isActive, true))
      .orderBy(desc(exchangeRates.updatedAt));
  }

  async getExchangeRatesByCurrency(fromCurrency: string, toCurrency?: string): Promise<ExchangeRate[]> {
    const conditions = [
      eq(exchangeRates.fromCurrency, fromCurrency),
      eq(exchangeRates.isActive, true)
    ];

    if (toCurrency) {
      conditions.push(eq(exchangeRates.toCurrency, toCurrency));
    }

    return await db
      .select()
      .from(exchangeRates)
      .where(and(...conditions))
      .orderBy(desc(exchangeRates.updatedAt));
  }

  async updateExchangeRate(rateId: string, newRate: string): Promise<void> {
    await db
      .update(exchangeRates)
      .set({
        rate: newRate,
        updatedAt: new Date(),
      })
      .where(eq(exchangeRates.id, rateId));
  }

  // Security operations
  async createSecurityLog(log: InsertSecurityLog): Promise<SecurityLog> {
    const [newLog] = await db
      .insert(securityLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getUserSecurityLogs(userId: string, limit = 10): Promise<SecurityLog[]> {
    return await db
      .select()
      .from(securityLogs)
      .where(eq(securityLogs.userId, userId))
      .orderBy(desc(securityLogs.createdAt))
      .limit(limit);
  }

  async createLoginAttempt(attempt: InsertLoginAttempt): Promise<LoginAttempt> {
    const [newAttempt] = await db
      .insert(loginAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  async getRecentLoginAttempts(email: string, hoursBack = 24): Promise<LoginAttempt[]> {
    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - hoursBack);

    return await db
      .select()
      .from(loginAttempts)
      .where(and(
        eq(loginAttempts.email, email),
        desc(loginAttempts.createdAt)
      ))
      .orderBy(desc(loginAttempts.createdAt));
  }

  // Payment verification for replay protection
  async getProcessedPayment(paymentReference: string): Promise<ProcessedPayment | undefined> {
    const [payment] = await db
      .select()
      .from(processedPayments)
      .where(eq(processedPayments.paymentReference, paymentReference));
    return payment;
  }

  async recordProcessedPayment(payment: InsertProcessedPayment): Promise<ProcessedPayment> {
    const [newPayment] = await db
      .insert(processedPayments)
      .values(payment)
      .returning();
    return newPayment;
  }
}

export const storage = new DatabaseStorage();
