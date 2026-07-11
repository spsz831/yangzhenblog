import type { APIContext } from "astro";
import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { posts, tags, postsToTags } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth";

type PostStatus = "draft" | "published" | "scheduled";

export type PostFormValues = {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    coverImage: string;
    status: PostStatus;
    publishedAt: Date | null;
    tags: Array<{ name: string; slug: string }>;
};

export class PostFormError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = "PostFormError";
    }
}

type RuntimeLocals = Pick<APIContext["locals"], "runtime">;
type PostContext = Pick<APIContext, "request"> & { locals: RuntimeLocals };
type AuthContext = Pick<APIContext, "cookies" | "locals" | "redirect">;

export const requireAdminSession = async (context: AuthContext) => {
    const auth = await requireAuthenticatedUser(context);
    return auth.response;
};

const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

const stripMarkdown = (value: string) =>
    value
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_~>-]/g, " ")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const truncateText = (value: string, maxLength: number) =>
    value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trim()}…`;

const generateExcerpt = (content: string) => truncateText(stripMarkdown(content), 140);

const isLikelyUrl = (value: string) => {
    if (!value) return true;

    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

const slugifyLabel = (value: string) => {
    const slug = value
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug || value.trim();
};

const parsePublishedAt = (publishedAtStr: string | undefined, status: PostStatus) => {
    if (!publishedAtStr) {
        if (status === "published") return new Date();
        if (status === "scheduled") {
            throw new PostFormError("missing_published_at", "定时发布必须填写发布时间。");
        }

        return null;
    }

    const publishedAt = new Date(publishedAtStr);
    if (Number.isNaN(publishedAt.getTime())) {
        throw new PostFormError("invalid_published_at", "发布时间格式无效。");
    }

    if (status === "scheduled" && publishedAt.getTime() <= Date.now()) {
        throw new PostFormError("scheduled_in_past", "定时发布时间必须晚于当前时间。");
    }

    return publishedAt;
};

export const parsePostForm = async (
    context: PostContext,
    options?: { postId?: number }
): Promise<PostFormValues> => {
    const formData = await context.request.formData();
    const title = normalizeWhitespace(formData.get("title")?.toString() ?? "");
    const slug = normalizeWhitespace(formData.get("slug")?.toString() ?? "");
    const content = formData.get("content")?.toString().trim() ?? "";
    const excerptInput = formData.get("excerpt")?.toString().trim() ?? "";
    const metaTitleInput = normalizeWhitespace(formData.get("metaTitle")?.toString() ?? "");
    const metaDescriptionInput = formData.get("metaDescription")?.toString().trim() ?? "";
    const coverImage = formData.get("coverImage")?.toString().trim() ?? "";
    const rawStatus = formData.get("status")?.toString() ?? "draft";
    const tagsInput = formData.get("tags")?.toString() ?? "";

    if (!title || !slug || !content) {
        throw new PostFormError("missing_fields", "标题、Slug 和正文不能为空。");
    }

    if (!["draft", "published", "scheduled"].includes(rawStatus)) {
        throw new PostFormError("invalid_status", "文章状态无效。");
    }

    if (!isLikelyUrl(coverImage)) {
        throw new PostFormError("invalid_cover_image", "封面图必须是有效的 http/https 地址。");
    }

    const status = rawStatus as PostStatus;
    const publishedAt = parsePublishedAt(formData.get("publishedAt")?.toString(), status);
    const excerpt = excerptInput || generateExcerpt(content);
    const metaTitle = metaTitleInput || title;
    const metaDescription = metaDescriptionInput || excerpt;

    if (!excerpt) {
        throw new PostFormError("missing_excerpt", "摘要为空，请补充正文或手动填写摘要。");
    }

    if (metaTitle.length > 70) {
        throw new PostFormError("meta_title_too_long", "SEO 标题建议不超过 70 个字符。");
    }

    if (metaDescription.length > 180) {
        throw new PostFormError("meta_description_too_long", "SEO 描述建议不超过 180 个字符。");
    }

    const tagMap = new Map<string, { name: string; slug: string }>();
    for (const rawTag of tagsInput.split(",")) {
        const name = normalizeWhitespace(rawTag);
        if (!name) continue;

        const tagSlug = slugifyLabel(name);
        if (!tagMap.has(tagSlug)) {
            tagMap.set(tagSlug, { name, slug: tagSlug });
        }
    }

    const db = getDb(context.locals.runtime.env.DB);
    const slugConflict = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
            options?.postId
                ? and(eq(posts.slug, slug), ne(posts.id, options.postId))
                : eq(posts.slug, slug)
        )
        .get();

    if (slugConflict) {
        throw new PostFormError("duplicate_slug", `Slug "${slug}" 已存在。`);
    }

    return {
        title,
        slug,
        content,
        excerpt,
        metaTitle,
        metaDescription,
        coverImage,
        status,
        publishedAt,
        tags: Array.from(tagMap.values()),
    };
};

export const findNextNumericSlug = async (
    context: Pick<APIContext, "locals">,
    options?: { excludePostId?: number }
) => {
    const db = getDb(context.locals.runtime.env.DB);
    const allPosts = await db.select({ id: posts.id, slug: posts.slug }).from(posts).all();

    const numericSlugs = allPosts
        .filter((post) => !options?.excludePostId || post.id !== options.excludePostId)
        .map((post) => post.slug)
        .filter((slug) => /^\d+$/.test(slug))
        .map((slug) => Number.parseInt(slug, 10));

    const maxNumericSlug = numericSlugs.length > 0 ? Math.max(...numericSlugs) : 0;
    return String(maxNumericSlug + 1).padStart(4, "0");
};

export const syncPostTags = async (
    context: Pick<APIContext, "locals">,
    postId: number,
    normalizedTags: Array<{ name: string; slug: string }>
) => {
    const db = getDb(context.locals.runtime.env.DB);
    await db.delete(postsToTags).where(eq(postsToTags.postId, postId));

    for (const normalizedTag of normalizedTags) {
        let tag = await db.select().from(tags).where(eq(tags.slug, normalizedTag.slug)).get();

        if (!tag) {
            const createdTags = await db
                .insert(tags)
                .values(normalizedTag)
                .returning();
            tag = createdTags[0];
        }

        await db.insert(postsToTags).values({
            postId,
            tagId: tag.id,
        });
    }
};
