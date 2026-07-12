import { and, eq, lte } from "drizzle-orm";
import type { APIContext } from "astro";

import { getDb } from "@/db";
import { posts } from "@/db/schema";

type RuntimeLocals = Pick<APIContext["locals"], "runtime">;

export const createPublicPostVisibilityFilter = (now = new Date()) =>
    and(eq(posts.status, "published"), lte(posts.publishedAt, now));

export const publishDueScheduledPosts = async (context: RuntimeLocals) => {
    const now = new Date();
    const db = getDb(context.locals.runtime.env.DB);

    await db
        .update(posts)
        .set({
            status: "published",
            updatedAt: now,
        })
        .where(
            and(
                eq(posts.status, "scheduled"),
                lte(posts.publishedAt, now)
            )
        );
};
