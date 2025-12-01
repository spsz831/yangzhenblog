import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST: APIRoute = async ({ locals, params, redirect }) => {
    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    const db = getDb(locals.runtime.env.DB);

    try {
        await db.delete(posts).where(eq(posts.id, Number(id)));
    } catch (e) {
        return new Response("Error deleting post: " + (e as Error).message, { status: 500 });
    }

    return redirect("/admin/posts");
};
