import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    nickname: text("nickname"),
    avatar: text("avatar"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const userSessions = sqliteTable("user_sessions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});
export const posts = sqliteTable("posts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    coverImage: text("cover_image"),
    status: text("status", { enum: ["draft", "published", "scheduled"] }).default("draft").notNull(),
    likes: integer("likes").default(0).notNull(),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const publishRuns = sqliteTable("publish_runs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    triggerType: text("trigger_type", { enum: ["cron", "manual", "request"] }).notNull(),
    triggerLabel: text("trigger_label"),
    publishedCount: integer("published_count").default(0).notNull(),
    publishedSlugs: text("published_slugs"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
});

export const tags = sqliteTable("tags", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
});

export const postsToCategories = sqliteTable("posts_to_categories", {
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: primaryKey({ columns: [t.postId, t.categoryId] }),
}));

export const postsToTags = sqliteTable("posts_to_tags", {
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
}));
