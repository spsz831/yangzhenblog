import type { APIRoute } from "astro";
import { deleteSessionByToken } from "@/lib/auth";

export const POST: APIRoute = async ({ cookies, redirect, locals }) => {
    await deleteSessionByToken({ cookies, locals });
    return redirect("/admin/login");
};
