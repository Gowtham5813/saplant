import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Leaf, LoaderCircle, Newspaper, RefreshCw, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import forestImage from "@/assets/forest-aerial.jpg";

type NewsArticle = {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  author: string;
  topics: string[];
  source: string;
};

type NewsResponse = { articles: NewsArticle[]; updatedAt: string };
type Category = "All stories" | "Forests" | "Wildlife" | "Climate" | "Restoration";

const categories: Category[] = ["All stories", "Forests", "Wildlife", "Climate", "Restoration"];

const categoryFor = (article: NewsArticle): Exclude<Category, "All stories"> => {
  const text = `${article.title} ${article.summary} ${article.topics.join(" ")}`.toLowerCase();
  if (/restor|community|indigenous|people|reforest|landscape/.test(text)) return "Restoration";
  if (/wildlife|species|habitat|animal|biodiversity loss/.test(text)) return "Wildlife";
  if (/climate|warming|carbon|emission|drought|flood/.test(text)) return "Climate";
  return "Forests";
};

const relativeDate = (date: string) => {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Recently" : formatDistanceToNow(parsed, { addSuffix: true });
};

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All stories");

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: requestError } = await supabase.functions.invoke<NewsResponse>("tree-news", { body: {} });
    if (requestError || !data?.articles) {
      setError("The latest stories could not be loaded. Please try again.");
      setArticles([]);
    } else {
      setArticles(data.articles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = category === "All stories" || categoryFor(article) === category;
      const searchable = `${article.title} ${article.summary} ${article.source} ${article.topics.join(" ")}`.toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [articles, category, search]);

  const featured = category === "All stories" && !search ? visibleArticles[0] : undefined;
  const remainingArticles = featured ? visibleArticles.slice(1) : visibleArticles;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-surface-forest text-primary-foreground">
          <div className="absolute inset-0 bg-gradient-moss opacity-90" />
          <div className="container relative py-10 sm:py-14 md:py-16">
            <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
              <Leaf className="h-4 w-4" /> SAPLANT FIELD JOURNAL
            </div>
            <div className="mt-5 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
              <div className="max-w-3xl">
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">Stories shaping our forests.</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
                  Fresh reporting on trees, wildlife, climate, and the people restoring the natural world.
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => void loadNews()}
                disabled={loading}
                aria-label="Refresh news"
                title="Refresh news"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </section>

        <div className="container py-8 sm:py-10 md:py-12">
          <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter news by topic">
              {categories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={category === item ? "forest" : "ghost"}
                  role="tab"
                  aria-selected={category === item}
                  onClick={() => setCategory(item)}
                  className="shrink-0"
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stories"
                aria-label="Search stories"
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Gathering the latest stories…
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <Newspaper className="mx-auto h-9 w-9 text-primary-glow" />
              <p className="mt-4 text-muted-foreground">{error}</p>
              <Button variant="forest" className="mt-5" onClick={() => void loadNews()}>Try again</Button>
            </div>
          ) : (
            <>
              {featured && (
                <article className="grid overflow-hidden border-b border-border py-8 sm:py-10 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] md:gap-10 md:py-12">
                  <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-surface-cream md:min-h-[340px]">
                    <img src={forestImage} alt="A sunlit forest canopy" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center pt-6 md:py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-glow">
                      <span>{categoryFor(featured)}</span><span aria-hidden="true">·</span><span>{featured.source}</span>
                    </div>
                    <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{featured.title}</h2>
                    <p className="mt-4 line-clamp-4 leading-relaxed text-muted-foreground">{featured.summary || "Read the latest reporting from the people following forests and the natural world."}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{relativeDate(featured.publishedAt)}</span>
                      {featured.author && <span>By {featured.author}</span>}
                    </div>
                    <a href={featured.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-fit items-center gap-2 font-semibold text-primary hover:text-primary-glow">
                      Read the story <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              )}

              <div className="flex items-end justify-between gap-4 py-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">From trusted sources</p>
                  <h2 className="mt-1 font-serif text-2xl sm:text-3xl">Latest stories</h2>
                </div>
                <span className="pb-1 text-sm text-muted-foreground">{visibleArticles.length} {visibleArticles.length === 1 ? "story" : "stories"}</span>
              </div>

              {remainingArticles.length ? (
                <div className="grid gap-x-8 md:grid-cols-2">
                  {remainingArticles.map((article) => (
                    <article key={`${article.source}-${article.url}`} className="border-t border-border py-6 sm:py-7">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-glow">
                        <span>{categoryFor(article)}</span><span aria-hidden="true">·</span><span>{article.source}</span>
                      </div>
                      <h3 className="mt-2 font-serif text-xl leading-snug sm:text-2xl">{article.title}</h3>
                      {article.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{relativeDate(article.publishedAt)}{article.author ? ` · ${article.author}` : ""}</span>
                        <a href={article.url} target="_blank" rel="noreferrer" aria-label={`Read ${article.title}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-glow">
                          Read <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border-t border-border py-14 text-center">
                  <p className="text-muted-foreground">No stories match those filters.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default News;