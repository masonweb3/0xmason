import type { MetadataRoute } from "next";
import { assetUrl } from '@/lib/cdn';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Mason · 独立开发，分享实践", short_name: "Mason",
    description: "Mason 的账户与支付、eSIM 保号记录。",
    lang: "zh-CN", start_url: "/", scope: "/", display: "browser",
    background_color: "#f4f6f8", theme_color: "#101214",
    icons: [
      { src: assetUrl('icons/icon-192.png'), sizes: "192x192", type: "image/webp", purpose: "any" },
      { src: assetUrl('icons/icon-512.png'), sizes: "512x512", type: "image/webp", purpose: "any" },
    ],
  };
}
