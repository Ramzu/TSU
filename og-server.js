const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration variables
const SITE_TITLE = process.env.SITE_TITLE || 'TSU - Trade Settlement Unit';
const SITE_DESCRIPTION = process.env.SITE_DESCRIPTION || 'The reserve-backed digital currency for Africa-BRICS trade settlements, reducing USD dependence and facilitating seamless international commerce.';
const PUBLIC_HOST = process.env.PUBLIC_HOST || process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'localhost:3000';

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // Cache images for 1 year
    if (path.endsWith('.jpg') || path.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', path.endsWith('.jpg') ? 'image/jpeg' : 'image/png');
    }
  }
}));

// Main route with SSR HTML and Open Graph meta tags
app.get('/', (req, res) => {
  // Short cache for HTML
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${SITE_TITLE}</title>
  <meta name="description" content="${SITE_DESCRIPTION}" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${SITE_TITLE}" />
  <meta property="og:description" content="${SITE_DESCRIPTION}" />
  <meta property="og:url" content="https://${PUBLIC_HOST}/" />
  <meta property="og:image" content="https://${PUBLIC_HOST}/public/og-image.jpg" />
  <meta property="og:image:secure_url" content="https://${PUBLIC_HOST}/public/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Recommended extras -->
  <link rel="canonical" href="https://${PUBLIC_HOST}/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${SITE_TITLE}" />
  <meta name="twitter:description" content="${SITE_DESCRIPTION}" />
  <meta name="twitter:image" content="https://${PUBLIC_HOST}/public/og-image.jpg" />

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #1e3a8a, #059669);
      color: white;
      min-height: 100vh;
    }
    .header-image {
      width: 100%;
      max-width: 600px;
      height: auto;
      border-radius: 12px;
      margin: 2rem 0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    p {
      font-size: 1.2rem;
      text-align: center;
      margin-bottom: 2rem;
      opacity: 0.95;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    .feature {
      background: rgba(255,255,255,0.1);
      padding: 1.5rem;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    .feature h3 {
      margin-top: 0;
      color: #fbbf24;
    }
  </style>
</head>
<body>
  <main>
    <h1>${SITE_TITLE}</h1>
    <img src="/public/og-image.jpg" alt="TSU Trade Settlement Unit" class="header-image" />
    <p>${SITE_DESCRIPTION}</p>
    
    <div class="features">
      <div class="feature">
        <h3>🌍 Africa-BRICS Trade</h3>
        <p>Facilitating seamless trade settlements between African nations and BRICS partners.</p>
      </div>
      <div class="feature">
        <h3>💰 Reserve-Backed</h3>
        <p>Fully backed by reserves, providing stability and trust in international commerce.</p>
      </div>
      <div class="feature">
        <h3>🚀 USD Independence</h3>
        <p>Reducing dependence on USD for international trade settlements.</p>
      </div>
    </div>
  </main>
</body>
</html>`;

  res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 TSU Open Graph Server running on port ${PORT}`);
  console.log(`📱 WhatsApp Preview URL: https://${PUBLIC_HOST}/`);
  console.log(`🖼️  Open Graph Image: https://${PUBLIC_HOST}/public/og-image.jpg`);
  
  console.log('\n📋 WhatsApp Preview Checklist:');
  console.log('- [ ] Deployed at an HTTPS URL reachable publicly');
  console.log('- [ ] Visit https://developers.facebook.com/tools/debug/ (Sharing Debugger), enter your site URL, and click "Scrape Again"');
  console.log('- [ ] Confirm "Link Preview" shows your image and text');
  console.log('- [ ] If the image still doesn\'t appear: ensure og:image is absolute HTTPS, status 200, <5MB, 1200×630, correct Content-Type');
  console.log('- [ ] Avoid meta refresh/JS redirects; keep canonical pointing to the exact URL you share');
  
  console.log(`\n🔧 Configuration:`);
  console.log(`   SITE_TITLE: "${SITE_TITLE}"`);
  console.log(`   SITE_DESCRIPTION: "${SITE_DESCRIPTION}"`);
  console.log(`   PUBLIC_HOST: "${PUBLIC_HOST}"`);
});