import axios from "axios";
import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  summary?: string;
}

const parser = new Parser();

export async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const { data } = await axios.get<{ hits: Array<{ title: string; url?: string; objectID: string }> }>(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20"
    );
    return (data.hits || []).slice(0, 15).map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "Hacker News",
    }));
  } catch {
    return [];
  }
}

export async function fetchDevTo(): Promise<NewsItem[]> {
  try {
    const { data } = await axios.get<Array<{ title: string; url: string; description: string }>>(
      "https://dev.to/api/articles?per_page=10"
    );
    return (data || []).map((a) => ({
      title: a.title,
      url: a.url,
      source: "Dev.to",
      summary: a.description?.slice(0, 200),
    }));
  } catch {
    return [];
  }
}

export async function fetchGitHubTrending(): Promise<NewsItem[]> {
  try {
    const { data } = await axios.get<{ items?: Array<{ full_name: string; html_url: string }> }>(
      "https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=5",
      { headers: { Accept: "application/vnd.github.v3+json" } }
    );
    const repos = data?.items ?? [];
    return repos.map((r) => ({
      title: r.full_name,
      url: r.html_url,
      source: "GitHub",
    }));
  } catch {
    return [];
  }
}

export async function fetchTechCrunchRSS(): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL("https://techcrunch.com/feed/");
    return (feed.items || []).slice(0, 10).map((i) => ({
      title: i.title ?? "",
      url: i.link ?? "",
      source: "TechCrunch",
      summary: i.contentSnippet?.slice(0, 200),
    }));
  } catch {
    return [];
  }
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const [hn, devto, github, tc] = await Promise.all([
    fetchHackerNews(),
    fetchDevTo(),
    fetchGitHubTrending(),
    fetchTechCrunchRSS(),
  ]);
  const all = [...hn, ...devto, ...github, ...tc];
  const seen = new Set<string>();
  return all.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
