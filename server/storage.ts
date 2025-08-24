import {
  users,
  transactions,
  coinSupply,
  content,
  type User,
  type UpsertUser,
  type InsertTransaction,
  type Transaction,
  type InsertCoinSupply,
  type CoinSupply,
  type InsertContent,
  type Content,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
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
}

export const storage = new DatabaseStorage();
