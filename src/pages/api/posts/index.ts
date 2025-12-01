import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts } from "@/db/schema";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
    const formData = await request.formData();
    const title = formData.get("title")?.toString();
    const slug = formData.get("slug")?.toString();
    const content = formData.get("content")?.toString();

    if (!title || !slug || !content) {
        return new Response("Missing required fields", { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);

    try {
        await db.insert(posts).values({
            title,
            slug,
            content,
            status: "draft",
        });
    } catch (e) {
        return new Response("Error creating post: " + (e as Error).message, { status: 500 });
    }

    return redirect("/admin/posts");
};
