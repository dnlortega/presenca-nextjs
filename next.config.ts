import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Desabilitar cache completamente - sempre buscar dados frescos do banco
  experimental: {
    // Forçar revalidação em todas as rotas
  },
  // Headers de no-cache para todas as rotas da API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
