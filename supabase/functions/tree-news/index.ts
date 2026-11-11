import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { XMLParser } from "npm:fast-xml-parser@4.5.3";

const feeds = [
  { name: "Mongabay", url: "https://news.mongabay.com/feed/" },
  { name: "Forests News", url: "https://www.forestsnews.org/feed" },
] as const;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
});

const asText = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) {
    return asText((value as { "#text": unknown })["#text"]);
  }
  return "";
};

const cleanText = (value: unknown): string =>
  asText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

const asList = (value: unknown): unknown[] =>
  value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const projectUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !projectUrl || !publishableKey) return json({ error: "Unauthorized" }, 401);

  const client = createClient(projectUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0) {
    return json({ error: "Invalid request body" }, 400);
  }

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const response = await fetch(feed.url, {
        headers: { Accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);

      const parsed = parser.parse(await response.text());
      const channel = parsed?.rss?.channel ?? parsed?.feed;
      const items = asList(channel?.item);

      return items.slice(0, 24).flatMap((rawItem) => {
        if (!rawItem || typeof rawItem !== "object") return [];
        const item = rawItem as Record<string, unknown>;
        const title = cleanText(item.title);
        const url = cleanText(item.link);
        const publishedAt = cleanText(item.pubDate ?? item.published ?? item.updated);
        const summary = cleanText(item.description ?? item.summary ?? item["content:encoded"]);
        const author = cleanText(item.creator ?? item.author);
        const topics = asList(item.category ?? item["topic-tags"])
          .map(cleanText)
          .filter(Boolean);

        if (!title || !url.startsWith("https://")) return [];
        return [{ title, url, publishedAt, summary, author, topics, source: feed.name }];
      });
    }),
  );

  const articles = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (articles.length === 0) return json({ error: "News feeds are temporarily unavailable" }, 502);

  articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return json({ articles: articles.slice(0, 40), updatedAt: new Date().toISOString() });
});