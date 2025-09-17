# TSU Open Graph Website

A minimal website designed specifically for WhatsApp link previews with proper Open Graph meta tags.

## Features

- Server-side rendered HTML with Open Graph meta tags in initial response
- Optimized 1200x630 image for social media previews
- Static asset serving with proper caching headers
- WhatsApp-compatible link previews

## Configuration

Set these environment variables to customize the site:

- `SITE_TITLE` - Default: "TSU - Trade Settlement Unit"
- `SITE_DESCRIPTION` - Default: "The reserve-backed digital currency for Africa-BRICS trade settlements, reducing USD dependence and facilitating seamless international commerce."
- `PUBLIC_HOST` - Auto-detected from Replit deployment or set manually

## Running the Server

```bash
node og-server.js
```

The server will run on port 3000 (or PORT environment variable).

## Files

- `og-server.js` - Express server with SSR HTML and Open Graph meta tags
- `public/og-image.jpg` - Optimized 1200x630 TSU header image
- `public/` - Static assets directory

## WhatsApp Preview Checklist

Before sharing your link on WhatsApp, ensure:

- [ ] **Deployed at an HTTPS URL reachable publicly**
  - The site must be accessible over HTTPS
  - No authentication required for the main page

- [ ] **Test with Facebook Sharing Debugger**
  - Visit https://developers.facebook.com/tools/debug/
  - Enter your site URL and click "Scrape Again"
  - This forces Facebook/WhatsApp to refresh the preview

- [ ] **Confirm Link Preview Shows Your Image and Text**
  - The preview should show your TSU image
  - Title and description should appear correctly

- [ ] **Image Troubleshooting (if image doesn't appear)**
  - Ensure og:image URL is absolute HTTPS
  - Image returns HTTP 200 status
  - Image is under 5MB (ours is ~152KB ✓)
  - Image dimensions are 1200×630 (ours are ✓)
  - Correct Content-Type header (image/jpeg ✓)

- [ ] **Avoid Common Issues**
  - No meta refresh or JavaScript redirects
  - Canonical URL points to exact URL you're sharing
  - No robots.txt blocking bots from accessing / or /og-image.jpg

## Technical Details

### Open Graph Tags

The site includes all required Open Graph tags:

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="TSU - Trade Settlement Unit" />
<meta property="og:description" content="..." />
<meta property="og:url" content="https://your-domain/" />
<meta property="og:image" content="https://your-domain/public/og-image.jpg" />
<meta property="og:image:secure_url" content="https://your-domain/public/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

### Image Optimization

The TSU header image has been optimized for social media:
- Resized to 1200×630 (perfect for WhatsApp/Facebook)
- Converted to JPEG with 85% quality
- File size reduced from 2.5MB to ~152KB
- Proper Content-Type headers

### Caching

- HTML pages: `max-age=60` (1 minute)
- Images: `max-age=31536000, immutable` (1 year)

## Deployment Notes

When deploying to Replit:
1. The server auto-detects your Replit domain
2. Ensure the deployment is public (not private)
3. Test the preview URL in the Facebook Sharing Debugger
4. Share the main URL (not /public/og-image.jpg) on WhatsApp

## Testing WhatsApp Previews

1. Deploy your site to a public HTTPS URL
2. Use Facebook Sharing Debugger to test Open Graph tags
3. Share the URL in WhatsApp to see the preview
4. If issues occur, check the console logs and ensure all URLs return HTTP 200