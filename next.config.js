/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg-installer/ffmpeg', 'ffprobe'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/videos/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/videos/:path*`,
      },
      {
        source: '/api/accounts/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/accounts/:path*`,
      },
      {
        source: '/api/scheduler/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/scheduler/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
