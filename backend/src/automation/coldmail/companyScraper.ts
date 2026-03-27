import axios from "axios";
import * as cheerio from "cheerio";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapedContext {
  description?: string;
  recentNews?: string[];
  techStack?: string[];
  culture?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  socialSignals?: string[];
  pageHighlights?: string[];
  hookCandidates?: string[];
}

async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data } = await axios.get(url, {
        timeout: 12000,
        headers: { "User-Agent": USER_AGENT },
        maxRedirects: 5,
      });
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return "";
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, limit: number): string {
  return normalizeWhitespace(value).slice(0, limit);
}

function uniqueStrings(values: Array<string | undefined | null>, limit = 20): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value ? normalizeWhitespace(value) : "";
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

function resolveUrl(baseUrl: string, href?: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function detectPlatform(url: string): string | null {
  const value = url.toLowerCase();
  if (value.includes("linkedin.com")) return "LinkedIn";
  if (value.includes("twitter.com") || value.includes("x.com")) return "X";
  if (value.includes("instagram.com")) return "Instagram";
  if (value.includes("facebook.com")) return "Facebook";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "YouTube";
  if (value.includes("github.com")) return "GitHub";
  if (value.includes("medium.com")) return "Medium";
  return null;
}

function extractTextBlocks($: cheerio.CheerioAPI): string[] {
  return uniqueStrings([
    $("meta[name='description']").attr("content"),
    $("meta[property='og:description']").attr("content"),
    $("h1").first().text(),
    $("h2").slice(0, 4).map((_, el) => $(el).text()).get().join(" "),
    $("p").slice(0, 12).map((_, el) => $(el).text()).get().join(" "),
  ], 10);
}

function extractHeadlineCandidates($: cheerio.CheerioAPI): string[] {
  const selectors = [
    "article h1",
    "article h2",
    "article h3",
    "[class*='post'] h2",
    "[class*='blog'] h2",
    "[class*='news'] h2",
    "main h2",
    "main h3",
  ];

  const values = selectors.flatMap((selector) =>
    $(selector)
      .slice(0, 6)
      .map((_, el) => truncate($(el).text(), 180))
      .get(),
  );

  return uniqueStrings(values, 8);
}

async function scrapeCompanyWebsite(websiteUrl: string): Promise<Partial<ScrapedContext>> {
  const ctx: Partial<ScrapedContext> = {};
  const base = websiteUrl.replace(/\/$/, "");
  const paths = ["", "/about", "/about-us", "/careers", "/blog", "/news", "/resources"];

  const pageText: string[] = [];
  const pageHighlights: string[] = [];
  const socialLinks: Array<{ platform: string; url: string }> = [];

  for (const p of paths) {
    try {
      const url = p ? `${base}${p}` : websiteUrl;
      const html = await fetchWithRetry(url);
      const $ = cheerio.load(html);

      pageText.push(...extractTextBlocks($));
      pageHighlights.push(...extractHeadlineCandidates($));

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        const resolved = resolveUrl(url, href);
        if (!resolved) return;
        const platform = detectPlatform(resolved);
        if (platform) {
          socialLinks.push({ platform, url: resolved });
        }
      });
    } catch {
      // Skip failed paths
    }
  }

  const fullText = uniqueStrings(pageText, 20).join(" ");
  if (fullText) {
    ctx.description = truncate(fullText, 2200);

    const techKeywords = [
      "React",
      "Node.js",
      "TypeScript",
      "Python",
      "Go",
      "Kubernetes",
      "AWS",
      "GraphQL",
      "Frappe",
      "ERPNext",
      "Django",
      "FastAPI",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Docker",
      "Rust",
      "Java",
      "RazorpayX",
      "Stripe",
      "Twilio",
      "Firebase",
      "Observability",
      "AIOps",
      "Cloud",
      "OpenTelemetry",
      "Kafka",
    ];
    ctx.techStack = techKeywords.filter((t) => fullText.toLowerCase().includes(t.toLowerCase()));
  }

  ctx.pageHighlights = uniqueStrings(pageHighlights.map((value) => truncate(value, 180)), 8);
  ctx.socialLinks = socialLinks.filter(
    (link, index, arr) => arr.findIndex((item) => item.url === link.url) === index,
  ).slice(0, 8);

  return ctx;
}

async function fetchCompanyNews(companyName: string): Promise<string[]> {
  if (!env.NEWS_API_KEY) return [];
  try {
    const url = `https://newsapi.org/v2/everything?q="${encodeURIComponent(companyName)}"&sortBy=publishedAt&pageSize=4&language=en&apiKey=${env.NEWS_API_KEY}`;
    const { data } = await axios.get(url, { timeout: 8000 });
    if (!data.articles || data.articles.length === 0) return [];
    return uniqueStrings(
      data.articles.map((a: any) =>
        truncate(`${a.title}${a.description ? ` - ${a.description}` : ""}`, 220),
      ),
      4,
    );
  } catch {
    return [];
  }
}

async function scrapeSocialSignals(
  socialLinks: Array<{ platform: string; url: string }>,
): Promise<string[]> {
  const results: string[] = [];

  for (const link of socialLinks.slice(0, 3)) {
    try {
      const html = await fetchWithRetry(link.url, 1);
      const $ = cheerio.load(html);
      const metaTitle = $("meta[property='og:title']").attr("content") || $("title").text();
      const metaDescription =
        $("meta[property='og:description']").attr("content") ||
        $("meta[name='description']").attr("content");
      const summary = uniqueStrings([
        metaTitle ? `${link.platform}: ${truncate(metaTitle, 140)}` : "",
        metaDescription ? `${link.platform} update: ${truncate(metaDescription, 220)}` : "",
      ], 2);
      results.push(...summary);
    } catch {
      // Social pages can block scraping; ignore quietly.
    }
  }

  return uniqueStrings(results, 6);
}

function buildHookCandidates(ctx: ScrapedContext, companyName: string): string[] {
  return uniqueStrings([
    ...(ctx.recentNews ?? []),
    ...(ctx.socialSignals ?? []),
    ...(ctx.pageHighlights ?? []).map((value) => `${companyName} website: ${value}`),
    ctx.description ? truncate(ctx.description, 220) : "",
  ], 8);
}

export async function scrapeCompany(companyId: number): Promise<void> {
  const company = companyQueries.getById(companyId);
  if (!company) return;

  logger.info(`Starting research for ${company.company_name}...`, { source: "scraper" });

  const ctx: ScrapedContext = {};

  if (company.website_url) {
    try {
      const webCtx = await scrapeCompanyWebsite(company.website_url);
      Object.assign(ctx, webCtx);
      logger.info(`Website scraped for ${company.company_name}`, { source: "scraper" });
    } catch (e) {
      logger.warn(`Failed to scrape ${company.company_name} website`, {
        error: String(e),
        source: "scraper",
      });
    }
  }

  try {
    const news = await fetchCompanyNews(company.company_name);
    if (news.length > 0) {
      ctx.recentNews = news;
      logger.info(`Found ${news.length} news articles for ${company.company_name}`, { source: "scraper" });
    }
  } catch (e) {
    logger.warn(`News fetch failed for ${company.company_name}`, { error: String(e), source: "scraper" });
  }

  try {
    const explicitLinks: Array<{ platform: string; url: string }> = [];
    if (company.linkedin_url) {
      explicitLinks.push({ platform: "LinkedIn", url: company.linkedin_url });
    }
    const links = uniqueStrings(
      [...(ctx.socialLinks ?? []), ...explicitLinks].map((link) => `${link.platform}|${link.url}`),
      8,
    ).map((value) => {
      const [platform, url] = value.split("|");
      return { platform, url };
    });
    ctx.socialLinks = links;
    ctx.socialSignals = await scrapeSocialSignals(links);
  } catch (e) {
    logger.warn(`Social research failed for ${company.company_name}`, { error: String(e), source: "scraper" });
  }

  ctx.hookCandidates = buildHookCandidates(ctx, company.company_name);

  companyQueries.updateStatus(companyId, "scraped", {
    scraped_context: JSON.stringify(ctx),
  });

  logger.info(`Research complete for ${company.company_name}`, { source: "scraper" });
}
