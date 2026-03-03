import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',

  // Transpile workspace packages
  transpilePackages: ['@akademate/ui', '@akademate/types', '@akademate/api'],

  // pg has native bindings — must not be webpack-bundled
  serverExternalPackages: ['pg', 'pg-native'],

  // Ensure pg is included in the standalone trace (needed by better-auth at runtime)
  outputFileTracingIncludes: {
    '/api/auth/[...all]': [
      './node_modules/pg/**',
      './node_modules/pg-pool/**',
      './node_modules/drizzle-orm/**',
    ],
  },

  experimental: {},

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

  // Headers for security (OWASP recommended)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Enable XSS filter
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy for privacy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Content Security Policy (strict for public site)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // Strict Transport Security (HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

export default nextConfig
