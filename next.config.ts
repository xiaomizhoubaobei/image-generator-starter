import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['tdesign-react'],

  // 本地开发时将所有 /v1/** 请求代理到 EdgeOne Pages Functions 本地服务（默认 8088）
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/v1/:path*',
          destination: 'http://localhost:8088/v1/:path*',
        },
      ];
    }
    // 生产 / 静态导出模式下不需要 rewrites
    return [];
  },

  // 明确指定 Turbopack 根目录，避免锁文件检测警告
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
