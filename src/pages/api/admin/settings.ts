import type { APIRoute } from "astro";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
    const session = cookies.get("admin_session");
    if (!session || !session.value) {
        return redirect("/admin/login");
    }
    const userId = parseInt(session.value);

    const formData = await request.formData();
    const action = formData.get("action");

    const db = getDb(locals.runtime.env.DB);

    if (action === "update_profile") {
        const nickname = formData.get("nickname")?.toString();
        const email = formData.get("email")?.toString();
        const avatar = formData.get("avatar")?.toString();

        if (!email) return redirect("/admin/settings?error=missing_fields");

        await db.update(users)
            .set({ nickname, email, avatar })
            .where(eq(users.id, userId));

        return redirect("/admin/settings?success=profile_updated");
    }

    if (action === "change_password") {
        const currentPassword = formData.get("current_password")?.toString();
        const newPassword = formData.get("new_password")?.toString();
        const confirmPassword = formData.get("confirm_password")?.toString();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return redirect("/admin/settings?error=missing_fields");
        }

        if (newPassword !== confirmPassword) {
            return redirect("/admin/settings?error=password_mismatch");
        }

        const user = await db.select().from(users).where(eq(users.id, userId)).get();
        if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
            return redirect("/admin/settings?error=wrong_password");
        }

        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(newPassword, salt);

        await db.update(users)
            .set({ passwordHash })
            .where(eq(users.id, userId));

        return redirect("/admin/settings?success=password_updated");
    }

    return redirect("/admin/settings");
};
