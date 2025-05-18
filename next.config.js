/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization to prevent bootstrap script issues
  experimental: {
    // Add experimental features that might help with bootstrap script issues
    serverActions: {}, 
  },
  serverExternalPackages: [], 
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'amczvmmzmlumvidwitnv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Handle API proxy rewrites before Next.js routes
        {
          source: '/api/v1/:path*',
          destination: '/api/:path*',
        }
      ],
      afterFiles: [
        // Handle dynamic routes after Next.js routes but before static files
        {
          source: '/p/:slug',
          destination: '/products/:slug',
        },
        {
          source: '/b/:slug',
          destination: '/blog/:slug',
        }
      ],
      fallback: [
        // Fallback rewrites run after both beforeFiles and afterFiles
        {
          source: '/old-blog/:slug',
          destination: '/blog/:slug',
        },
        {
          source: '/feed',
          destination: '/api/rss',
        }
      ]
    }
  }
}

module.exports = nextConfig