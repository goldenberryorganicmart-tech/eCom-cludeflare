import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages are used server-side (API routes) but should NOT be
  // bundled into the Worker — they are left as external requires at runtime.
  // This dramatically reduces the server bundle size.
  serverExternalPackages: [
    // Database
    'mongoose',
    // Google APIs (large — only used in analytics API routes)
    'googleapis',
    '@google-analytics/data',
    // Nodemailer (only used in email API routes)
    'nodemailer',
    // PDF generation (browser-only, should never run server-side)
    'jspdf',
    'jspdf-autotable',
  ],

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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        fs: false,
        path: false,
      };
    }

    if (isServer) {
      // Prevent purely client-side / browser packages from being
      // analyzed into the server bundle at all.
      const externals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];

      config.externals = [
        ...externals,
        // 3D / WebGL — browser only
        'ogl',
        // Animation — browser only
        'framer-motion',
        'motion',
        'aos',
        // Charts — browser only
        'recharts',
        // Rich text editors — browser only
        'novel',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/extension-character-count',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-color',
        '@tiptap/extension-highlight',
        '@tiptap/extension-horizontal-rule',
        '@tiptap/extension-image',
        '@tiptap/extension-link',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-task-item',
        '@tiptap/extension-task-list',
        '@tiptap/extension-text-align',
        '@tiptap/extension-text-style',
        '@tiptap/extension-typography',
        '@tiptap/extension-underline',
        '@tiptap/extension-youtube',
        'tiptap-extension-global-drag-handle',
        'tiptap-markdown',
        // DnD — browser only
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/modifiers',
        '@dnd-kit/utilities',
        // Carousel — browser only
        'embla-carousel-react',
        'embla-carousel-autoplay',
        // Lottie — browser only
        'lottie-react',
      ];
    }

    return config;
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
