import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { parsePostForm, PostFormError, requireAdminSession, syncPostTags } from "@/lib/admin-posts";

export const POST: APIRoute = async ({ request, locals, redirect, cookies }) => {
    const authRedirect = await requireAdminSession({ cookies, locals, redirect });
    if (authRedirect) {
        return authRedirect;
    }

    try {
        const { title, slug, content, excerpt, metaTitle, metaDescription, coverImage, status, publishedAt, tags } = await parsePostForm(
            { request, locals }
        );
        const db = getDb(locals.runtime.env.DB);
        const result = await db.insert(posts).values({
            title,
            slug,
            content,
            excerpt,
            metaTitle,
            metaDescription,
            coverImage,
            status: status as "draft" | "published" | "scheduled",
            likes: 0,
            publishedAt,
        }).returning({ id: posts.id });

        const postId = result[0].id;
        await syncPostTags({ locals }, postId, tags);
    } catch (e) {
        if (e instanceof PostFormError) {
            return redirect(`/admin/posts/new?error=${encodeURIComponent(e.message)}`);
        }
        return redirect(`/admin/posts/new?error=${encodeURIComponent("创建文章失败，请检查 slug、标签或发布时间。")}`);
    }

    return redirect("/admin/posts?success=post_created");
};
