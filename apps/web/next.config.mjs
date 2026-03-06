import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Transpile workspace packages
  transpilePackages: ['@akademate/ui', '@akademate/types', '@akademate/api'],

  // pg has native bindings — must not be webpack-bundled
  serverExternalPackages: ['pg', 'pg-native'],

  // Force-include packages into standalone trace (nft resolves symlinks to actual files)
  outputFileTracingIncludes: {
    '/api/auth/[...all]': [
      './node_modules/better-auth/**',
      './node_modules/@better-auth/**',
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

  // Explicit webpack alias for @ path (mirrors tsconfig paths)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    }
    return config
  },

  // Headers for security (OWASP recommended)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
