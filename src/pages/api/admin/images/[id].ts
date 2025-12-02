import type { APIRoute } from "astro";

export const DELETE: APIRoute = async ({ params, locals }) => {
    const bucket = locals.runtime.env.BUCKET;
    const key = params.id;

    if (!key) {
        return new Response("Missing key", { status: 400 });
    }

    await bucket.delete(key);

    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
    });
};
