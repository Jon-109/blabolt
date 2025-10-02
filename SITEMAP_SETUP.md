# Sitemap & Robots.txt Setup

This project uses `next-sitemap` to automatically generate `sitemap.xml` and `robots.txt` files during the build process.

## Configuration

### Files
- **`next-sitemap.config.cjs`** - Main configuration file for sitemap generation
- **`public/sitemap.xml`** - Auto-generated sitemap (created during build)
- **`public/robots.txt`** - Auto-generated robots.txt (created during build)

### Environment Variables

#### Local Development (.env.local)
```bash
NEXT_PUBLIC_SITE_URL=https://businesslendingadvocate.com
```

#### Vercel Deployment
Add the following environment variable in your Vercel project settings:

**Variable Name:** `NEXT_PUBLIC_SITE_URL`  
**Value:** `https://businesslendingadvocate.com`  
**Environment:** Production, Preview, Development

**Steps to add in Vercel:**
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add `NEXT_PUBLIC_SITE_URL` with value `https://businesslendingadvocate.com`
4. Select all environments (Production, Preview, Development)
5. Click "Save"

## How It Works

1. **During Build**: The `postbuild` script in `package.json` runs `next-sitemap` after Next.js builds
2. **Sitemap Generation**: Scans all routes in `.next` build output and generates sitemap
3. **Output**: Creates `sitemap.xml` and `robots.txt` in the `public/` folder
4. **Deployment**: Files are served at domain root (`/sitemap.xml` and `/robots.txt`)

## Excluded Routes

The following routes are excluded from the sitemap and blocked in robots.txt:
- `/api/*` - API routes
- `/auth/*` - Authentication routes
- `/report/*` - Dynamic report routes
- `/report-preview` - Report preview page
- `/login` - Login page
- `/_next/*` - Next.js internal routes
- `/admin/*` - Admin routes (if any)

## Included Routes

All public-facing pages are automatically included:
- Homepage (`/`)
- Blog pages (`/blog`, `/blog/*`)
- Service pages (`/cash-flow-analysis`, `/loan-services`, etc.)
- Template pages (`/templates/*`)
- Static pages (`/faq`, `/privacy-policy`, `/terms-of-service`, etc.)

## Manual Regeneration

To manually regenerate the sitemap (useful for testing):

```bash
npm run build
```

Or run just the sitemap generation:

```bash
npx next-sitemap --config next-sitemap.config.cjs
```

## Verification

After deployment, verify the files are accessible:
- https://businesslendingadvocate.com/sitemap.xml
- https://businesslendingadvocate.com/robots.txt

## SEO Benefits

- ✅ Helps search engines discover all public pages
- ✅ Prevents indexing of private/admin routes
- ✅ Automatically updates on every deployment
- ✅ Includes lastmod timestamps for better crawling
- ✅ Proper robots.txt configuration

## Troubleshooting

**Issue**: Sitemap not updating after deployment  
**Solution**: Ensure `NEXT_PUBLIC_SITE_URL` is set in Vercel environment variables

**Issue**: Wrong URLs in sitemap  
**Solution**: Check that `NEXT_PUBLIC_SITE_URL` matches your production domain

**Issue**: Build fails with sitemap error  
**Solution**: Ensure `next-sitemap` is installed in `devDependencies`
