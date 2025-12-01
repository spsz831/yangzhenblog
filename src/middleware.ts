import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, redirect } = context;

    // Protect /admin routes
    if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
        const session = cookies.get("admin_session");

        // TODO: Verify session against DB or JWT verification
        if (!session || !session.value) {
            return redirect("/admin/login");
        }
    }

    return next();
});
