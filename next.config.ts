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
    qualities: [75, 80, 100],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Mark server-only packages so webpack never bundles them into client/edge chunks.
  // This prevents mongodb from being included in the layout.js client chunk.
  serverExternalPackages: ['mongodb', 'mongoose', 'nodemailer', 'bcryptjs'],

  webpack: (config: any, { isServer, webpack, nextRuntime, dev }: any) => {
    const mockPath = require('path').resolve(__dirname, 'src/lib/node-mocks.ts');

    // Use in-memory cache in dev mode instead of filesystem persistent cache.
    // Filesystem cache causes unhandledRejection when .pack.gz files don't exist
    // on a fresh start after cache clear, which prevents server bundle compilation.
    if (dev) {
      config.cache = { type: 'memory' };
    }

    // Only apply Node.js mocks for client/edge bundles — NOT for the server (Node.js) bundle.
    // The server bundle runs in real Node.js and MongoDB needs real net/dns/tls to connect.
    // Edge runtime and browser bundles need these mocked because they lack Node.js APIs.
    const isEdgeOrClient = !isServer || nextRuntime === 'edge';

    if (isEdgeOrClient) {
      config.resolve.alias = {
        ...config.resolve.alias,
        mongoose: require('path').resolve(__dirname, 'src/lib/mongoose-mock.ts'),
        net: mockPath,
        tls: mockPath,
        dns: mockPath,
        stream: mockPath,
        fs: mockPath,
        'fs/promises': mockPath,
        http2: mockPath,
        'node:net': mockPath,
        'node:tls': mockPath,
        'node:stream': mockPath,
        'node:dns': mockPath,
        'node:fs': mockPath,
        'node:fs/promises': mockPath,
        'node:http2': mockPath,
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
        // Intercept Node core modules at request-time for edge/client bundles
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /^(node:)?(fs\/promises|fs|net|tls|dns|stream|http2)$/,
            (resource: any) => {
              resource.request = mockPath;
            }
          )
        );
        // Strip remaining node: prefixes (http, path, etc.)
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
        'fs/promises': mockPath,
        'node:fs/promises': mockPath,
        http2: mockPath,
        'node:http2': mockPath,
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
      };
    } else {
      // Server bundle: only mock mongoose (not needed on server side),
      // but leave all other Node.js modules untouched so MongoDB can connect.
      config.resolve.alias = {
        ...config.resolve.alias,
        mongoose: require('path').resolve(__dirname, 'src/lib/mongoose-mock.ts'),
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
    }

    return config;
  },
};

export default nextConfig;
