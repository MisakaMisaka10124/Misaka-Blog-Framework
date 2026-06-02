/** 文章元数据（与后端 PostMeta 对齐） */
export interface PostMeta {
  slug: string
  title: string
  summary: string
  cover: string
  tags: string[]
  date: string
  wordCount: number
  readTime: string
}

/** 全局文章索引 */
export interface PostIndex {
  posts: PostMeta[]
  lastUpdated: string
}

/** 导航链接 */
export interface NavLink {
  label: string
  path: string
}

/** 社交链接 */
export interface SocialLink {
  platform: string
  url: string
  icon: string
}

/** 友情链接 */
export interface FriendLink {
  name: string
  avatar: string
  desc: string
  url: string
}

/** 站点配置（从 /api/config 获取） */
export interface SiteConfig {
  siteTitle: string
  welcomeMessage: string
  chatPlaceholder?: string
  about?: string
  navLinks: NavLink[]
  socialLinks: SocialLink[]
  footer?: { copyright?: string; icp?: string }
  hero?: { subtitle?: string; backgroundImages?: string[] }
  friendLinks?: FriendLink[]
}

/** TOC 目录项 */
export interface TocItem {
  id: string
  text: string
  level: number
}
