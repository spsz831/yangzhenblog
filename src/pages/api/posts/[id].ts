import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts, tags, postsToTags } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ request, locals, params, redirect }) => {
    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    const formData = await request.formData();
    const title = formData.get("title")?.toString();
    const slug = formData.get("slug")?.toString();
    const content = formData.get("content")?.toString();
    const excerpt = formData.get("excerpt")?.toString();
    const publishedAtStr = formData.get("publishedAt")?.toString();
    const status = formData.get("status")?.toString();
    const tagsInput = formData.get("tags")?.toString();

    // If publishedAt is provided in form, use it. 
    // Otherwise, if switching to published and no date exists, set to now.
    // If switching to scheduled, ensure we have a date (though frontend validation should catch this).

    if (!title || !slug || !content || !status) {
        return new Response("Missing required fields", { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);

    try {
        const existingPost = await db.select().from(posts).where(eq(posts.id, Number(id))).get();

        let publishedAt = existingPost?.publishedAt;

        if (publishedAtStr) {
            publishedAt = new Date(publishedAtStr);
        } else if (status === 'published' && !publishedAt) {
            publishedAt = new Date();
        }

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

        if (tagsInput !== undefined) {
            // Delete existing tags
            await db.delete(postsToTags).where(eq(postsToTags.postId, Number(id)));

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
                    postId: Number(id),
                    tagId: tag.id
                });
            }
        }

    } catch (e) {
        return new Response("Error updating post: " + (e as Error).message, { status: 500 });
    }

    return redirect("/admin/posts");
};
