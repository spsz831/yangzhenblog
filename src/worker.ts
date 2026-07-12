import { App } from "astro/app";
import type { SSRManifest } from "astro";
import { handle } from "@astrojs/cloudflare/handler";

import { publishDueScheduledPostsByBinding } from "@/lib/publishing";

type WorkerEnv = {
    DB: D1Database;
    ASSETS: {
        fetch: (request: Request | string) => Promise<Response>;
    };
};

export function createExports(manifest: SSRManifest) {
    const app = new App(manifest);

    return {
        default: {
            fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
                return handle(manifest, app, request, env, ctx);
            },
            async scheduled(controller: ScheduledController, env: WorkerEnv, ctx: ExecutionContext) {
                ctx.waitUntil(
                    (async () => {
                        const result = await publishDueScheduledPostsByBinding(
                            env.DB,
                            new Date(controller.scheduledTime)
                        );

                        console.log(
                            `[scheduled-publish] cron=${controller.cron} published=${result.publishedCount} slugs=${result.slugs.join(",")}`
                        );
                    })()
                );
            },
        } satisfies ExportedHandler<WorkerEnv>,
    };
}
