import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const POST: APIRoute = async ({ params, locals, request }) => {
    const { id } = params;
    if (!id) {
        return new Response(JSON.stringify({ error: "Post ID is required" }), { status: 400 });
    }

    const postId = parseInt(id);
    if (isNaN(postId)) {
        return new Response(JSON.stringify({ error: "Invalid Post ID" }), { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);

    try {
        // Increment likes
        const result = await db.update(posts)
            .set({
                likes: sql`${posts.likes} + 1`
            })
            .where(eq(posts.id, postId))
            .returning({ likes: posts.likes })
            .get();

        if (!result) {
            return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
        }

        return new Response(JSON.stringify({ likes: result.likes }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("Error liking post:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
