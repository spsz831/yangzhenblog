import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts, tags, postsToTags } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
    const formData = await request.formData();
    const title = formData.get("title")?.toString();
    const slug = formData.get("slug")?.toString();
    const content = formData.get("content")?.toString();

    const status = formData.get("status")?.toString() || "draft";
    const excerpt = formData.get("excerpt")?.toString();
    const publishedAtStr = formData.get("publishedAt")?.toString();
    const publishedAt = publishedAtStr ? new Date(publishedAtStr) : (status === 'published' ? new Date() : null);
    const tagsInput = formData.get("tags")?.toString();

    if (!title || !slug || !content) {
        return new Response("Missing required fields", { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);

    try {
        const result = await db.insert(posts).values({
            title,
            slug,
            content,
            excerpt,
            status: status as "draft" | "published" | "scheduled",
            publishedAt,
        }).returning({ id: posts.id });

        const postId = result[0].id;

        if (tagsInput) {
            const tagNames = tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0);
            for (const tagName of tagNames) {
                // Check if tag exists
                let tag = await db.select().from(tags).where(eq(tags.name, tagName)).get();
                if (!tag) {
                    const newTags = await db.insert(tags).values({ name: tagName, slug: tagName }).returning();
                    tag = newTags[0];
                }
                // Link post to tag
                await db.insert(postsToTags).values({
                    postId: postId,
                    tagId: tag.id
                });
            }
        }

    } catch (e) {
        return new Response("Error creating post: " + (e as Error).message, { status: 500 });
    }

    return redirect("/admin/posts");
};
