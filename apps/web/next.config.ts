import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@akademate/ui', '@akademate/types', '@akademate/api'],

  // ISR configuration for CMS content
  experimental: {
    // Enable PPR when stable
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.akademate.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
