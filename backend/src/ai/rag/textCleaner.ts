import * as cheerio from "cheerio";

/**
 * Normalizes multi-line whitespace and removes control characters.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Cleans raw HTML text into meaningful, human-readable prose.
 * Strips out script, style, nav, footer, cookie banners, tracking code,
 * and extracts semantic content (headings, paragraphs, lists, meta descriptions).
 */
export function cleanCompanyHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  try {
    const $ = cheerio.load(html);

    // Remove noise elements that contain zero useful company context
    $(
      "script, style, noscript, svg, iframe, canvas, nav, footer, header, form, [role='dialog'], [aria-modal='true'], .cookie-banner, #cookie-consent, .modal, .popup"
    ).remove();

    const textSegments: string[] = [];

    // 1. Meta descriptions often provide the best executive summary of a company
    const metaDescription =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content");

    if (metaDescription && metaDescription.trim().length > 20) {
      textSegments.push(`Overview: ${metaDescription.trim()}`);
    }

    // 2. Main headings and hero sections
    $("h1, h2, h3").each((_, el) => {
      const heading = $(el).text().trim();
      if (heading.length > 5 && heading.length < 200) {
        textSegments.push(heading);
      }
    });

    // 3. Meaningful paragraphs
    $("p, article, section, [class*='about'], [class*='mission'], [class*='product'], [class*='features']").each(
      (_, el) => {
        const text = $(el).text().trim();
        // Ignore very short snippets or repetitive links
        if (text.length > 30 && !text.includes("©") && !text.includes("All rights reserved")) {
          textSegments.push(text);
        }
      }
    );

    // 4. Bullet list items (often list features, benefits, or tech stack items)
    $("ul li, ol li").each((_, el) => {
      const item = $(el).text().trim();
      if (item.length > 15 && item.length < 300) {
        textSegments.push(`• ${item}`);
      }
    });

    // Deduplicate identical lines
    const seen = new Set<string>();
    const deduplicated = textSegments.filter((line) => {
      const normalized = line.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    return normalizeWhitespace(deduplicated.join("\n\n"));
  } catch {
    // If cheerio parsing fails, fallback to regex stripping
    return normalizeWhitespace(
      html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
    );
  }
}

/**
 * Cleans structured or unstructured scraped context into an aggregated,
 * coherent body of text ready for document chunking.
 */
export function cleanScrapedContext(scrapedData: any): string {
  if (!scrapedData) return "";

  if (typeof scrapedData === "string") {
    // If it's a JSON string, try parsing it first
    try {
      const parsed = JSON.parse(scrapedData);
      return cleanScrapedContext(parsed);
    } catch {
      // If it looks like HTML, clean it with HTML parser
      if (scrapedData.includes("<") && scrapedData.includes(">")) {
        return cleanCompanyHtml(scrapedData);
      }
      return normalizeWhitespace(scrapedData);
    }
  }

  if (typeof scrapedData === "object") {
    const parts: string[] = [];

    if (scrapedData.description) {
      parts.push(`Company Description:\n${scrapedData.description}`);
    }

    if (Array.isArray(scrapedData.techStack) && scrapedData.techStack.length > 0) {
      parts.push(`Technology Stack & Tools:\n${scrapedData.techStack.join(", ")}`);
    }

    if (Array.isArray(scrapedData.pageHighlights) && scrapedData.pageHighlights.length > 0) {
      parts.push(`Key Highlights & Products:\n${scrapedData.pageHighlights.join("\n")}`);
    }

    if (Array.isArray(scrapedData.recentNews) && scrapedData.recentNews.length > 0) {
      parts.push(`Recent Company News & Updates:\n${scrapedData.recentNews.join("\n")}`);
    }

    if (scrapedData.culture) {
      parts.push(`Engineering Culture & Values:\n${scrapedData.culture}`);
    }

    if (Array.isArray(scrapedData.socialSignals) && scrapedData.socialSignals.length > 0) {
      parts.push(`Public Signals & Focus:\n${scrapedData.socialSignals.join("\n")}`);
    }

    if (Array.isArray(scrapedData.hookCandidates) && scrapedData.hookCandidates.length > 0) {
      parts.push(`Identified Company Angles:\n${scrapedData.hookCandidates.join("\n")}`);
    }

    // Include any other string properties
    for (const [key, value] of Object.entries(scrapedData)) {
      if (
        ![
          "description",
          "techStack",
          "pageHighlights",
          "recentNews",
          "culture",
          "socialSignals",
          "hookCandidates",
          "socialLinks",
        ].includes(key) &&
        typeof value === "string" &&
        value.trim().length > 10
      ) {
        parts.push(`${key}:\n${value.trim()}`);
      }
    }

    return normalizeWhitespace(parts.join("\n\n"));
  }

  return "";
}
