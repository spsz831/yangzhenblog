import type { APIRoute } from "astro";

import { requireAdminSession } from "@/lib/admin-posts";
import { publishDueScheduledPostsByBinding } from "@/lib/publishing";

export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
    const authRedirect = await requireAdminSession({ cookies, locals, redirect });
    if (authRedirect) {
        return authRedirect;
    }

    const result = await publishDueScheduledPostsByBinding(
        locals.runtime.env.DB,
        new Date(),
        {
            triggerType: "manual",
            triggerLabel: "admin-dashboard",
        }
    );

    return redirect(`/admin?success=publishing_run&count=${result.publishedCount}`);
};
