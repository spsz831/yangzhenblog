import { defineMiddleware } from "astro:middleware";
import { getAuthenticatedUser } from "@/lib/auth";
import { publishDueScheduledPosts } from "@/lib/publishing";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;
    const isAdminRoute = url.pathname.startsWith("/admin");
    const isApiRoute = url.pathname.startsWith("/api");
    const isSafeReadMethod = context.request.method === "GET" || context.request.method === "HEAD";

    if (isSafeReadMethod && !isApiRoute) {
        await publishDueScheduledPosts(context);
    }

    // Protect /admin routes
    if (isAdminRoute && url.pathname !== "/admin/login") {
        const user = await getAuthenticatedUser({ cookies, locals: context.locals });
        if (!user) {
            return redirect("/admin/login");
        }

        context.locals.currentUser = user;
    }

    return next();
});
