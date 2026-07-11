import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/admin-posts";

export const POST: APIRoute = async ({ locals, params, redirect, cookies }) => {
    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    const authRedirect = await requireAdminSession({ cookies, locals, redirect });
    if (authRedirect) {
        return authRedirect;
    }

    const db = getDb(locals.runtime.env.DB);

    try {
        await db.delete(posts).where(eq(posts.id, Number(id)));
    } catch (e) {
        return redirect(`/admin/posts/${id}/edit?error=${encodeURIComponent("删除文章失败。")}`);
    }

    return redirect("/admin/posts?success=post_deleted");
};
