import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import assets from './content/cdn-assets.json';
import { isIndexingEnabled } from './src/lib/site';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  agentRules: false,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.0xmason.com', pathname: '/**' }],
  },
  turbopack: { root: process.cwd() },
  async headers() {
    const revision = process.env.VERCEL_GIT_COMMIT_SHA;
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      ...(revision && /^[a-f0-9]{40}$/.test(revision) ? [{ source: '/:path*', headers: [{ key: 'X-Site-Revision', value: revision }] }] : []),
      ...(!isIndexingEnabled() ? [{ source: '/:path*', headers: noindex }] : [
        ...['/admin/:path*', '/api/:path*', '/preview/:path*', '/styleguide'].map((source) => ({ source, headers: noindex })),
        { source: '/:path*', has: [{ type: 'host' as const, value: '.*\\.vercel\\.app' }], headers: noindex },
      ]),
    ];
  },
  async redirects() {
    return [{
      source: '/resources/ai-subscriptions',
      destination: '/resources/global-accounts',
      permanent: true,
    }, {
      source: '/resources/ai-subscriptions/:path*',
      destination: '/resources/global-accounts/:path*',
      permanent: true,
    }, ...Object.entries(assets).map(([path, asset]) => ({
      source: `/${path}`,
      destination: `https://cdn.0xmason.com/${asset.key}`,
      permanent: true,
    }))];
  },
};

export default withPayload(nextConfig);
