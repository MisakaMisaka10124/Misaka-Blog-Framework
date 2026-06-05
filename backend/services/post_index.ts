import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PostMeta, PostIndex } from '../types';

const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const INDEX_PATH = () => path.join(__dirname, '../data/posts/post_index.json');
const POSTS_DIR = () => path.join(__dirname, '../', getConfig().paths.posts_dir);

/** 根据日期获取月份目录名 (YYYY-MM) */
export function getMonthDir(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** 根据 slug 从索引获取文章的月份目录 */
export function getMonthDirFromSlug(slug: string): string {
  const index = readIndex();
  const post = index.posts.find(p => p.slug === slug);
  if (!post) return getMonthDir(new Date().toISOString());
  return getMonthDir(post.date);
}

/** 从 Markdown 内容提取元数据 */
function extractMeta(filename: string, content: string, filePath?: string): PostMeta {
  const slug = filename.replace(/\.md$/, '');
  const { data: frontmatter, content: body } = matter(content);

  // 标题：优先 frontmatter，其次首行 H1，最后用 slug
  let title = String(frontmatter.title || '');
  if (!title) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    title = h1Match ? h1Match[1] : slug;
  }

  // 简介：优先 frontmatter，否则取正文前 200 字
  let summary = String(frontmatter.summary || frontmatter.description || '');
  if (!summary) {
    const plainText = body.replace(/[#*`>\-\[\]()!]/g, '').replace(/\n+/g, ' ').trim();
    summary = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }

  // 封面图：修正旧格式路径（缺少月份目录和 images/ 子目录）
  let cover = String(frontmatter.cover || frontmatter.image || '');
  if (cover && filePath) {
    // 从文件路径推断月份目录
    const monthMatch = filePath.match(/(\d{4}-\d{2})[/\\]/);
    const month = monthMatch ? monthMatch[1] : getMonthDir(new Date().toISOString());

    // 相对路径：images/{slug}/{filename} → /images/posts/{month}/images/{slug}/{filename}
    const relativeCoverMatch = cover.match(/^images\/([^/]+)\/([^/]+)$/);
    if (relativeCoverMatch) {
      cover = `/images/posts/${month}/images/${relativeCoverMatch[1]}/${relativeCoverMatch[2]}`;
    }

    // 修正旧格式：/images/posts/{slug}/{filename} → /images/posts/{month}/images/{slug}/{filename}
    const oldCoverMatch = cover.match(/^\/images\/posts\/([^/]+)\/([^/]+)$/);
    if (oldCoverMatch && !oldCoverMatch[1].match(/^\d{4}-\d{2}$/)) {
      cover = `/images/posts/${month}/images/${oldCoverMatch[1]}/${oldCoverMatch[2]}`;
    }
  }

  // 标签（确保始终为字符串数组）
  const rawTags = frontmatter.tags || frontmatter.categories || [];
  const tags: string[] = Array.isArray(rawTags) ? rawTags.map(t => String(t)) : [];

  // 日期
  const date = frontmatter.date
    ? new Date(frontmatter.date).toISOString().split('T')[0]
    : fs.statSync(filePath || path.join(POSTS_DIR(), filename)).mtime.toISOString().split('T')[0];

  // 字数与阅读时间
  const plainBody = body.replace(/[#*`>\-\[\]()!\n]/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainBody.length; // 中文按字符计数
  const readTime = `${Math.max(1, Math.ceil(wordCount / 500))} min`;

  return { slug, title, summary, cover, tags, date, wordCount, readTime };
}

/** 扫描所有月份子目录中的 .md 文件并提取元数据 */
export function scanPosts(): PostMeta[] {
  const postsDir = POSTS_DIR();
  if (!fs.existsSync(postsDir)) return [];

  const allPosts: Array<{ meta: PostMeta; mtime: number }> = [];

  // 扫描所有 YYYY-MM 格式的月份目录
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name)) {
      const monthDir = path.join(postsDir, entry.name);
      const files = fs.readdirSync(monthDir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(monthDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const meta = extractMeta(file, content, filePath);
        const mtime = fs.statSync(filePath).mtimeMs;
        allPosts.push({ meta, mtime });
      }
    }
  }

  // 按日期降序，同日期按文件修改时间降序（新的在前）
  return allPosts
    .sort((a, b) => {
      const dateDiff = b.meta.date.localeCompare(a.meta.date);
      return dateDiff !== 0 ? dateDiff : b.mtime - a.mtime;
    })
    .map(p => p.meta);
}

/** 构建全局索引并写入 JSON 文件 */
export function buildIndex(): PostIndex {
  const index: PostIndex = {
    posts: scanPosts(),
    lastUpdated: new Date().toISOString(),
  };

  const indexPath = INDEX_PATH();
  const dir = path.dirname(indexPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  return index;
}

/** 读取现有索引（不存在则构建） */
export function readIndex(): PostIndex {
  const indexPath = INDEX_PATH();
  if (fs.existsSync(indexPath)) {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  }
  return buildIndex();
}

/** 增量更新单篇文章的索引 */
export function addOrUpdatePost(slug: string): PostMeta | null {
  // 在所有月份目录中查找文章
  const postsDir = POSTS_DIR();
  let filePath = '';
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name)) {
      const candidate = path.join(postsDir, entry.name, `${slug}.md`);
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }
  }

  if (!filePath) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const meta = extractMeta(`${slug}.md`, content, filePath);

  const index = readIndex();
  const existing = index.posts.findIndex(p => p.slug === slug);
  if (existing >= 0) {
    index.posts[existing] = meta;
  } else {
    index.posts.push(meta);
  }

  // 按日期降序，同日期按文件修改时间降序
  const mtimes = new Map<string, number>();
  for (const p of index.posts) {
    const monthDir = getMonthDir(p.date);
    const fp = path.join(postsDir, monthDir, `${p.slug}.md`);
    mtimes.set(p.slug, fs.existsSync(fp) ? fs.statSync(fp).mtimeMs : 0);
  }
  index.posts.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    return dateDiff !== 0 ? dateDiff : (mtimes.get(b.slug) || 0) - (mtimes.get(a.slug) || 0);
  });

  index.lastUpdated = new Date().toISOString();

  fs.writeFileSync(INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');
  return meta;
}

/** 从索引中移除文章 */
export function removePost(slug: string): boolean {
  const index = readIndex();
  const post = index.posts.find(p => p.slug === slug);
  if (!post) return false;

  index.posts = index.posts.filter(p => p.slug !== slug);
  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');

  // 从正确的月份目录删除 md 文件
  const monthDir = getMonthDir(post.date);
  const filePath = path.join(POSTS_DIR(), monthDir, `${slug}.md`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return true;
}
