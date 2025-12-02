import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
    const bucket = locals.runtime.env.BUCKET;
    const key = params.key;

    if (!key) {
        return new Response("Missing key", { status: 400 });
    }

    const object = await bucket.get(key);

    if (!object) {
        return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return new Response(object.body, {
        headers,
    });
};
