export const postCategories = [
  { slug: "ai", name: "AI" },
  { slug: "life", name: "生活" },
  { slug: "finance", name: "理财" },
  { slug: "learning", name: "学习" },
  { slug: "bazi", name: "八字" },
] as const;

export type PostCategorySlug = (typeof postCategories)[number]["slug"];

const suggestionRules: Array<{ slug: PostCategorySlug; pattern: RegExp }> = [
  { slug: "bazi", pattern: /八字|命理|周易|易经|紫微斗数/i },
  { slug: "finance", pattern: /理财|投资|股票|证券|基金|\betf\b|财经|资产配置|财富/i },
  { slug: "life", pattern: /生活|日常|宝宝|家庭|育儿|亲子|旅行|自驾|电影|碎片时间|等待/i },
  { slug: "learning", pattern: /教程|指南|入门|路线图|保姆级|从零|安装|配置|手把手|怎么|如何|使用红线|终极/i },
  { slug: "ai", pattern: /\bai\b|agent|gpt|claude|codex|deepseek|kimi|llm|copilot|人工智能|大模型|智能体|harness/i },
];

/** Legacy posts use a conservative suggestion until their primary category is set in the editor. */
export function getSuggestedPostCategorySlug(
  post: { title: string },
  tagNames: string[],
): PostCategorySlug | null {
  const searchableText = `${post.title} ${tagNames.join(" ")}`;
  return suggestionRules.find((rule) => rule.pattern.test(searchableText))?.slug ?? null;
}

export function isPostCategorySlug(value: string): value is PostCategorySlug {
  return postCategories.some((category) => category.slug === value);
}
