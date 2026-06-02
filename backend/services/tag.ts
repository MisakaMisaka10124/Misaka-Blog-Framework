import fs from 'fs';
import path from 'path';
import type { TagIndex } from '../types';

const TAGS_DIR = () => path.join(__dirname, '../data/config/tags');

/** 确保标签目录存在 */
function ensureTagsDir() {
  const dir = TAGS_DIR();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** 获取标签文件路径 */
function tagFilePath(tag: string): string {
  // 将标签名中的特殊字符替换为下划线，确保文件名安全
  const safeName = tag.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_');
  return path.join(TAGS_DIR(), `${safeName}.json`);
}

/** 读取标签索引（不存在则返回空） */
function readTagIndex(tag: string): TagIndex {
  const filePath = tagFilePath(tag);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return { tag, posts: [] };
}

/** 写入标签索引 */
function writeTagIndex(index: TagIndex) {
  ensureTagsDir();
  fs.writeFileSync(tagFilePath(index.tag), JSON.stringify(index, null, 2), 'utf-8');
}

/** 将文章添加到标签 */
export function addTagToPost(tag: string, slug: string) {
  const index = readTagIndex(tag);
  if (!index.posts.includes(slug)) {
    index.posts.push(slug);
    writeTagIndex(index);
  }
}

/** 从标签中移除文章 */
export function removeTagFromPost(tag: string, slug: string) {
  const index = readTagIndex(tag);
  const before = index.posts.length;
  index.posts = index.posts.filter(s => s !== slug);
  if (index.posts.length < before) {
    if (index.posts.length === 0) {
      // 删除空标签文件
      const filePath = tagFilePath(tag);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else {
      writeTagIndex(index);
    }
  }
}

/** 同步文章的标签（对比新旧标签，增删索引） */
export function syncTagsForPost(slug: string, newTags: string[], oldTags: string[] = []) {
  const added = newTags.filter(t => !oldTags.includes(t));
  const removed = oldTags.filter(t => !newTags.includes(t));

  added.forEach(tag => addTagToPost(tag, slug));
  removed.forEach(tag => removeTagFromPost(tag, slug));
}

/** 获取所有标签及其文章数量 */
export function getAllTags(): Array<{ tag: string; count: number }> {
  ensureTagsDir();
  const dir = TAGS_DIR();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  return files.map(file => {
    const index: TagIndex = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    return { tag: index.tag, count: index.posts.length };
  }).sort((a, b) => b.count - a.count);
}

/** 获取某标签下的文章 slug 列表 */
export function getPostsByTag(tag: string): string[] {
  return readTagIndex(tag).posts;
}

/** 从文章索引重建全部标签（启动时调用） */
export function syncAllTags(posts: Array<{ slug: string; tags: string[] }>) {
  ensureTagsDir();
  const dir = TAGS_DIR();
  // 清空旧的标签文件
  const oldFiles = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  oldFiles.forEach(f => fs.unlinkSync(path.join(dir, f)));

  // 重建
  const tagMap = new Map<string, string[]>();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(post.slug);
    }
  }
  for (const [tag, slugs] of tagMap) {
    writeTagIndex({ tag, posts: slugs });
  }
}
