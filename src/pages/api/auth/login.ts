import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    // TODO: Replace with real DB verification using Argon2
    if (email === "admin@example.com" && password === "password") {
        cookies.set("admin_session", "valid_session_token", {
            path: "/",
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24, // 1 day
        });
        return redirect("/admin");
    }

    return redirect("/admin/login?error=invalid_credentials");
};
