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
  webpack: (config: any, { isServer, webpack }: any) => {
    const mockPath = require('path').resolve(__dirname, 'src/lib/node-mocks.ts');
    config.resolve.alias = {
      ...config.resolve.alias,
      mongoose: require('path').resolve(__dirname, 'src/lib/mongoose-mock.ts'),
      net: mockPath,
      tls: mockPath,
      dns: mockPath,
      stream: mockPath,
      fs: mockPath,
      'fs/promises': mockPath,
      'node:net': mockPath,
      'node:tls': mockPath,
      'node:stream': mockPath,
      'node:dns': mockPath,
      'node:fs': mockPath,
      'node:fs/promises': mockPath,
      'node:path': false,
      'node:http': false,
      'node:https': false,
      'node:zlib': false,
      'node:util': false,
      'node:crypto': false,
      'timers/promises': false,
      'timers': false,
      './client-side-encryption/client_encryption': false,
      './client-side-encryption/auto_encrypter': false,
      './client-side-encryption/errors': false,
      '../client-side-encryption/providers/azure': false,
      '../client-side-encryption/providers/gcp': false,
      '../client-side-encryption/providers/aws': false,
      'gcp-metadata': false,
      'gaxios': false,
      'https-proxy-agent': false,
      'agent-base': false,
      'socks': false,
    };

    if (webpack) {
      // Intercept all Node core modules and sub-paths before alias resolution
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^(node:)?(fs\/promises|fs|net|tls|dns|stream)$/,
          (resource: any) => {
            resource.request = mockPath;
          }
        )
      );
      // Also strip remaining node: prefixes for other modules (http, path, etc.)
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: mockPath,
      tls: mockPath,
      dns: mockPath,
      child_process: false,
      fs: mockPath,
      path: false,
      http: false,
      https: false,
      crypto: false,
      stream: mockPath,
      os: false,
      url: false,
      zlib: false,
      timers: false,
      'timers/promises': false,
      'fs/promises': mockPath,
      'node:fs/promises': mockPath,
    };
    return config;
  },
};

export default nextConfig;
