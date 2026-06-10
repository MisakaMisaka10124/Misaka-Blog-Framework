import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { buildIndex, readIndex, addOrUpdatePost, removePost, getMonthDir, getMonthDirFromSlug } from '../services/post_index';
import { syncTagsForPost } from '../services/tag';
import { updatePostStats, updateTagStats } from '../services/site_stats';
import { generateSlug } from '../utils/slug';
import { verifyToken } from '../middleware/auth';
import { createDataLimiter } from '../utils/rate_limit';

const dataLimiter = createDataLimiter();

const router = Router();
const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 图片目录正则
const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

// 配置 Multer 存储（图片按 slug 分目录）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (IMAGE_RE.test(file.originalname)) {
      const dir = path.join(__dirname, '../data/posts/images/_temp');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } else {
      // md 文件存到当前月份目录
      const monthDir = getMonthDir(new Date().toISOString());
      const dir = path.join(__dirname, '../data/posts', monthDir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    }
  },
  filename: (req, file, cb) => {
    // 空格替换为连字符，避免 markdown 解析截断 URL
    const sanitized = file.originalname.replace(/\s+/g, '-');
    const name = IMAGE_RE.test(file.originalname)
      ? `${Date.now()}-${sanitized}`
      : sanitized;
    cb(null, name);
  }
});
const upload = multer({ storage, defParamCharset: 'utf8' });

/** 将图片从临时目录移动到 slug 目录 */
function moveImageToSlugDir(tempPath: string, slug: string, filename: string, monthDir?: string): string {
  const month = monthDir || getMonthDir(new Date().toISOString());
  const slugDir = path.join(__dirname, '../data/posts', month, 'images', slug);
  if (!fs.existsSync(slugDir)) fs.mkdirSync(slugDir, { recursive: true });
  const destPath = path.join(slugDir, filename);
  fs.renameSync(tempPath, destPath);
  return `/images/posts/${month}/images/${slug}/${filename}`;
}

/** 删除 slug 对应的图片目录 */
function removeImageDir(slug: string, monthDir: string) {
  const slugDir = path.join(__dirname, '../data/posts', monthDir, 'images', slug);
  if (fs.existsSync(slugDir)) {
    fs.rmSync(slugDir, { recursive: true, force: true });
  }
}

/** 读取 md 文件并写入/更新 frontmatter 字段 */
function writeFrontmatterField(slug: string, field: string, value: string, monthDir?: string) {
  const month = monthDir || getMonthDirFromSlug(slug);
  const postsDir = path.join(__dirname, '../data/posts', month);
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (fmMatch) {
    const fmBody = fmMatch[1];
    const rest = content.slice(fmMatch[0].length);
    const lines = fmBody.split('\n');
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${field}:`)) {
        lines[i] = `${field}: ${value}`;
        found = true;
        break;
      }
    }
    if (!found) lines.push(`${field}: ${value}`);
    content = `---\n${lines.join('\n')}\n---\n${rest}`;
  } else {
    content = `---\n${field}: ${value}\n---\n${content}`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}


/**
 * @openapi
 * /api/posts/upload:
 *   post:
 *     tags: [Posts]
 *     summary: 上传 Markdown 文章及封面图片
 *     description: 上传 .md 文件和可选的封面图片，自动生成 slug，更新索引和标签
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Markdown 文件
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: 封面图片（可选）
 *               tags:
 *                 type: string
 *                 description: 标签列表，逗号分隔
 *     responses:
 *       200:
 *         description: 上传成功
 *       400:
 *         description: 没有文件上传
 *       401:
 *         description: 无权访问
 */
router.post('/upload', verifyToken, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), (req: any, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (!files?.file?.[0]) return res.status(400).json({ error: '没有 Markdown 文件上传' });

  const mdFile = files.file[0];
  const coverFile = files.cover?.[0];

  // 自动生成哈希 slug
  const slug = generateSlug(mdFile.originalname);
  const monthDir = getMonthDir(new Date().toISOString());

  // 将 md 文件重命名为 slug.md（Multer 已存到月份目录）
  const postsDir = path.join(__dirname, '../data/posts', monthDir);
  const newMdPath = path.join(postsDir, `${slug}.md`);
  fs.renameSync(mdFile.path, newMdPath);

  // 将封面图移动到 slug 目录
  let coverUrl: string | null = null;
  if (coverFile) {
    coverUrl = moveImageToSlugDir(coverFile.path, slug, coverFile.filename, monthDir);
    // 写入 frontmatter
    writeFrontmatterField(slug, 'cover', coverUrl, monthDir);
  }

  // 将 _temp 目录中的图片移动到 slug 目录，并更新 md 中的 _temp URL
  const tempDir = path.join(__dirname, '../data/posts/images/_temp');
  let mdContent = fs.readFileSync(newMdPath, 'utf-8');
  if (fs.existsSync(tempDir)) {
    const tempFiles = fs.readdirSync(tempDir);
    for (const f of tempFiles) {
      const tempPath = path.join(tempDir, f);
      if (fs.statSync(tempPath).isFile()) {
        const newUrl = moveImageToSlugDir(tempPath, slug, f, monthDir);
        // 替换 md 内容中的 _temp URL 为真实 slug URL
        mdContent = mdContent.replace(`/images/posts/images/_temp/${f}`, newUrl);
      }
    }
    fs.writeFileSync(newMdPath, mdContent, 'utf-8');
    try { fs.rmdirSync(tempDir); } catch {}
  }

  // 处理标签（从表单和 frontmatter 两处获取，取并集）
  const tagsStr = req.body.tags || '';
  const formTags = tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);

  // 更新文章索引（在写入 cover 之后，这样索引能读到 cover）
  const meta = addOrUpdatePost(slug);

  // 同步标签索引（使用 frontmatter 中的标签，确保一致性）
  const metaTags = (meta?.tags || []).map(t => String(t));
  const allTags = [...new Set([...metaTags, ...formTags])];
  syncTagsForPost(slug, allTags, []);

  // 更新站点统计
  updatePostStats();
  updateTagStats();

  res.json({
    message: '文件上传成功',
    slug,
    cover: coverUrl,
    tags: allTags,
    meta
  });
});

/**
 * @openapi
 * /api/posts/upload-image:
 *   post:
 *     tags: [Posts]
 *     summary: 上传文章内图片
 *     description: 上传单张图片到指定 slug 目录，返回可访问的 URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               slug:
 *                 type: string
 *                 description: 文章 slug（图片存入对应目录）
 *     responses:
 *       200:
 *         description: 上传成功，返回图片 URL
 *       401:
 *         description: 无权访问
 */
router.post('/upload-image', verifyToken, upload.single('image'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: '没有图片文件' });
  const slug = req.body.slug || '_temp';
  if (slug === '_temp') {
    // _temp 图片保留在 Multer 的临时目录，不移动到月份子目录
    // URL 格式与 upload 路由中的 replace 目标一致
    const url = `/images/posts/images/_temp/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } else {
    // 有 slug 时，从索引获取月份目录并移动到 slug 目录
    const monthDir = getMonthDirFromSlug(slug);
    const url = moveImageToSlugDir(req.file.path, slug, req.file.filename, monthDir);
    res.json({ url, filename: req.file.filename });
  }
});

/**
 * @openapi
 * /api/posts/search:
 *   get:
 *     tags: [Posts]
 *     summary: 搜索文章
 *     description: 按关键字搜索文章标题和简介，或按标签筛选
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜索关键字（匹配标题和简介）
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: 按标签筛选
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/search', dataLimiter, (req, res) => {
  try {
    const { q, tag } = req.query;
    const index = readIndex();
    let results = index.posts;

    if (tag && typeof tag === 'string') {
      results = results.filter(p => p.tags.includes(tag));
    }

    if (q && typeof q === 'string') {
      const query = q.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    res.json({ posts: results, total: results.length });
  } catch (e) {
    res.status(500).json({ error: '搜索失败' });
  }
});

/**
 * @openapi
 * /api/posts/index:
 *   get:
 *     tags: [Posts]
 *     summary: 获取全局文章索引
 *     description: 返回所有文章的元数据列表
 *     responses:
 *       200:
 *         description: 成功获取索引
 */
router.get('/index', dataLimiter, (req, res) => {
  try {
    const index = readIndex();
    res.json(index);
  } catch (e) {
    res.status(500).json({ error: '索引读取失败' });
  }
});

/**
 * @openapi
 * /api/posts/reindex:
 *   post:
 *     tags: [Posts]
 *     summary: 重建全局文章索引
 *     description: 重新扫描所有 .md 文件并生成索引
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 重建成功
 */
router.post('/reindex', verifyToken, (req, res) => {
  try {
    const index = buildIndex();
    updatePostStats();
    updateTagStats();
    res.json({ message: '索引重建成功', count: index.posts.length, index });
  } catch (e) {
    res.status(500).json({ error: '索引重建失败' });
  }
});

/**
 * @openapi
 * /api/posts/{slug}:
 *   get:
 *     tags: [Posts]
 *     summary: 获取单篇文章
 *     description: 返回指定文章的 Markdown 原文和元数据
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取文章
 *       404:
 *         description: 文章不存在
 */
router.get('/:slug', dataLimiter, (req, res) => {
  const { slug } = req.params;

  // 从索引获取文章元数据和月份目录
  const index = readIndex();
  const meta = index.posts.find(p => p.slug === slug);

  if (!meta) {
    return res.status(404).json({ error: '文章不存在' });
  }

  let monthDir = getMonthDir(meta.date);
  const basePostsDir = path.join(__dirname, '../data/posts');
  let filePath = path.join(basePostsDir, monthDir, `${slug}.md`);

  // 按日期目录找不到时，扫描所有月份目录（兼容日期变更导致的路径不一致）
  if (!fs.existsSync(filePath)) {
    const entries = fs.readdirSync(basePostsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name)) {
        const candidate = path.join(basePostsDir, entry.name, `${slug}.md`);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
          monthDir = entry.name;
          break;
        }
      }
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文章不存在' });
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  // 将正文中的相对图片路径替换为完整 URL
  content = content.replace(/!\[([^\]]*)\]\((images\/[^)]+)\)/g, (match, alt, imgPath) => {
    return `![${alt}](/images/posts/${monthDir}/${imgPath})`;
  });
  res.json({ slug, content, meta });
});

/**
 * @openapi
 * /api/posts/{slug}:
 *   delete:
 *     tags: [Posts]
 *     summary: 删除文章
 *     description: 删除指定文章、图片目录并清理索引
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 文章不存在
 */
router.delete('/:slug', verifyToken, (req, res) => {
  const { slug } = req.params;

  // 先获取文章的标签和月份目录，以便清理标签索引和图片目录
  const index = readIndex();
  const meta = index.posts.find(p => p.slug === slug);
  if (meta) {
    syncTagsForPost(slug, [], meta.tags);
    // 删除图片目录（按日期目录找不到时扫描所有月份目录）
    let monthDir = getMonthDir(meta.date);
    const basePostsDir = path.join(__dirname, '../data/posts');
    const imgDir = path.join(basePostsDir, monthDir, 'images', slug);
    if (!fs.existsSync(imgDir)) {
      const entries = fs.readdirSync(basePostsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name)) {
          const candidate = path.join(basePostsDir, entry.name, 'images', slug);
          if (fs.existsSync(candidate)) {
            monthDir = entry.name;
            break;
          }
        }
      }
    }
    removeImageDir(slug, monthDir);
  }

  const removed = removePost(slug);
  if (!removed) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 更新站点统计
  updatePostStats();
  updateTagStats();

  res.json({ message: '文章删除成功', slug });
});

/**
 * @openapi
 * /api/posts/{slug}:
 *   put:
 *     tags: [Posts]
 *     summary: 更新文章
 *     description: 更新文章内容和可选的封面图片
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 完整的 Markdown 内容（含 frontmatter）
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: 新的封面图片（可选）
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 文章不存在
 */
router.put('/:slug', verifyToken, (req: any, res, next) => {
  // 只在有文件时使用 multer
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('cover')(req, res, next);
  } else {
    next();
  }
}, (req: any, res) => {
  const { slug } = req.params;
  const content = req.body.content;

  if (!content) return res.status(400).json({ error: '内容不能为空' });

  // 从索引获取文章的月份目录
  const index = readIndex();
  const oldPost = index.posts.find(p => p.slug === slug);

  if (!oldPost) {
    return res.status(404).json({ error: '文章不存在' });
  }

  let monthDir = getMonthDir(oldPost.date);
  const basePostsDir = path.join(__dirname, '../data/posts');
  let filePath = path.join(basePostsDir, monthDir, `${slug}.md`);

  // 按日期目录找不到时，扫描所有月份目录（兼容日期变更导致的路径不一致）
  if (!fs.existsSync(filePath)) {
    const entries = fs.readdirSync(basePostsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && /^\d{4}-\d{2}$/.test(entry.name)) {
        const candidate = path.join(basePostsDir, entry.name, `${slug}.md`);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
          monthDir = entry.name;
          break;
        }
      }
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 读取旧标签
  const oldTags = oldPost?.tags || [];

  // 写入新内容
  fs.writeFileSync(filePath, content, 'utf-8');

  // 如果上传了新封面，移动到 slug 目录并更新 frontmatter
  if (req.file) {
    const coverUrl = moveImageToSlugDir(req.file.path, slug, req.file.filename, monthDir);
    writeFrontmatterField(slug, 'cover', coverUrl, monthDir);
  }

  // 更新索引
  const meta = addOrUpdatePost(slug);

  // 同步标签（确保新旧标签对比正确）
  if (meta) {
    const newTags = meta.tags.map(t => String(t));
    const oldTagsStr = oldTags.map(t => String(t));
    syncTagsForPost(slug, newTags, oldTagsStr);
  }

  // 更新站点统计
  updatePostStats();
  updateTagStats();

  res.json({ message: '更新成功', slug, meta });
});

export default router;
