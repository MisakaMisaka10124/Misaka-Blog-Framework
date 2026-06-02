/** 文章元数据 */
export interface PostMeta {
  slug: string;           // md 文件名（不含扩展名）
  title: string;          // 文章标题（从 frontmatter 或首行 H1 提取）
  summary: string;        // 简介（从 frontmatter 或正文前 200 字提取）
  cover: string;          // 封面图片路径
  tags: string[];         // 标签列表
  date: string;           // 发布日期
  wordCount: number;      // 字数
  readTime: string;       // 阅读时间
}

/** 全局文章索引 */
export interface PostIndex {
  posts: PostMeta[];
  lastUpdated: string;
}

/** 标签索引 */
export interface TagIndex {
  tag: string;
  posts: string[];        // 属于此标签的文章 slug 列表
}
