import type { NextConfig } from 'next'
import { env } from './src/env'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3001',
        '127.0.0.1:3001',
        'admin.localhost:3001',
        '*.localhost:3001',
        'traxsolucoes.com.br',
        'www.traxsolucoes.com.br',
        'admin.traxsolucoes.com.br',
        'admin.traxsolucoes.com',
        '*.traxsolucoes.com.br',
        '*.traxsolucoes.com',
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Proxy same-origin: browser chama /api/v1 no subdomínio da agência
  // e o Next encaminha para o trax-api (evita CORS e TLS cross-domain).
  async rewrites() {
    const apiOrigin = env.API_URL
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: '/public/:path*',
        destination: `${apiOrigin}/public/:path*`,
      },
    ]
  },
  // Garante que o header Host seja acessível nos Server Components
  // para resolução de tenant
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
