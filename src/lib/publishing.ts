import { and, eq, inArray, lte } from "drizzle-orm";
import type { APIContext } from "astro";

import { getDb } from "@/db";
import { posts } from "@/db/schema";

type RuntimeLocals = Pick<APIContext["locals"], "runtime">;
type DbBinding = D1Database;

export const createPublicPostVisibilityFilter = (now = new Date()) =>
    and(eq(posts.status, "published"), lte(posts.publishedAt, now));

export const publishDueScheduledPosts = async (context: RuntimeLocals) => {
    const now = new Date();
    return publishDueScheduledPostsByBinding(context.locals.runtime.env.DB, now);
};

export const publishDueScheduledPostsByBinding = async (
    dbBinding: DbBinding,
    now = new Date()
) => {
    const db = getDb(dbBinding);

    const duePosts = await db
        .select({ id: posts.id, slug: posts.slug })
        .from(posts)
        .where(
            and(
                eq(posts.status, "scheduled"),
                lte(posts.publishedAt, now)
            )
        )
        .all();

    if (duePosts.length === 0) {
        return {
            publishedCount: 0,
            postIds: [] as number[],
            slugs: [] as string[],
        };
    }

    await db
        .update(posts)
        .set({
            status: "published",
            updatedAt: now,
        })
        .where(
            and(
                eq(posts.status, "scheduled"),
                inArray(posts.id, duePosts.map((post) => post.id))
            )
        );

    return {
        publishedCount: duePosts.length,
        postIds: duePosts.map((post) => post.id),
        slugs: duePosts.map((post) => post.slug),
    };
};
