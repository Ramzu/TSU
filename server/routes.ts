import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertCoinSupplySchema, insertContentSchema, insertPaymentTransactionSchema, insertCommodityRegistrationSchema, insertCurrencyRegistrationSchema, insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { emailService } from "./emailService";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

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
      const { email, password, firstName, lastName, country } = req.body;
      
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
        country,
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

  // Password reset request endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist (security)
        return res.json({ message: "If the email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
      });

      // Send email
      try {
        await emailService.sendPasswordResetEmail(
          user.email!,
          resetToken,
          user.firstName || undefined
        );
        res.json({ message: "If the email exists, a password reset link has been sent." });
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        res.status(500).json({ message: "Failed to send password reset email. Please contact support." });
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Password reset confirmation endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
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
  app.get('/api/users/transactions', async (req: any, res) => {
    try {
      let userId;
      
      // Check both simple login session and Replit auth
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // TSU purchase endpoint
  app.post('/api/tsu/purchase', async (req: any, res) => {
    try {
      // For simple login, check session-based auth
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { amount, currency, paymentMethod, paymentReference } = req.body;
      
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
      
      // For PayPal, only update balance if payment reference is provided (payment confirmed)
      if (paymentMethod === 'paypal' && !paymentReference) {
        return res.status(400).json({ message: "Payment confirmation required for PayPal transactions" });
      }
      
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
        metadata: { paymentMethod, processingFee: processingFee.toString(), tsuPrice: tsuPrice.toString(), paymentReference },
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
        return res.status(401).json({ message: "Authentication required" });
      }
      
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
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
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
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getUsersByRole('user');
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all transactions (admin only)
  app.get('/api/admin/transactions', requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create TSU coins (admin only)
  app.post('/api/admin/coins/create', requireAdmin, async (req: any, res) => {
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
  app.post('/api/admin/users/promote', requireAdmin, async (req: any, res) => {
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

  // SMTP configuration (admin only)
  app.get('/api/admin/smtp-config', requireAdmin, async (req: any, res) => {
    try {
      const config = await storage.getSmtpConfig();
      if (config) {
        // Don't send password in response
        const { password, ...safeConfig } = config;
        res.json(safeConfig);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching SMTP config:", error);
      res.status(500).json({ message: "Failed to fetch SMTP configuration" });
    }
  });

  app.post('/api/admin/smtp-config', requireAdmin, async (req: any, res) => {
    try {
      const { host, port, secure, username, password, fromEmail, fromName } = req.body;
      
      if (!host || !port || !username || !password || !fromEmail) {
        return res.status(400).json({ message: "Missing required SMTP configuration fields" });
      }

      const config = await storage.upsertSmtpConfig({
        host,
        port: parseInt(port),
        secure: secure === true || secure === 'true',
        username,
        password, // TODO: Encrypt this in production
        fromEmail,
        fromName: fromName || 'TSU Wallet',
        createdBy: req.currentUser.id,
      });
      
      // Don't send password in response
      const { password: _, ...safeConfig } = config;
      res.json(safeConfig);
    } catch (error) {
      console.error("Error updating SMTP config:", error);
      res.status(500).json({ message: "Failed to update SMTP configuration" });
    }
  });

  // Test SMTP configuration (admin only)
  app.post('/api/admin/smtp-test', requireAdmin, async (req: any, res) => {
    try {
      const result = await emailService.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Error testing SMTP connection:", error);
      res.status(500).json({ message: "Failed to test SMTP connection" });
    }
  });

  // PayPal routes (API paths)
  app.get("/api/paypal/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(503).json({ 
        error: "PayPal service unavailable", 
        message: "PayPal credentials are invalid. Please check your PayPal Client ID and Secret." 
      });
    }
  });

  app.post("/api/paypal/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(503).json({ 
        error: "PayPal service unavailable", 
        message: "Cannot create PayPal order. Please check PayPal configuration." 
      });
    }
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(503).json({ 
        error: "PayPal service unavailable", 
        message: "Cannot capture PayPal payment. Please try again." 
      });
    }
  });

  // PayPal routes (legacy paths expected by PayPal component)
  app.get("/setup", async (req, res) => {
    try {
      await loadPaypalDefault(req, res);
    } catch (error) {
      console.error("PayPal setup error:", error);
      res.status(503).json({ 
        error: "PayPal service unavailable", 
        message: "PayPal credentials are invalid. Please check your PayPal Client ID and Secret." 
      });
    }
  });

  app.post("/order", async (req, res) => {
    try {
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(503).json({ 
        error: "PayPal service unavailable", 
        message: "Cannot create PayPal order. Please check PayPal configuration." 
      });
    }
  });

  app.post("/order/:orderID/capture", async (req, res) => {
    try {
      await capturePaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(503).json({ 
        error: "PayPal service unavailable", 
        message: "Cannot capture PayPal payment. Please try again." 
      });
    }
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

  app.post('/api/content', requireAdmin, async (req: any, res) => {
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

  // Commodity Registration endpoints
  app.post('/api/commodity-registrations', async (req, res) => {
    try {
      const validation = insertCommodityRegistrationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: validation.error.issues
        });
      }

      const registration = await storage.createCommodityRegistration(validation.data);
      res.json(registration);
    } catch (error) {
      console.error("Error creating commodity registration:", error);
      res.status(500).json({ message: "Failed to submit registration" });
    }
  });

  app.get('/api/commodity-registrations', requireAdmin, async (req: any, res) => {
    try {
      const registrations = await storage.getAllCommodityRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching commodity registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.put('/api/commodity-registrations/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      const registration = await storage.updateCommodityRegistration(id, {
        status,
        adminNotes,
        reviewedBy: req.currentUser.id,
      });
      
      res.json(registration);
    } catch (error) {
      console.error("Error updating commodity registration:", error);
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  // Currency Registration endpoints
  app.post('/api/currency-registrations', async (req, res) => {
    try {
      const validation = insertCurrencyRegistrationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid registration data",
          errors: validation.error.issues
        });
      }

      const registration = await storage.createCurrencyRegistration(validation.data);
      res.json(registration);
    } catch (error) {
      console.error("Error creating currency registration:", error);
      res.status(500).json({ message: "Failed to submit registration" });
    }
  });

  app.get('/api/currency-registrations', requireAdmin, async (req: any, res) => {
    try {
      const registrations = await storage.getAllCurrencyRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching currency registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.put('/api/currency-registrations/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      const registration = await storage.updateCurrencyRegistration(id, {
        status,
        adminNotes,
        reviewedBy: req.currentUser.id,
      });
      
      res.json(registration);
    } catch (error) {
      console.error("Error updating currency registration:", error);
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  // Contact Messages endpoints
  app.post('/api/contact-messages', async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid message data",
          errors: validation.error.issues
        });
      }

      const message = await storage.createContactMessage(validation.data);
      res.json(message);
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/contact-messages', requireAdmin, async (req: any, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put('/api/contact-messages/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isRead, adminResponse } = req.body;
      
      const message = await storage.updateContactMessage(id, {
        isRead,
        adminResponse,
        respondedBy: req.currentUser.id,
        respondedAt: adminResponse ? new Date() : undefined,
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error updating contact message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // Update TSU rates (admin only)
  app.put('/api/admin/tsu-rates', requireAdmin, async (req: any, res) => {
    try {
      const ratesData = req.body;
      ratesData.updatedBy = req.currentUser.id;
      
      const updatedRates = await storage.upsertTsuRates(ratesData);
      res.json(updatedRates);
    } catch (error) {
      console.error("Error updating TSU rates:", error);
      res.status(500).json({ message: "Failed to update rates" });
    }
  });

  // Site metadata admin routes
  app.get('/api/admin/metadata', requireAdmin, async (req: any, res) => {
    try {
      const metadata = await storage.getSiteMetadata();
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ message: "Failed to fetch metadata" });
    }
  });

  app.post('/api/admin/metadata', requireAdmin, async (req: any, res) => {
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

  // Admin registration endpoint (super admin only)
  app.post('/api/admin/register', requireAdmin, async (req: any, res) => {
    try {
      // Only super admins can create other admins
      if (req.currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { email, password, firstName, lastName, country, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      if (!['admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'super_admin'" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Hash password and create admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        country,
        role,
        tsuBalance: "0.0",
      });
      
      // Don't return password in response
      const { password: _, ...safeAdmin } = newAdmin;
      res.json({ admin: safeAdmin, message: "Admin created successfully" });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Balance management endpoints (super admin only)
  app.post('/api/admin/balance/adjust', requireAdmin, async (req: any, res) => {
    try {
      if (req.currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { amount, operation } = req.body; // operation: 'increase' or 'decrease'
      
      if (!amount || !operation || !['increase', 'decrease'].includes(operation)) {
        return res.status(400).json({ message: "Valid amount and operation required" });
      }

      const adjustmentAmount = parseFloat(amount);
      if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }

      // Get current supply
      const currentSupply = await storage.getLatestCoinSupply();
      const currentTotal = parseFloat(currentSupply?.totalSupply || '0');
      const currentCirculating = parseFloat(currentSupply?.circulatingSupply || '0');

      // Calculate new totals
      const newTotal = operation === 'increase' 
        ? currentTotal + adjustmentAmount 
        : currentTotal - adjustmentAmount;
      const newCirculating = operation === 'increase' 
        ? currentCirculating + adjustmentAmount 
        : currentCirculating - adjustmentAmount;

      if (newTotal < 0 || newCirculating < 0) {
        return res.status(400).json({ message: "Cannot reduce supply below zero" });
      }

      // Create new supply record
      const newSupply = await storage.createCoinSupply({
        totalSupply: newTotal.toString(),
        circulatingSupply: newCirculating.toString(),
        reserveGold: currentSupply?.reserveGold || '0',
        reserveBrics: currentSupply?.reserveBrics || '0',
        reserveCommodities: currentSupply?.reserveCommodities || '0',
        reserveAfrican: currentSupply?.reserveAfrican || '0',
        createdBy: req.currentUser.id,
      });

      // Create transaction record
      await storage.createTransaction({
        userId: req.currentUser.id,
        type: operation === 'increase' ? 'creation' : 'sale',
        amount: adjustmentAmount.toString(),
        currency: 'TSU',
        description: `${operation === 'increase' ? 'Created' : 'Destroyed'} ${adjustmentAmount} TSU coins`,
      });

      res.json({ newSupply, message: "Balance adjusted successfully" });
    } catch (error) {
      console.error("Error adjusting balance:", error);
      res.status(500).json({ message: "Failed to adjust balance" });
    }
  });

  // Distribute coins by country (super admin only)
  app.post('/api/admin/distribute-coins', requireAdmin, async (req: any, res) => {
    try {
      if (req.currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { country, amount, reason } = req.body;
      
      if (!country || !amount || !reason) {
        return res.status(400).json({ message: "Country, amount, and reason are required" });
      }

      const distributionAmount = parseFloat(amount);
      if (isNaN(distributionAmount) || distributionAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }

      // Get all users from the specified country
      const usersInCountry = await storage.getUsersByCountry(country);
      
      if (usersInCountry.length === 0) {
        return res.status(400).json({ message: `No users found in ${country}` });
      }

      // Calculate amount per user
      const amountPerUser = distributionAmount / usersInCountry.length;
      
      // Update each user's balance
      const updatedUsers = [];
      for (const user of usersInCountry) {
        const newBalance = (parseFloat(user.tsuBalance || '0') + amountPerUser).toString();
        await storage.updateUserBalance(user.id, newBalance);
        
        // Create transaction record for each user
        await storage.createTransaction({
          userId: user.id,
          type: 'transfer',
          amount: amountPerUser.toString(),
          currency: 'TSU',
          description: `${reason} - Country distribution to ${country}`,
        });
        
        updatedUsers.push({ ...user, tsuBalance: newBalance });
      }

      res.json({ 
        distributedTo: usersInCountry.length, 
        amountPerUser: amountPerUser.toString(),
        totalDistributed: distributionAmount.toString(),
        message: "Coins distributed successfully" 
      });
    } catch (error) {
      console.error("Error distributing coins:", error);
      res.status(500).json({ message: "Failed to distribute coins" });
    }
  });

  // Get country statistics (admin only)
  app.get('/api/admin/country-stats', requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Group users by country and calculate statistics
      const countryStats = allUsers.reduce((acc: any, user) => {
        if (!user.country) return acc;
        
        if (!acc[user.country]) {
          acc[user.country] = {
            country: user.country,
            userCount: 0,
            totalBalance: 0,
          };
        }
        
        acc[user.country].userCount++;
        acc[user.country].totalBalance += parseFloat(user.tsuBalance || '0');
        
        return acc;
      }, {});

      // Convert to array and format
      const statsArray = Object.values(countryStats).map((stat: any) => ({
        ...stat,
        totalBalance: stat.totalBalance.toFixed(8),
      }));

      res.json(statsArray);
    } catch (error) {
      console.error("Error getting country stats:", error);
      res.status(500).json({ message: "Failed to get country statistics" });
    }
  });

  // New Feature Endpoints

  // Notifications API
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session.userId;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session.userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // KYC Verification API
  app.get('/api/kyc/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session.userId;
      const kycVerification = await storage.getUserKycVerification(userId);
      
      if (!kycVerification) {
        return res.json({ status: 'not_submitted' });
      }
      
      res.json({
        status: kycVerification.status,
        documentType: kycVerification.documentType,
        submittedAt: kycVerification.submittedAt,
        verificationNotes: kycVerification.verificationNotes,
      });
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      res.status(500).json({ message: "Failed to fetch KYC status" });
    }
  });

  app.post('/api/kyc/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session.userId;
      const { documentType, documentNumber, documentUrl } = req.body;

      if (!documentType || !documentNumber) {
        return res.status(400).json({ message: "Document type and number are required" });
      }

      const kycVerification = await storage.createKycVerification({
        userId,
        documentType,
        documentNumber,
        documentUrl,
        status: 'pending',
      });

      // Create notification
      await storage.createNotification({
        userId,
        type: 'kyc',
        title: 'KYC Verification Submitted',
        message: 'Your identity verification documents have been submitted for review.',
      });

      res.json({ kycVerification, message: "KYC verification submitted successfully" });
    } catch (error) {
      console.error("Error submitting KYC:", error);
      res.status(500).json({ message: "Failed to submit KYC verification" });
    }
  });

  // Exchange Rates API
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const rates = await storage.getAllExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  app.get('/api/tsu-rates', async (req, res) => {
    try {
      const tsuRates = await storage.getTsuRates();
      if (!tsuRates) {
        // Return default rates if none exist
        return res.json([{
          baseCurrency: 'USD',
          tsuPrice: '1.00',
          gasolineEquivalent: '1.0000',
          cryptoRates: {
            BTC: 0.000023,
            ETH: 0.00043,
            USD: 1.00,
          },
          updatedAt: new Date().toISOString(),
        }]);
      }
      res.json([tsuRates]);
    } catch (error) {
      console.error("Error fetching TSU rates:", error);
      res.status(500).json({ message: "Failed to fetch TSU rates" });
    }
  });

  // Send TSU API
  app.post('/api/transactions/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session.userId;
      const { recipientEmail, amount, description } = req.body;

      if (!recipientEmail || !amount) {
        return res.status(400).json({ message: "Recipient email and amount are required" });
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }

      // Get sender user
      const sender = await storage.getUser(userId);
      if (!sender) {
        return res.status(404).json({ message: "Sender not found" });
      }

      // Check balance
      const senderBalance = parseFloat(sender.tsuBalance || '0');
      if (senderBalance < transferAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Get recipient user
      const recipient = await storage.getUserByEmail(recipientEmail);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      // Update balances
      const newSenderBalance = (senderBalance - transferAmount).toString();
      const recipientBalance = parseFloat(recipient.tsuBalance || '0');
      const newRecipientBalance = (recipientBalance + transferAmount).toString();

      await storage.updateUserBalance(userId, newSenderBalance);
      await storage.updateUserBalance(recipient.id, newRecipientBalance);

      // Create transactions
      await storage.createTransaction({
        userId: userId,
        type: 'transfer',
        amount: transferAmount.toString(),
        currency: 'TSU',
        fromAddress: sender.email || '',
        toAddress: recipient.email || '',
        description: description || `Transfer to ${recipientEmail}`,
      });

      await storage.createTransaction({
        userId: recipient.id,
        type: 'transfer',
        amount: transferAmount.toString(),
        currency: 'TSU',
        fromAddress: sender.email || '',
        toAddress: recipient.email || '',
        description: description || `Transfer from ${sender.email}`,
      });

      // Create notifications
      await storage.createNotification({
        userId: userId,
        type: 'transaction',
        title: 'TSU Sent',
        message: `You sent ${transferAmount} TSU to ${recipientEmail}`,
      });

      await storage.createNotification({
        userId: recipient.id,
        type: 'transaction',
        title: 'TSU Received',
        message: `You received ${transferAmount} TSU from ${sender.email}`,
      });

      res.json({ 
        message: "Transfer completed successfully",
        newBalance: newSenderBalance,
        transferAmount: transferAmount.toString(),
        recipient: recipientEmail
      });
    } catch (error) {
      console.error("Error sending TSU:", error);
      res.status(500).json({ message: "Failed to send TSU" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
