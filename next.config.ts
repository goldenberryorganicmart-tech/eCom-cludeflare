import type { NextConfig } from "next";

const nextConfig: any = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    qualities: [75, 100],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config: any, { isServer }: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      mongoose: require('path').resolve(__dirname, 'src/lib/mongoose-mock.ts'),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      fs: false,
      path: false,
      http: false,
      https: false,
      crypto: false,
      stream: false,
      os: false,
      url: false,
      zlib: false,
    };
    return config;
  },
};

export default nextConfig;
