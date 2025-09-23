import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertCoinSupplySchema, insertContentSchema, insertPaymentTransactionSchema, insertCommodityRegistrationSchema, insertCurrencyRegistrationSchema, insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { emailService } from "./emailService";
import { paymentVerification } from "./paymentVerification";
import { ethers } from "ethers";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as bitcoinMessage from "bitcoinjs-message";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Configure multer for whitepaper uploads
const whitepaperUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Utility function to check if PayPal credentials are configured
function hasPayPalCredentials(): boolean {
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  
  // Check if both credentials exist - allow both live and sandbox
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

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
      
      // Create admin user if it doesn't exist (DEV ONLY - requires environment variable)
      if (!user && email === 'admin@tsu-wallet.com' && process.env.NODE_ENV === 'development' && process.env.ALLOW_ADMIN_BOOTSTRAP === 'true') {
        const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'tsu-admin-' + Math.random().toString(36).substring(2, 15);
        console.log('🔐 DEVELOPMENT: Created admin user with password:', adminPassword);
        
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
        // Add some debugging info for admin troubleshooting
        console.log('Password verification failed for:', email);
        console.log('User exists:', !!user);
        console.log('Has password:', !!user.password);
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

  // Secured admin password reset endpoint (requires authentication)
  app.post('/api/admin/reset-password', isAuthenticated, async (req, res) => {
    try {
      // Get user ID from either OIDC claims or session
      const userId = (req as any).user?.claims?.sub || (req as any).session?.userId;
      const currentUser = await storage.getUser(userId);
      
      // Only super_admin can reset other admin passwords
      if (!currentUser || currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super administrators can reset passwords" });
      }
      
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Find target user
      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow password reset for admin/super_admin roles
      if (targetUser.role !== 'admin' && targetUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Can only reset admin account passwords" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(targetUser.id, hashedPassword);
      
      res.json({ message: `Password reset successfully for ${email}` });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Rate limiting for registration (anti-spam protection)
  const registrationRateLimit = new Map<string, { count: number; resetTime: number }>();
  const REGISTRATION_LIMIT = 3; // Max registrations per IP per hour
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  // Simple registration endpoint
  app.post('/api/auth/simple-register', async (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Anti-spam rate limiting
      const now = Date.now();
      const rateLimitKey = `reg_${clientIP}`;
      const rateLimit = registrationRateLimit.get(rateLimitKey);
      
      if (rateLimit) {
        if (now < rateLimit.resetTime) {
          if (rateLimit.count >= REGISTRATION_LIMIT) {
            return res.status(429).json({ 
              message: "Too many registration attempts. Please try again later." 
            });
          }
          rateLimit.count += 1;
        } else {
          // Reset the counter after the time window
          registrationRateLimit.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }
      } else {
        registrationRateLimit.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
      
      // Validate request body with Zod schema
      const registrationSchema = z.object({
        accountType: z.enum(['individual', 'business']).default('individual'),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        businessType: z.string().optional(),
        taxId: z.string().optional(),
        country: z.enum([
          'south_africa', 'nigeria', 'kenya', 'ghana', 'egypt', 'morocco', 'ethiopia', 'tanzania', 'uganda', 'rwanda',
          'botswana', 'namibia', 'zambia', 'zimbabwe', 'angola', 'mozambique', 'madagascar', 'mauritius', 'senegal', 'ivory_coast',
          'brazil', 'russia', 'india', 'china', 'iran', 'egypt_brics', 'ethiopia_brics', 'uae', 'saudi_arabia'
        ]),
      }).refine((data) => {
        // Conditional validation for business accounts
        if (data.accountType === 'business') {
          return data.companyName && data.businessType;
        } else {
          return data.firstName && data.lastName;
        }
      }, {
        message: "Business accounts require company name and business type. Individual accounts require first name and last name."
      });
      
      const validationResult = registrationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: validationResult.error.errors[0]?.message || "Invalid registration data" 
        });
      }
      
      const { accountType, email, password, firstName, lastName, companyName, businessType, taxId, country } = validationResult.data;
      
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
        accountType: accountType || 'individual',
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: companyName || '',
        businessType: businessType || '',
        taxId: taxId || '',
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

  // Wallet verification endpoints
  app.post('/api/wallet/verify-challenge', async (req: any, res) => {
    try {
      // Get authenticated user
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Generate a challenge message for the user to sign
      const nonce = Date.now().toString();
      const challenge = `Verify wallet ownership for TSU account ${userId} at ${nonce}`;
      
      // Store challenge in session temporarily
      req.session.walletChallenge = { challenge, nonce, userId };
      
      res.json({ challenge });
    } catch (error) {
      console.error("Error generating wallet challenge:", error);
      res.status(500).json({ message: "Failed to generate challenge" });
    }
  });

  app.post('/api/wallet/verify-signature', async (req: any, res) => {
    try {
      const { signature, address } = req.body;
      
      // Get authenticated user
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if we have a challenge for this session
      const challengeData = req.session.walletChallenge;
      if (!challengeData || challengeData.userId !== userId) {
        return res.status(400).json({ message: "No valid challenge found" });
      }

      // Verify the signature matches the address and challenge
      const recoveredAddress = ethers.verifyMessage(challengeData.challenge, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      // Update user's verified Ethereum address
      await storage.updateUserVerifiedEthAddress(userId, address.toLowerCase());
      
      // Clear the challenge from session
      delete req.session.walletChallenge;
      
      res.json({ 
        success: true,
        verifiedAddress: address.toLowerCase(),
        message: "Wallet verified successfully"
      });
    } catch (error) {
      console.error("Error verifying wallet signature:", error);
      res.status(500).json({ message: "Failed to verify wallet" });
    }
  });

  // Bitcoin wallet verification endpoints
  app.post('/api/wallet/bitcoin/verify-challenge', async (req: any, res) => {
    try {
      // Get authenticated user
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Generate a challenge message for the user to sign with their Bitcoin wallet
      const nonce = Date.now().toString();
      const challenge = `Verify Bitcoin wallet ownership for TSU account ${userId} at ${nonce}`;
      
      // Store challenge in session temporarily
      req.session.btcWalletChallenge = { challenge, nonce, userId };
      
      res.json({ challenge });
    } catch (error) {
      console.error("Error generating Bitcoin wallet challenge:", error);
      res.status(500).json({ message: "Failed to generate challenge" });
    }
  });

  app.post('/api/wallet/bitcoin/verify-signature', async (req: any, res) => {
    try {
      const { signature, address } = req.body;
      
      // Get authenticated user
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if we have a challenge for this session
      const challengeData = req.session.btcWalletChallenge;
      if (!challengeData || challengeData.userId !== userId) {
        return res.status(400).json({ message: "No valid challenge found" });
      }

      // Verify the Bitcoin signature matches the address and challenge
      let isValid = false;
      try {
        isValid = bitcoinMessage.verify(challengeData.challenge, address, signature);
      } catch (error) {
        console.error('Bitcoin signature verification error:', error);
        return res.status(400).json({ message: "Invalid signature format" });
      }
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      // Update user's verified Bitcoin address
      await storage.updateUserVerifiedBtcAddress(userId, address);
      
      // Clear the challenge from session
      delete req.session.btcWalletChallenge;
      
      res.json({ 
        success: true,
        verifiedAddress: address,
        message: "Bitcoin wallet verified successfully"
      });
    } catch (error) {
      console.error("Error verifying Bitcoin wallet signature:", error);
      res.status(500).json({ message: "Failed to verify Bitcoin wallet" });
    }
  });

  // TSU purchase endpoint
  app.post('/api/tsu/purchase', async (req: any, res) => {
    try {
      // SECURITY: ATOMIC REPLAY PROTECTION - Check this FIRST before any other processing
      const { paymentReference } = req.body;
      if (paymentReference) {
        const existingPayment = await storage.getProcessedPayment(paymentReference);
        if (existingPayment) {
          return res.status(409).json({ 
            message: "Payment already processed",
            error: "This transaction has already been used for a TSU purchase" 
          });
        }
      }

      // Get payment method from request body 
      const { amount, currency, paymentMethod } = req.body;
      
      // Block unsupported payment methods
      const supportedMethods = ['ethereum', 'bitcoin', 'paypal'];
      if (!supportedMethods.includes(paymentMethod)) {
        return res.status(400).json({ 
          message: "Unsupported payment method",
          supportedMethods
        });
      }
      
      // Block PayPal purchases if live PayPal credentials are not configured
      if ((paymentMethod === 'paypal' || paymentMethod === 'paypal-card') && !hasPayPalCredentials()) {
        return res.status(503).json({ 
          message: "PayPal purchasing is temporarily unavailable", 
          error: "Service configuration in progress",
          details: "PayPal purchasing is currently disabled while we configure live payment processing. Please try cryptocurrency payments instead."
        });
      }

      // For simple login, check session-based auth
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
      const tsuPrice = rates ? parseFloat(rates.tsuPrice) : 1.00; // Default 1 USD per TSU
      const tsuAmount = (netAmount / tsuPrice).toString();
      
      // Initialize ethPrice for verification data
      let ethPrice: number | undefined;
      
      // Verify payment based on payment method
      if ((paymentMethod === 'paypal' || paymentMethod === 'paypal-card') && !paymentReference) {
        return res.status(400).json({ message: "Payment confirmation required for PayPal transactions" });
      }
      
      if (paymentMethod === 'ethereum') {
        if (!paymentReference) {
          return res.status(400).json({ message: "Transaction hash required for Ethereum payments" });
        }
        
        // Verify Ethereum transaction
        const expectedAddress = process.env.CRYPTO_ETH_ADDRESS;
        if (!expectedAddress) {
          return res.status(500).json({ message: "Ethereum payment address not configured" });
        }
        
        // Get ETH price from crypto rates or use fallback
        let ethPrice = 2000; // fallback ETH price in USD
        if (rates && rates.cryptoRates) {
          try {
            const cryptoRatesData = rates.cryptoRates as any;
            if (cryptoRatesData?.ETH) {
              ethPrice = cryptoRatesData.ETH;
            }
          } catch (e) {
            console.log('Using fallback ETH price');
          }
        }
        
        const expectedAmountWei = ethers.parseEther(
          (parseFloat(amount) / ethPrice).toString()
        ).toString();
        
        // Verify user has a verified Ethereum address
        if (!user.verifiedEthAddress) {
          return res.status(400).json({ 
            message: "Ethereum wallet not verified",
            error: "You must verify your Ethereum wallet address before making payments"
          });
        }

        // Use hardened verification with 3 confirmations and receipt checking
        const verification = await paymentVerification.verifyEthereumTransaction(
          paymentReference,
          expectedAddress,
          expectedAmountWei,
          user.verifiedEthAddress
        );
        
        if (!verification.verified) {
          return res.status(400).json({ 
            message: "Payment verification failed",
            error: verification.error 
          });
        }
      }
      
      // Get BTC price from crypto rates or use fallback (declare outside if block for later use)
      let btcPrice = 50000; // fallback BTC price in USD
      if (rates && rates.cryptoRates) {
        try {
          const cryptoRatesData = rates.cryptoRates as any;
          if (cryptoRatesData?.BTC) {
            btcPrice = cryptoRatesData.BTC;
          }
        } catch (e) {
          console.log('Using fallback BTC price');
        }
      }

      if (paymentMethod === 'bitcoin') {
        if (!paymentReference) {
          return res.status(400).json({ message: "Transaction hash required for Bitcoin payments" });
        }
        
        // Verify Bitcoin transaction
        const expectedAddress = process.env.CRYPTO_BTC_ADDRESS;
        if (!expectedAddress) {
          return res.status(500).json({ message: "Bitcoin payment address not configured" });
        }
        
        // Convert USD amount to satoshis (1 BTC = 100,000,000 satoshis)
        const expectedAmountSats = Math.floor(
          (parseFloat(amount) / btcPrice) * 100000000
        ).toString();
        
        // SECURITY: Require verified Bitcoin address for sender verification (prevent claim hijacking)
        if (!user.verifiedBtcAddress) {
          return res.status(400).json({ 
            message: "Bitcoin wallet verification required",
            error: "You must verify your Bitcoin wallet address before making Bitcoin payments. This prevents fraudulent transactions."
          });
        }
        const expectedFromAddress = user.verifiedBtcAddress;

        // Use Bitcoin verification with 3 confirmations minimum (matches Ethereum security)
        const verification = await paymentVerification.verifyBitcoinTransaction(
          paymentReference,
          expectedAddress,
          expectedAmountSats,
          expectedFromAddress,
          3 // Bitcoin requires minimum 3 confirmations to match Ethereum security posture
        );
        
        if (!verification.verified) {
          return res.status(400).json({ 
            message: "Payment verification failed",
            error: verification.error 
          });
        }
      }
      
      // Record this payment as processed to prevent replay
      if (paymentReference) {
        await storage.recordProcessedPayment({
          paymentReference,
          paymentMethod,
          userId,
          amountProcessed: amount,
          tsuCredited: tsuAmount,
          verificationData: { 
            tsuPrice, 
            ethPrice: paymentMethod === 'ethereum' ? ethPrice : undefined,
            btcPrice: paymentMethod === 'bitcoin' ? btcPrice : undefined
          }
        });
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

  // Delete user (super admin only)
  app.delete('/api/admin/users/:userId', requireAdmin, async (req: any, res) => {
    try {
      if (req.currentUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Super admin access required" });
      }

      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if user exists
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deletion of super_admin users
      if (userToDelete.role === 'super_admin') {
        return res.status(403).json({ message: "Cannot delete super admin users" });
      }

      // Prevent admin from deleting themselves
      if (userId === req.currentUser.id) {
        return res.status(403).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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
        fromName: fromName || 'TSU',
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
      // Block PayPal setup if live credentials are not configured
      if (!hasPayPalCredentials()) {
        return res.status(503).json({ 
          error: "PayPal service unavailable", 
          message: "TSU purchasing is temporarily disabled while we configure live payment processing. Please try again later."
        });
      }
      
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
      // Block PayPal order creation if live credentials are not configured
      if (!hasPayPalCredentials()) {
        return res.status(503).json({ 
          error: "PayPal service unavailable", 
          message: "TSU purchasing is temporarily disabled while we configure live payment processing. Please try again later."
        });
      }
      
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
      // Block PayPal order capture if live credentials are not configured
      if (!hasPayPalCredentials()) {
        return res.status(503).json({ 
          error: "PayPal service unavailable", 
          message: "TSU purchasing is temporarily disabled while we configure live payment processing. Please try again later."
        });
      }
      
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
      // Block PayPal setup if live credentials are not configured
      if (!hasPayPalCredentials()) {
        return res.status(503).json({ 
          error: "PayPal service unavailable", 
          message: "TSU purchasing is temporarily disabled while we configure live payment processing. Please try again later."
        });
      }
      
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
      // Block PayPal order creation if live credentials are not configured
      if (!hasPayPalCredentials()) {
        return res.status(503).json({ 
          error: "PayPal service unavailable", 
          message: "TSU purchasing is temporarily disabled while we configure live payment processing. Please try again later."
        });
      }
      
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
      // Block PayPal order capture if live credentials are not configured
      if (!hasPayPalCredentials()) {
        return res.status(503).json({ 
          error: "PayPal service unavailable", 
          message: "TSU purchasing is temporarily disabled while we configure live payment processing. Please try again later."
        });
      }
      
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
      // Aggressive cache prevention for content updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Vary': '*'
      });
      
      // Remove ETag to prevent conditional requests
      res.removeHeader('ETag');
      
      const content = await storage.getAllContent();
      
      // Add timestamp to response to force freshness
      res.json({
        data: content,
        timestamp: new Date().toISOString(),
        version: Date.now()
      });
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

  // Content sync routes for development/production environment synchronization
  app.get('/api/content/export', requireAdmin, async (req: any, res) => {
    try {
      const content = await storage.getAllContent();
      
      // Create export package with metadata
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        exportedBy: req.currentUser.id,
        environment: process.env.NODE_ENV || 'development',
        contentCount: content.length,
        content: content.map(item => ({
          key: item.key,
          value: item.value,
          updatedBy: item.updatedBy,
          updatedAt: item.updatedAt
        }))
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="content-export-${new Date().toISOString().slice(0, 10)}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting content:", error);
      res.status(500).json({ message: "Failed to export content" });
    }
  });

  app.post('/api/content/import', requireAdmin, async (req: any, res) => {
    try {
      const { content, overwrite = false } = req.body;
      
      if (!content || !Array.isArray(content)) {
        return res.status(400).json({ message: "Invalid import data: content array required" });
      }
      
      let imported = 0;
      let skipped = 0;
      let errors = [];
      
      for (const item of content) {
        try {
          // Check if content already exists
          const existing = await storage.getContent(item.key);
          
          if (existing && !overwrite) {
            skipped++;
            continue;
          }
          
          // Validate and import content item
          const validation = insertContentSchema.safeParse({
            key: item.key,
            value: item.value,
            updatedBy: req.currentUser.id,
          });
          
          if (!validation.success) {
            errors.push(`Invalid data for key '${item.key}': ${validation.error.issues.map(i => i.message).join(', ')}`);
            continue;
          }
          
          await storage.upsertContent(validation.data);
          imported++;
        } catch (error) {
          errors.push(`Failed to import '${item.key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      res.json({
        message: `Content import completed`,
        stats: {
          total: content.length,
          imported,
          skipped,
          errors: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error importing content:", error);
      res.status(500).json({ message: "Failed to import content" });
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

  // Whitepaper upload endpoint (admin only)
  app.post('/api/admin/whitepaper/upload', requireAdmin, whitepaperUpload.single('whitepaper'), async (req: any, res) => {
    try {
      const { type } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      if (!type || !['tsu', 'tsu-x'].includes(type)) {
        return res.status(400).json({ message: "Invalid whitepaper type. Must be 'tsu' or 'tsu-x'" });
      }
      
      // Determine the target filename
      const fileName = type === 'tsu' ? 'tsu-whitepaper.pdf' : 'tsu-x-whitepaper.pdf';
      const filePath = path.join(process.cwd(), 'client', 'public', fileName);
      
      // Write the file to the public directory
      fs.writeFileSync(filePath, file.buffer);
      
      console.log(`✅ ${type.toUpperCase()} whitepaper uploaded successfully: ${fileName}`);
      
      res.json({ 
        message: "Whitepaper uploaded successfully",
        fileName,
        type: type.toUpperCase(),
        size: file.size
      });
    } catch (error) {
      console.error("Error uploading whitepaper:", error);
      res.status(500).json({ message: "Failed to upload whitepaper" });
    }
  });

  // Get upload URL for metadata thumbnail images
  app.post('/api/admin/upload-image', requireAdmin, async (req: any, res) => {
    try {
      const { fileName, fileType } = req.body;
      
      if (!fileName || !fileType) {
        return res.status(400).json({ message: "fileName and fileType are required" });
      }

      // Validate file type
      if (!fileType.startsWith('image/')) {
        return res.status(400).json({ message: "Only image files are allowed" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      
      // Get presigned URL for upload
      const { url: uploadUrl, objectPath, fileName: finalFileName } = await objectStorageService.getPublicImageUploadURL(fileName, fileType);
      
      res.json({ 
        uploadUrl, 
        objectPath,
        fileName: finalFileName 
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Public file serving endpoint
  // Direct route for og-image.jpg (required for social media sharing)
  app.get("/og-image.jpg", async (req, res) => {
    const path = await import('path');
    const fs = await import('fs');
    
    // First try to serve from local public directory
    const localImagePath = path.resolve(process.cwd(), 'client/public/og-image.jpg');
    
    if (fs.existsSync(localImagePath)) {
      return res.sendFile(localImagePath, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400', // 24 hours cache
          'X-Robots-Tag': 'all' // Allow all crawlers (removes noimageindex)
        }
      });
    }
    
    // Fallback to object storage
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject('og-image.jpg');
      if (!file) {
        return res.status(404).json({ error: "OG image not found" });
      }
      
      // Set WordPress-style headers for social media crawlers
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // 24 hours cache
        'X-Robots-Tag': 'all' // Allow all crawlers (removes noimageindex)
      });
      
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving og-image:", error);
      return res.status(500).json({ error: "Error serving og-image" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const { ObjectStorageService } = await import('./objectStorage');
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
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

  // Admin-only endpoint to update TSU exchange rates
  app.put('/api/admin/tsu-rates', requireAdmin, async (req: any, res) => {
    try {
      const { tsuPrice, processingFee, reason } = req.body;
      
      if (!tsuPrice || isNaN(parseFloat(tsuPrice))) {
        return res.status(400).json({ message: "Valid TSU price is required" });
      }

      const currentUser = req.currentUser;
      
      // Get current TSU rates to preserve existing values
      const currentRates = await storage.getTsuRates();
      
      // Update the TSU rate in database
      await storage.upsertTsuRates({
        baseCurrency: 'USD',
        tsuPrice: parseFloat(tsuPrice).toString(),
        gasolineEquivalent: currentRates?.gasolineEquivalent || '1.0000',
        cryptoRates: currentRates?.cryptoRates || { BTC: 0.000025, ETH: 0.0008 },
        isActive: true,
        updatedBy: currentUser.id,
      });

      res.json({ 
        message: "TSU exchange rate updated successfully",
        newRate: tsuPrice,
        updatedBy: currentUser.email
      });
    } catch (error) {
      console.error("Error updating TSU rate:", error);
      res.status(500).json({ message: "Failed to update exchange rate" });
    }
  });

  // Admin-only endpoint to send emails to users
  app.post('/api/admin/send-email', requireAdmin, async (req: any, res) => {
    try {
      const { recipients, subject, message, isHtml = false } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: "Recipients list is required" });
      }
      
      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }

      const currentUser = req.currentUser;
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Check for SMTP configuration first (preferred)
      const smtpConfig = await storage.getSmtpConfig();
      
      if (smtpConfig && smtpConfig.host) {
        // Use custom SMTP server
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port || 587,
          secure: smtpConfig.secure || false,
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password,
          },
        });

        // Send emails using custom SMTP
        for (const recipientEmail of recipients) {
          try {
            const mailOptions = {
              from: `${smtpConfig.fromName || 'TSU'} <${smtpConfig.fromEmail}>`,
              to: recipientEmail,
              subject: subject,
              text: isHtml ? undefined : message,
              html: isHtml ? message : undefined,
            };

            await transporter.sendMail(mailOptions);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to send email to ${recipientEmail}:`, error);
            failureCount++;
            errors.push(`${recipientEmail}: ${error.message}`);
          }
        }
      } else if (process.env.SENDGRID_API_KEY) {
        // Fallback to SendGrid if SMTP not configured
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const fromEmail = 'admin@tsu-wallet.com';
        
        for (const recipientEmail of recipients) {
          try {
            const msg = {
              to: recipientEmail,
              from: fromEmail,
              subject: subject,
              text: isHtml ? undefined : message,
              html: isHtml ? message : undefined,
            };

            await sgMail.send(msg);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to send email to ${recipientEmail}:`, error);
            failureCount++;
            errors.push(`${recipientEmail}: ${error.message}`);
          }
        }
      } else {
        return res.status(500).json({ 
          message: "Email service not configured. Please configure SMTP settings in the Email tab or set SENDGRID_API_KEY." 
        });
      }

      res.json({
        message: `Email campaign completed. ${successCount} sent, ${failureCount} failed.`,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error sending emails:", error);
      res.status(500).json({ message: "Failed to send emails" });
    }
  });

  // Admin-only endpoint to get users for email targeting
  app.get('/api/admin/users/emails', requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const userEmails = users
        .filter(user => user.email && user.isActive)
        .map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }));
      
      res.json(userEmails);
    } catch (error) {
      console.error("Error fetching user emails:", error);
      res.status(500).json({ message: "Failed to fetch user emails" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
