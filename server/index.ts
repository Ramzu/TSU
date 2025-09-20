import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve attached assets (like the TSU logo)
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

// Helper function to get the site URL for Open Graph tags
function getSiteUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
  return process.env.SITE_URL || `${protocol}://${host}`;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add middleware to transform Open Graph URLs to absolute URLs for all environments
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    const originalSend = res.send;
    res.send = function(html: any) {
      if (typeof html === 'string' && html.includes('<meta property="og:')) {
        const siteUrl = getSiteUrl(req);
        html = html.replace(/content="\/og-image\.jpg"/g, `content="${siteUrl}/og-image.jpg"`);
        html = html.replace(/content="\/"/g, `content="${siteUrl}/"`);
      }
      return originalSend.call(this, html);
    };
  }
  next();
});

// Add explicit process error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Add console.log statements to track server startup progress
console.log('Starting TSU Wallet server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || '5000');

// Wrap the entire async function in a try-catch block
(async () => {
  try {
    console.log('Registering routes...');
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Add error handling and debugging to catch startup issues
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error('Application error:', {
        status,
        message,
        stack: err.stack,
        url: _req.url,
        method: _req.method
      });

      res.status(status).json({ message });
      // Don't throw err here - it causes the server to crash
      // Just log it instead
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const env = process.env.NODE_ENV || 'development';
    console.log('Setting up frontend serving for environment:', env);
    
    if (env === "development") {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
      console.log('Vite setup complete');
    } else {
      console.log('Setting up static file serving for production...');
      serveStatic(app);
      console.log('Static file serving setup complete');
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log('Starting server on port:', port);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`✅ TSU Wallet server successfully started!`);
      console.log(`📱 Server running at http://0.0.0.0:${port}`);
      console.log(`🌍 Environment: ${env}`);
      log(`serving on port ${port}`);
    });

    // Handle server listen errors
    server.on('error', (err) => {
      console.error('Server listen error:', err);
      throw err;
    });

  } catch (error) {
    console.error('❌ Server startup failed!');
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    process.exit(1);
  }
})();
