import { defineMiddleware } from "astro:middleware";
import { getAuthenticatedUser } from "@/lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;

    // Protect /admin routes
    if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
        const user = await getAuthenticatedUser({ cookies, locals: context.locals });
        if (!user) {
            return redirect("/admin/login");
        }

        context.locals.currentUser = user;
    }

    return next();
});
