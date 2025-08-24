import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertCoinSupplySchema, insertContentSchema, insertPaymentTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Simple login endpoint
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user
      let user = await storage.getUserByEmail(email);
      
      // Create admin user if it doesn't exist
      if (!user && email === 'admin@tsu-wallet.com') {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'super_admin',
        });
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify password
      if (!user.password) {
        return res.status(401).json({ message: "Password required for this account" });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set session
      (req as any).session.userId = user.id;
      
      res.json({ user, message: "Login successful" });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Simple registration endpoint
  app.post('/api/auth/simple-register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'user',
        tsuBalance: "0.0",
      });
      
      // Set session
      (req as any).session.userId = user.id;
      
      res.json({ user, message: "Registration successful" });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Simple logout endpoint
  app.post('/api/auth/simple-logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Auth routes - support both OIDC and simple auth
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let userId;
      
      // Try session-based auth first (simple auth)
      if (req.session && req.session.userId) {
        userId = req.session.userId;
      }
      // Fall back to OIDC auth
      else if (req.user && req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      }
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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

      // Get current user and TSU rates
      const user = await storage.getUser(userId);
      const rates = await storage.getTsuRates();
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate TSU amount based on current rates
      const processingFee = parseFloat(amount) * 0.025; // 2.5% fee
      const netAmount = parseFloat(amount) - processingFee;
      const tsuPrice = rates ? parseFloat(rates.tsuPrice) : 1.25; // Default $1.25 per TSU
      const tsuAmount = (netAmount / tsuPrice).toString();
      
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
        metadata: { paymentMethod, processingFee: processingFee.toString(), tsuPrice: tsuPrice.toString() },
      });

      res.json({ transaction, newBalance, tsuAmount });
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

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // TSU rates endpoint
  app.get('/api/tsu/rates', async (req, res) => {
    try {
      const rates = await storage.getTsuRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching TSU rates:", error);
      res.status(500).json({ message: "Failed to fetch rates" });
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

  // Update TSU rates (admin only)
  app.put('/api/admin/tsu-rates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const ratesData = req.body;
      ratesData.updatedBy = req.user.claims.sub;
      
      const updatedRates = await storage.upsertTsuRates(ratesData);
      res.json(updatedRates);
    } catch (error) {
      console.error("Error updating TSU rates:", error);
      res.status(500).json({ message: "Failed to update rates" });
    }
  });

  // Site metadata admin routes
  app.get('/api/admin/metadata', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const metadata = await storage.getSiteMetadata();
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ message: "Failed to fetch metadata" });
    }
  });

  app.post('/api/admin/metadata', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { title, description, keywords, ogImage, twitterCard, siteName } = req.body;
      
      const metadata = await storage.upsertSiteMetadata({
        title,
        description,
        keywords,
        ogImage,
        twitterCard,
        siteName,
        createdBy: req.currentUser.id,
      });
      
      res.json(metadata);
    } catch (error) {
      console.error("Error updating metadata:", error);
      res.status(500).json({ message: "Failed to update metadata" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
