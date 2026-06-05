import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PostMeta, PostIndex } from '../types';

const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const INDEX_PATH = () => path.join(__dirname, '../data/config/post_index.json');
const POSTS_DIR = () => path.join(__dirname, '../', getConfig().paths.posts_dir);

/** 从 Markdown 内容提取元数据 */
function extractMeta(filename: string, content: string): PostMeta {
  const slug = filename.replace(/\.md$/, '');
  const { data: frontmatter, content: body } = matter(content);

  // 标题：优先 frontmatter，其次首行 H1，最后用 slug
  let title = frontmatter.title || '';
  if (!title) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    title = h1Match ? h1Match[1] : slug;
  }

  // 简介：优先 frontmatter，否则取正文前 200 字
  let summary = frontmatter.summary || frontmatter.description || '';
  if (!summary) {
    const plainText = body.replace(/[#*`>\-\[\]()!]/g, '').replace(/\n+/g, ' ').trim();
    summary = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
  }

  // 封面图
  const cover = frontmatter.cover || frontmatter.image || '';

  // 标签
  const tags: string[] = frontmatter.tags || frontmatter.categories || [];

  // 日期
  const date = frontmatter.date
    ? new Date(frontmatter.date).toISOString().split('T')[0]
    : fs.statSync(path.join(POSTS_DIR(), filename)).mtime.toISOString().split('T')[0];

  // 字数与阅读时间
  const plainBody = body.replace(/[#*`>\-\[\]()!\n]/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainBody.length; // 中文按字符计数
  const readTime = `${Math.max(1, Math.ceil(wordCount / 500))} min`;

  return { slug, title, summary, cover, tags, date, wordCount, readTime };
}

/** 扫描所有 .md 文件并提取元数据 */
export function scanPosts(): PostMeta[] {
  const postsDir = POSTS_DIR();
  if (!fs.existsSync(postsDir)) return [];

  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  const posts = files.map(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const meta = extractMeta(file, content);
    const mtime = fs.statSync(filePath).mtimeMs;
    return { meta, mtime };
  });

  // 按日期降序，同日期按文件修改时间降序（新的在前）
  return posts
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
  const filePath = path.join(POSTS_DIR(), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const meta = extractMeta(`${slug}.md`, content);

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
    const fp = path.join(POSTS_DIR(), `${p.slug}.md`);
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
  const before = index.posts.length;
  index.posts = index.posts.filter(p => p.slug !== slug);
  if (index.posts.length === before) return false;

  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(INDEX_PATH(), JSON.stringify(index, null, 2), 'utf-8');

  // 删除 md 文件
  const filePath = path.join(POSTS_DIR(), `${slug}.md`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  return true;
}
