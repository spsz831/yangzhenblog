export const postCategories = [
  { slug: "ai", name: "AI", pattern: /\bai\b|agent|gpt|claude|codex|deepseek|kimi|llm|copilot|人工智能|大模型|智能体|harness/i },
  { slug: "life", name: "生活", pattern: /生活|日常|个人成长|职场|就业|工作|宝宝|家庭|育儿|亲子|旅行|自驾|电影|碎片时间|等待/ },
  { slug: "finance", name: "理财", pattern: /理财|投资|股票|证券|基金|etf|财务|财经|资产配置|财富/i },
  { slug: "learning", name: "学习", pattern: /学习|教程|指南|入门|路线图|保姆级|从零|安装|配置|手把手|怎么|如何|笔记|开发新手|上传指南|使用红线|终极/i },
  { slug: "bazi", name: "八字", pattern: /八字|命理|周易|易经|紫微斗数/ },
] as const;

export type PostCategorySlug = (typeof postCategories)[number]["slug"];

export function getPostCategorySlugs(
  post: { title: string; excerpt?: string | null },
  tagNames: string[],
): PostCategorySlug[] {
  const searchableText = `${post.title} ${post.excerpt ?? ""} ${tagNames.join(" ")}`;

  return postCategories
    .filter((category) => category.pattern.test(searchableText))
    .map((category) => category.slug);
}
