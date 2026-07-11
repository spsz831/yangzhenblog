import type { APIContext, AstroCookies } from "astro";
import { and, eq, gt } from "drizzle-orm";

import { getDb } from "@/db";
import { userSessions, users } from "@/db/schema";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type RuntimeLocals = Pick<APIContext["locals"], "runtime">;
type AuthCookieContext = {
    cookies: AstroCookies;
    locals: RuntimeLocals;
};

type SetCookieContext = {
    cookies: AstroCookies;
};

const toHex = (buffer: ArrayBuffer) =>
    Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

const hashToken = async (token: string) => {
    const encoded = new TextEncoder().encode(token);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return toHex(digest);
};

const generateSessionToken = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return `${crypto.randomUUID()}-${toHex(randomBytes.buffer)}`;
};

export const setSessionCookie = ({ cookies }: SetCookieContext, token: string) => {
    cookies.set(SESSION_COOKIE_NAME, token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
};

export const clearSessionCookie = ({ cookies }: SetCookieContext) => {
    cookies.delete(SESSION_COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
    });
};

export const createUserSession = async (
    context: AuthCookieContext,
    userId: number
) => {
    const db = getDb(context.locals.runtime.env.DB);
    const token = generateSessionToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    await db.insert(userSessions).values({
        userId,
        tokenHash,
        expiresAt,
        lastUsedAt: new Date(),
    });

    setSessionCookie(context, token);
};

export const deleteSessionByToken = async (context: AuthCookieContext) => {
    const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
        clearSessionCookie(context);
        return;
    }

    const db = getDb(context.locals.runtime.env.DB);
    const tokenHash = await hashToken(token);
    await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
    clearSessionCookie(context);
};

export const deleteAllUserSessions = async (
    context: Pick<APIContext, "locals">,
    userId: number
) => {
    const db = getDb(context.locals.runtime.env.DB);
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
};

export const getAuthenticatedUser = async (context: AuthCookieContext) => {
    const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const db = getDb(context.locals.runtime.env.DB);
    const tokenHash = await hashToken(token);
    const now = new Date();

    const session = await db.select()
        .from(userSessions)
        .where(and(eq(userSessions.tokenHash, tokenHash), gt(userSessions.expiresAt, now)))
        .get();

    if (!session) {
        clearSessionCookie(context);
        return null;
    }

    await db.update(userSessions)
        .set({ lastUsedAt: now })
        .where(eq(userSessions.id, session.id));

    const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user) {
        await db.delete(userSessions).where(eq(userSessions.id, session.id));
        clearSessionCookie(context);
        return null;
    }

    return user;
};

export const requireAuthenticatedUser = async (
    context: AuthCookieContext & { redirect: APIContext["redirect"] }
) => {
    const user = await getAuthenticatedUser(context);
    if (!user) {
        return { user: null, response: context.redirect("/admin/login") };
    }

    return { user, response: null };
};
