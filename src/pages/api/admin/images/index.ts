import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
    const bucket = locals.runtime.env.BUCKET;
    const list = await bucket.list();

    const images = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploadedAt: obj.uploaded,
        url: `/images/${obj.key}` // Serving via local proxy for now
    }));

    return new Response(JSON.stringify({ images }), {
        headers: { "Content-Type": "application/json" },
    });
};

export const POST: APIRoute = async ({ request, locals }) => {
    const bucket = locals.runtime.env.BUCKET;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return new Response("No file provided", { status: 400 });
    }

    // Backend size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
        return new Response("File too large (max 10MB)", { status: 400 });
    }

    const key = `${Date.now()}-${file.name}`;
    await bucket.put(key, file);

    return new Response(JSON.stringify({
        success: true,
        image: {
            key,
            size: file.size,
            uploadedAt: new Date(),
            url: `/images/${key}`
        }
    }), {
        headers: { "Content-Type": "application/json" },
    });
};
