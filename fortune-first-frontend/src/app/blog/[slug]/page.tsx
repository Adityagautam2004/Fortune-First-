import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, User } from 'lucide-react';

import { SiteHeader } from '@/features/landing/components/site-header';
import { SiteFooter } from '@/features/landing/components/site-footer';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  author_name: string | null;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/blog/${slug}`, {
      next: { revalidate: 600 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as BlogPost;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />
      <main className="container-max px-4 pb-16 pt-32 md:pt-40">
        <article className="mx-auto max-w-2xl">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft size={15} /> Back to Blog
          </Link>

          <h1 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">{post.title}</h1>

          <div className="mb-8 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} /> {formatDate(post.published_at)}
            </span>
            {post.author_name && (
              <span className="flex items-center gap-1.5">
                <User size={13} /> {post.author_name}
              </span>
            )}
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
            {post.content}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
