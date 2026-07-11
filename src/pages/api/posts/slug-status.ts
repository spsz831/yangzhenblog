import type { APIRoute } from "astro";
import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { findNextNumericSlug, requireAdminSession } from "@/lib/admin-posts";

export const GET: APIRoute = async ({ url, locals, cookies, redirect }) => {
    const authRedirect = requireAdminSession({ cookies, redirect });
    if (authRedirect) {
        return authRedirect;
    }

    const slug = url.searchParams.get("slug")?.trim() ?? "";
    const excludeIdParam = url.searchParams.get("excludeId");
    const excludePostId = excludeIdParam ? Number.parseInt(excludeIdParam, 10) : undefined;

    if (!slug) {
        return Response.json({
            ok: false,
            message: "slug 不能为空。",
        }, { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);
    const existingPost = await db.select({ id: posts.id })
        .from(posts)
        .where(
            excludePostId
                ? and(eq(posts.slug, slug), ne(posts.id, excludePostId))
                : eq(posts.slug, slug)
        )
        .get();

    const suggestion = /^\d+$/.test(slug)
        ? await findNextNumericSlug({ locals }, { excludePostId })
        : null;

    return Response.json({
        ok: true,
        exists: Boolean(existingPost),
        suggestion,
    });
};
