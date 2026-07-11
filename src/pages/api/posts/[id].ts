import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parsePostForm, PostFormError, requireAdminSession, syncPostTags } from "@/lib/admin-posts";

export const POST: APIRoute = async ({ request, locals, params, redirect, cookies }) => {
    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    const authRedirect = await requireAdminSession({ cookies, locals, redirect });
    if (authRedirect) {
        return authRedirect;
    }

    try {
        const { title, slug, content, excerpt, status, publishedAt, tags } = await parsePostForm(
            { request, locals },
            { postId: Number(id) }
        );
        const db = getDb(locals.runtime.env.DB);

        await db.update(posts)
            .set({
                title,
                slug,
                content,
                excerpt,
                status: status as "draft" | "published" | "scheduled",
                updatedAt: new Date(),
                publishedAt
            })
            .where(eq(posts.id, Number(id)));

        await syncPostTags({ locals }, Number(id), tags);
    } catch (e) {
        if (e instanceof PostFormError) {
            return redirect(`/admin/posts/${id}/edit?error=${encodeURIComponent(e.message)}`);
        }
        return redirect(`/admin/posts/${id}/edit?error=${encodeURIComponent("保存失败，请检查 slug、标签或发布时间。")}`);
    }

    return redirect("/admin/posts?success=post_updated");
};
