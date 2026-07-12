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
type PublishRunStatus = "success" | "failed";

const MAX_ERROR_MESSAGE_LENGTH = 500;

const serializeErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message.slice(0, MAX_ERROR_MESSAGE_LENGTH);
    }

    return String(error).slice(0, MAX_ERROR_MESSAGE_LENGTH);
};

const insertPublishRun = async (
    dbBinding: DbBinding,
    {
        triggerType,
        triggerLabel,
        status,
        publishedCount,
        publishedSlugs,
        errorMessage,
        durationMs,
        createdAt,
    }: {
        triggerType: PublishTriggerType;
        triggerLabel: string | null;
        status: PublishRunStatus;
        publishedCount: number;
        publishedSlugs: string;
        errorMessage?: string | null;
        durationMs: number;
        createdAt: Date;
    }
) => {
    const db = getDb(dbBinding);

    await db.insert(publishRuns).values({
        triggerType,
        triggerLabel,
        status,
        publishedCount,
        publishedSlugs,
        errorMessage: errorMessage ?? null,
        durationMs,
        createdAt,
    });
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
    const startedAt = Date.now();

    try {
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
        const durationMs = Date.now() - startedAt;

        if (duePosts.length === 0) {
            if (shouldLog) {
                await insertPublishRun(dbBinding, {
                    triggerType,
                    triggerLabel,
                    status: "success",
                    publishedCount: 0,
                    publishedSlugs: "",
                    durationMs,
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
            await insertPublishRun(dbBinding, {
                triggerType,
                triggerLabel,
                status: "success",
                publishedCount: duePosts.length,
                publishedSlugs: duePosts.map((post) => post.slug).join(","),
                durationMs,
                createdAt: now,
            });
        }

        return {
            publishedCount: duePosts.length,
            postIds: duePosts.map((post) => post.id),
            slugs: duePosts.map((post) => post.slug),
        };
    } catch (error) {
        const shouldLog = triggerType !== "request";
        const durationMs = Date.now() - startedAt;

        if (shouldLog) {
            try {
                await insertPublishRun(dbBinding, {
                    triggerType,
                    triggerLabel,
                    status: "failed",
                    publishedCount: 0,
                    publishedSlugs: "",
                    errorMessage: serializeErrorMessage(error),
                    durationMs,
                    createdAt: now,
                });
            } catch (logError) {
                console.error("Failed to record publish run error", logError);
            }
        }

        throw error;
    }
};
