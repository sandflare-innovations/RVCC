import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LuArrowLeft as ArrowLeft,
  LuArrowUpRight as ArrowUpRight,
  LuCalendar as Calendar,
  LuTag as Tag,
} from "react-icons/lu";

import { Footer } from "@/components/layout/Footer";
import { getNews, getNewsBySlug } from "@/lib/content/news";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const revalidate = 60;

export async function generateStaticParams() {
  const allNews = await getNews();
  return allNews.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | RVCC",
    };
  }

  return {
    title: `${article.title} | RVCC News & Events`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.imageUrl ? [{ url: article.imageUrl }] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [article, allNews] = await Promise.all([
    getNewsBySlug(slug),
    getNews(),
  ]);

  if (!article) {
    notFound();
  }

  // Filter out current article for "Recent Articles"
  const recentArticles = allNews
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  // Split content by double linebreaks for multi-paragraph formatting
  const paragraphs = article.content
    ? article.content.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : [article.excerpt];

  return (
    <main className="min-h-screen bg-white">
      {/* Article Header & Hero */}
      <article className="pt-32 md:pt-40">
        <div className="container mx-auto max-w-4xl px-6">
          {/* Back Navigation */}
          <Link
            href="/news"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-brand-blue"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
            Back to All News
          </Link>

          {/* Meta Info */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-bold tracking-wider text-brand-blue uppercase">
              {article.category}
            </span>
            {article.edition && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs text-zinc-600">
                {article.edition}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Calendar size={13} />
              {article.date}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-heading mb-8 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl md:text-5xl md:leading-tight">
            {article.title}
          </h1>

          {/* Excerpt Lead */}
          <p className="mb-10 text-lg leading-relaxed text-zinc-600 md:text-xl font-normal border-l-2 border-brand-blue pl-6 italic">
            {article.excerpt}
          </p>
        </div>

        {/* Featured Cover Image */}
        <div className="container mx-auto max-w-5xl px-6 mb-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-zinc-100 shadow-2xl shadow-zinc-900/10">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Article Body */}
        <div className="container mx-auto max-w-3xl px-6 pb-20">
          <div className="space-y-6 text-base leading-relaxed text-zinc-700 md:text-lg">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Article Footer & Tags */}
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-b border-zinc-200 py-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <Tag size={14} className="text-zinc-400" />
              Category: <span className="text-zinc-900">{article.category}</span>
            </div>
            <Link
              href="/news"
              className="text-xs font-bold tracking-wider text-brand-blue uppercase hover:underline"
            >
              Explore more articles &rarr;
            </Link>
          </div>
        </div>
      </article>

      {/* Related News Section */}
      {recentArticles.length > 0 && (
        <section className="border-t border-zinc-100 bg-zinc-50 py-20">
          <div className="container mx-auto px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">
                  More Stories
                </span>
                <h2 className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-zinc-900 uppercase md:text-3xl">
                  Recent News &amp; Events
                </h2>
              </div>
              <Link
                href="/news"
                className="hidden items-center gap-1.5 text-xs font-bold tracking-widest text-zinc-900 uppercase transition-colors hover:text-brand-blue md:flex"
              >
                View All
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {recentArticles.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/50"
                >
                  <Link href={`/news/${item.slug}`} className="flex h-full flex-col">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 rounded-md bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-brand-blue uppercase shadow-sm">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <span className="mb-2 text-xs font-medium text-zinc-400">
                        {item.date}
                      </span>
                      <h3 className="font-heading mb-2 line-clamp-2 text-base font-bold text-zinc-900 group-hover:text-brand-blue transition-colors">
                        {item.title}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">
                        {item.excerpt}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
