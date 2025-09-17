import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve attached assets (like the TSU logo)
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

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

// Helper function to get the site URL for Open Graph tags
function getSiteUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5000';
  return process.env.SITE_URL || `${protocol}://${host}`;
}

// Add cache headers for og-image.jpg
app.get('/og-image.jpg', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/jpeg');
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Server-side Open Graph meta tag injection for root route
  app.get('/', (req, res) => {
    try {
      const siteUrl = getSiteUrl(req);
      const indexPath = path.join(process.cwd(), 'client/index.html');
      
      if (!fs.existsSync(indexPath)) {
        return res.status(404).send('Index file not found');
      }

      let html = fs.readFileSync(indexPath, 'utf-8');
      
      // Replace relative URLs with absolute URLs for Open Graph tags
      html = html.replace(
        '<meta property="og:url" content="/" />',
        `<meta property="og:url" content="${siteUrl}/" />`
      );
      
      html = html.replace(
        '<meta property="og:image" content="/tsu-logo.png" />',
        `<meta property="og:image" content="${siteUrl}/og-image.jpg" />`
      );
      
      html = html.replace(
        '<meta property="twitter:url" content="/" />',
        `<meta property="twitter:url" content="${siteUrl}/" />`
      );
      
      html = html.replace(
        '<meta property="twitter:image" content="/tsu-logo.png" />',
        `<meta property="twitter:image" content="${siteUrl}/og-image.jpg" />`
      );

      // Set cache headers to ensure fresh previews
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      
      res.send(html);
    } catch (error) {
      console.error('Error serving index with OG tags:', error);
      res.status(500).send('Server error');
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
