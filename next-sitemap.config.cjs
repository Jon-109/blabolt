/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://businesslendingadvocate.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false, // Set to true if you expect more than 50k URLs
  
  // Exclude private routes, API routes, auth routes, and dynamic report routes
  exclude: [
    '/api/*',
    '/auth/*',
    '/report/*',
    '/report-preview',
    '/login',
    '/_next/*',
    '/admin/*',
  ],
  
  // robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/report/',
          '/report-preview',
          '/login',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    additionalSitemaps: [
      // Add additional sitemaps here if needed in the future
    ],
  },
  
  // Transform function to modify URLs if needed
  transform: async (config, path) => {
    // Exclude dynamic report routes that match patterns
    if (path.includes('/report/print/') || path.includes('/report/template/')) {
      return null;
    }
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  
  // Additional configuration
  changefreq: 'weekly',
  priority: 0.7,
  autoLastmod: true,
  sitemapSize: 5000,
};
