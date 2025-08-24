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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
  getUsersByRole(role: 'user' | 'admin' | 'super_admin'): Promise<User[]>;
  
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
}

export const storage = new DatabaseStorage();
