/// <reference types="@cloudflare/workers-types" />
import type { APIRoute } from "astro";

const cacheControl = "public, max-age=31536000, immutable";
type MediaLocals = { runtime: { env: { BUCKET: R2Bucket } } };

function getByteRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size <= 0) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    const length = Math.min(suffixLength, size);
    return { offset: size - length, length };
  }

  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(requestedEnd) || offset >= size || requestedEnd < offset) {
    return null;
  }

  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

export const HEAD: APIRoute = async ({ params, locals }) => {
  const key = params.key;
  if (!key) return new Response("Missing key", { status: 400 });

  const object = await (locals as unknown as MediaLocals).runtime.env.BUCKET.head(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("content-length", String(object.size));
  headers.set("cache-control", cacheControl);
  return new Response(null, { headers });
};

export const GET: APIRoute = async ({ params, request, locals }) => {
  const key = params.key;
  if (!key) return new Response("Missing key", { status: 400 });

  const bucket = (locals as unknown as MediaLocals).runtime.env.BUCKET;
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const metadata = await bucket.head(key);
    if (!metadata) return new Response("Not found", { status: 404 });

    const range = getByteRange(rangeHeader, metadata.size);
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${metadata.size}`, "accept-ranges": "bytes" },
      });
    }

    const object = await bucket.get(key, { range });
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");
    headers.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
    headers.set("content-length", String(range.length));
    headers.set("cache-control", cacheControl);
    return new Response(object.body, { status: 206, headers });
  }

  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("content-length", String(object.size));
  headers.set("cache-control", cacheControl);
  return new Response(object.body, { headers });
};
