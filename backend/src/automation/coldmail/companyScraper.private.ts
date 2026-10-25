import axios from "axios";
import * as cheerio from "cheerio";
import { companyQueries } from "../../db/queries.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import { getChatModel } from "../../ai/llm.js";

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

async function findCompanyWebsite(companyName: string): Promise<string | null> {
  try {
    const { data } = await axios.get(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`, {
      timeout: 5000,
    });
    if (data && data.length > 0 && data[0].domain) {
      return `https://${data[0].domain}`;
    }
  } catch (e) {
    logger.warn(`Clearbit autocomplete failed for ${companyName}`, { error: String(e), source: "scraper" });
  }
  return null;
}

/**
 * Uses Gemini to perform real, deep research on a company:
 * - What the company actually does (core products, platforms, services)
 * - Specific tech stack used/specialized in
 * - Recent company initiatives, AI integrations, or milestones
 * - Company engineering culture and authentic personalization hooks
 */
export async function researchCompanyWithGemini(
  companyName: string,
  websiteUrl?: string | null,
  targetRole?: string | null
): Promise<Partial<ScrapedContext>> {
  try {
    const model = getChatModel({ temperature: 0.2 });
    const prompt = `You are an elite corporate intelligence and technology researcher.
Research and return factual, specific, up-to-date knowledge about the company: "${companyName}".
${websiteUrl ? `Website URL: "${websiteUrl}".` : ""}
${targetRole ? `Target Engineering Role: "${targetRole}".` : ""}

Provide authentic, detailed company insights in strict JSON format:
{
  "description": "2-3 comprehensive sentences explaining what ${companyName} actually does: their primary industry, core products, SaaS platforms or digital services, target customers, and business model.",
  "techStack": ["5-10 specific programming languages, frameworks, cloud platforms, AI/ML tools, or databases commonly associated with or used by ${companyName}"],
  "recentNews": ["2-3 specific recent company developments, product launches, AI initiatives, client solutions, or domain achievements"],
  "culture": "A short, crisp statement capturing their engineering philosophy, innovation focus, and delivery culture.",
  "hookCandidates": [
    "2-3 specific, conversational personalization hooks referencing their real business, core products, or engineering initiatives that a candidate can mention naturally in outreach"
  ]
}

Return ONLY valid JSON matching this schema without markdown code blocks.`;

    const res = await model.invoke(prompt);
    const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      description: typeof parsed.description === "string" ? parsed.description : undefined,
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
      recentNews: Array.isArray(parsed.recentNews) ? parsed.recentNews : [],
      culture: typeof parsed.culture === "string" ? parsed.culture : undefined,
      hookCandidates: Array.isArray(parsed.hookCandidates) ? parsed.hookCandidates : [],
    };
  } catch (error: any) {
    logger.warn(`[CompanyScraper] Gemini company research failed: ${error?.message || error}`, {
      source: "scraper",
    });
    return {};
  }
}

export async function scrapeCompany(companyId: string): Promise<void> {
  const company = await companyQueries.getById(companyId);
  if (!company) return;

  logger.info(`Starting research for ${company.company_name}...`, { source: "scraper" });

  const ctx: ScrapedContext = {};
  let websiteUrl = company.website_url;

  if (!websiteUrl) {
    websiteUrl = await findCompanyWebsite(company.company_name);
    if (websiteUrl) {
      await companyQueries.update(companyId, { website_url: websiteUrl });
      logger.info(`Resolved website URL for ${company.company_name} to ${websiteUrl}`, { source: "scraper" });
    }
  }

  // 1. Perform deep AI research with Gemini to guarantee accurate company facts, products, tech stack, and news
  try {
    const aiCtx = await researchCompanyWithGemini(company.company_name, websiteUrl, company.role);
    if (aiCtx.description) ctx.description = aiCtx.description;
    if (aiCtx.techStack && aiCtx.techStack.length > 0) ctx.techStack = aiCtx.techStack;
    if (aiCtx.recentNews && aiCtx.recentNews.length > 0) ctx.recentNews = aiCtx.recentNews;
    if (aiCtx.culture) ctx.culture = aiCtx.culture;
    if (aiCtx.hookCandidates && aiCtx.hookCandidates.length > 0) ctx.hookCandidates = aiCtx.hookCandidates;
    logger.info(`Gemini AI intelligence gathered for ${company.company_name}`, { source: "scraper" });
  } catch (err: any) {
    logger.warn(`Gemini research step error: ${err?.message || err}`, { source: "scraper" });
  }

  // 2. Scrape company website if reachable, and augment/merge
  if (websiteUrl) {
    try {
      const webCtx = await scrapeCompanyWebsite(websiteUrl);
      if (webCtx.description) {
        ctx.description = ctx.description
          ? `${ctx.description}\n\nWebsite Highlights: ${webCtx.description.slice(0, 1000)}`
          : webCtx.description;
      }
      if (webCtx.techStack && webCtx.techStack.length > 0) {
        ctx.techStack = uniqueStrings([...(ctx.techStack || []), ...webCtx.techStack], 15);
      }
      if (webCtx.pageHighlights && webCtx.pageHighlights.length > 0) {
        ctx.pageHighlights = webCtx.pageHighlights;
      }
      if (webCtx.socialLinks && webCtx.socialLinks.length > 0) {
        ctx.socialLinks = webCtx.socialLinks;
      }
      logger.info(`Website scraped for ${company.company_name}`, { source: "scraper" });
    } catch (e) {
      logger.warn(`Failed to scrape ${company.company_name} website`, {
        error: String(e),
        source: "scraper",
      });
    }
  }

  // 3. NewsAPI if configured
  try {
    const news = await fetchCompanyNews(company.company_name);
    if (news.length > 0) {
      ctx.recentNews = uniqueStrings([...(ctx.recentNews || []), ...news], 6);
      logger.info(`Found ${news.length} news articles for ${company.company_name}`, { source: "scraper" });
    }
  } catch (e) {
    logger.warn(`News fetch failed for ${company.company_name}`, { error: String(e), source: "scraper" });
  }

  // 4. Social links and signals
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

  // 5. Hooks
  const generatedHooks = buildHookCandidates(ctx, company.company_name);
  ctx.hookCandidates = uniqueStrings([...(ctx.hookCandidates || []), ...generatedHooks], 8);

  await companyQueries.updateStatus(companyId, "scraped", {
    scraped_context: JSON.stringify(ctx),
  });

  logger.info(`Research complete for ${company.company_name}`, { source: "scraper" });
}
