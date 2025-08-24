import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertCoinSupplySchema, insertContentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // TSU purchase endpoint
  app.post('/api/tsu/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, currency, paymentMethod } = req.body;
      
      // Validate input
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate TSU amount (1:1 ratio with processing fee)
      const processingFee = parseFloat(amount) * 0.025; // 2.5% fee
      const tsuAmount = (parseFloat(amount) - processingFee).toString();
      
      // Update user balance
      const newBalance = (parseFloat(user.tsuBalance || '0') + parseFloat(tsuAmount)).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: 'purchase',
        amount: tsuAmount,
        currency: 'TSU',
        description: `Purchased ${tsuAmount} TSU with ${amount} ${currency}`,
        metadata: { paymentMethod, processingFee: processingFee.toString() },
      });

      res.json({ transaction, newBalance });
    } catch (error) {
      console.error("Error processing TSU purchase:", error);
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  // Admin routes - require admin role
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      req.currentUser = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };

  // Admin dashboard stats
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersByRole('user');
      const admins = await storage.getUsersByRole('admin');
      const superAdmins = await storage.getUsersByRole('super_admin');
      const transactions = await storage.getAllTransactions();
      const coinSupply = await storage.getLatestCoinSupply();

      const stats = {
        totalUsers: users.length,
        totalAdmins: admins.length + superAdmins.length,
        totalTransactions: transactions.length,
        circulatingSupply: coinSupply?.circulatingSupply || '0',
        totalSupply: coinSupply?.totalSupply || '0',
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all users (admin only)
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getUsersByRole('user');
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all transactions (admin only)
  app.get('/api/admin/transactions', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create TSU coins (admin only)
  app.post('/api/admin/coins/create', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validation = insertCoinSupplySchema.safeParse({
        ...req.body,
        createdBy: req.currentUser.id,
      });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid coin creation data" });
      }

      const coinSupply = await storage.createCoinSupply(validation.data);
      
      // Create transaction record
      await storage.createTransaction({
        userId: req.currentUser.id,
        type: 'creation',
        amount: validation.data.totalSupply,
        currency: 'TSU',
        description: `Created ${validation.data.totalSupply} TSU coins`,
      });

      res.json(coinSupply);
    } catch (error) {
      console.error("Error creating coins:", error);
      res.status(500).json({ message: "Failed to create coins" });
    }
  });

  // Add admin (super admin only)
  app.post('/api/admin/users/promote', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      if (req.currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { userId, role } = req.body;
      
      if (!userId || !['admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid user ID or role" });
      }

      await storage.promoteUserToAdmin(userId, role);
      res.json({ message: "User promoted successfully" });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Content management routes
  app.get('/api/content', async (req, res) => {
    try {
      const content = await storage.getAllContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/content', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validation = insertContentSchema.safeParse({
        ...req.body,
        updatedBy: req.currentUser.id,
      });

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid content data" });
      }

      const content = await storage.upsertContent(validation.data);
      res.json(content);
    } catch (error) {
      console.error("Error saving content:", error);
      res.status(500).json({ message: "Failed to save content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
