/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
    readonly DB: D1Database;
    readonly BUCKET: R2Bucket;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

type Runtime = import("@astrojs/cloudflare").Runtime<ImportMetaEnv>;

declare namespace App {
    interface Locals extends Runtime { }
}
