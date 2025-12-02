import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return redirect("/admin/login?error=missing_fields");
    }

    const db = getDb(locals.runtime.env.DB);
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        // Store userId in cookie (in a real app, use a signed token or session ID)
        cookies.set("admin_session", user.id.toString(), {
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            maxAge: 60 * 60 * 24, // 1 day
        });
        return redirect("/admin");
    }

    return redirect("/admin/login?error=invalid_credentials");
};
