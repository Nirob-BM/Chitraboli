// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Writes public/sitemap.xml with all static routes plus a URL per
// product fetched from the Supabase backend.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://chitraboli.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/collections", changefreq: "weekly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/track-order", changefreq: "monthly", priority: "0.4" },
  { path: "/trust", changefreq: "monthly", priority: "0.5" },
  {
    path: "/blog/identifying-handcrafted-jewelry",
    changefreq: "monthly",
    priority: "0.7",
  },
];

async function fetchProductEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env vars missing; skipping product URLs");
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      console.warn("[sitemap] Failed to fetch products:", error.message);
      return [];
    }
    return (data ?? []).map((p: { id: string; updated_at: string | null }) => ({
      path: `/product/${p.slug ?? p.id}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
      changefreq: "weekly" as const,
      priority: "0.7",
    }));
  } catch (err) {
    console.warn("[sitemap] Error loading products:", err);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const productEntries = await fetchProductEntries();
  const entries = [...staticEntries, ...productEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();
