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
export const posts = sqliteTable("posts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    status: text("status", { enum: ["draft", "published", "scheduled"] }).default("draft").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
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
