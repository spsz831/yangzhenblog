import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createUserSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return redirect("/admin/login?error=missing_fields");
    }

    const db = getDb(locals.runtime.env.DB);
    const user = await db.select().from(users).where(or(eq(users.email, email), eq(users.username, email))).get();

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        await createUserSession({ cookies, locals }, user.id);
        return redirect("/admin");
    }

    return redirect("/admin/login?error=invalid_credentials");
};
