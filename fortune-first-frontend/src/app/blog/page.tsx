import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

import { SiteHeader } from '@/features/landing/components/site-header';
import { SiteFooter } from '@/features/landing/components/site-footer';

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  excerpt: string;
}

async function getBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/blog`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data as BlogPostSummary[];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <main className="container-max px-4 pb-16 pt-32 md:pt-40">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Blog</h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground md:text-base">
            Insights and updates from the Fortune First team.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No posts published yet — check back soon.</p>
        ) : (
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays size={13} />
                  {formatDate(post.published_at)}
                </div>
                <h2 className="mb-2 text-lg font-bold text-foreground">{post.title}</h2>
                <p className="text-sm text-muted-foreground">{post.excerpt}…</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
