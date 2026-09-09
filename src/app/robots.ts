import type { MetadataRoute } from "next";
import { isIndexingEnabled, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return isIndexingEnabled()
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/preview"] }, sitemap: `${site.url}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
