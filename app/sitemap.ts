import type { MetadataRoute } from "next";
import { NAV_LINKS } from "@/lib/branding";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const links = [...NAV_LINKS];
  return links.map((link) => ({
    url: `${SITE_URL}${link.href === "/" ? "" : link.href}`,
    lastModified: new Date(),
    changeFrequency: link.href === "/" ? "daily" : "weekly",
    priority: link.href === "/" ? 1 : 0.7,
  }));
}
