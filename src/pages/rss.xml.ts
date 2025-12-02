import rss from '@astrojs/rss';
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { desc, eq, lte, and } from "drizzle-orm";
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
    const db = getDb(context.locals.runtime.env.DB);
    const publishedPosts = await db.select().from(posts)
        .where(and(
            eq(posts.status, 'published'),
            lte(posts.publishedAt, new Date())
        ))
        .orderBy(desc(posts.publishedAt)).all();

    return rss({
        title: 'Yang Zhen Blog',
        description: 'Thoughts, stories, and ideas.',
        site: context.site ?? 'https://yangzhenblog.pages.dev',
        items: publishedPosts.map((post) => ({
            title: post.title,
            pubDate: post.publishedAt!,
            description: post.excerpt || '',
            link: `/posts/${post.slug}/`,
        })),
    });
}
