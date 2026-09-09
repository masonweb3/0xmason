import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";
import { assetUrl } from '@/lib/cdn';
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s · Mason" },
  description: site.description,
  applicationName: site.name,
  creator: site.name,
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: assetUrl('favicon.ico'), sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: assetUrl('icon.png'), sizes: '48x48', type: 'image/webp' },
    ],
    apple: [{ url: assetUrl('apple-icon.png'), sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#101214" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={GeistSans.variable} data-scroll-behavior="smooth">
      <body>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">跳到正文</a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
