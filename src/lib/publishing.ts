import { and, eq, inArray, lte } from "drizzle-orm";
import type { APIContext } from "astro";

import { getDb } from "@/db";
import { posts, publishRuns } from "@/db/schema";

type RuntimeLocals = Pick<APIContext["locals"], "runtime">;
type DbBinding = D1Database;
type PublishTriggerType = "cron" | "manual" | "request";
type PublishRunOptions = {
    triggerType?: PublishTriggerType;
    triggerLabel?: string | null;
};

export const createPublicPostVisibilityFilter = (now = new Date()) =>
    and(eq(posts.status, "published"), lte(posts.publishedAt, now));

export const publishDueScheduledPosts = async (context: RuntimeLocals) => {
    const now = new Date();
    return publishDueScheduledPostsByBinding(context.locals.runtime.env.DB, now, {
        triggerType: "request",
        triggerLabel: "middleware",
    });
};

export const publishDueScheduledPostsByBinding = async (
    dbBinding: DbBinding,
    now = new Date(),
    options?: PublishRunOptions
) => {
    const db = getDb(dbBinding);
    const triggerType = options?.triggerType ?? "request";
    const triggerLabel = options?.triggerLabel ?? null;

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

    const shouldLog = triggerType !== "request" || duePosts.length > 0;
    if (duePosts.length === 0) {
        if (shouldLog) {
            await db.insert(publishRuns).values({
                triggerType,
                triggerLabel,
                publishedCount: 0,
                publishedSlugs: "",
                createdAt: now,
            });
        }
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

    if (shouldLog) {
        await db.insert(publishRuns).values({
            triggerType,
            triggerLabel,
            publishedCount: duePosts.length,
            publishedSlugs: duePosts.map((post) => post.slug).join(","),
            createdAt: now,
        });
    }

    return {
        publishedCount: duePosts.length,
        postIds: duePosts.map((post) => post.id),
        slugs: duePosts.map((post) => post.slug),
    };
};
