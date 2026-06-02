import { Router } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { buildIndex, readIndex, addOrUpdatePost, removePost } from '../services/post_index';
import { syncTagsForPost } from '../services/tag';
import { generateSlug } from '../utils/slug';

const router = Router();
const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 图片目录正则
const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

// 配置 Multer 存储（图片按 slug 分目录）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (IMAGE_RE.test(file.originalname)) {
      // 图片临时存到 images/_temp/，后续移动到 slug 目录
      const dir = path.join(__dirname, '../data/posts/images/_temp');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } else {
      const dir = path.join(__dirname, '../', getConfig().paths.posts_dir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    }
  },
  filename: (req, file, cb) => {
    const name = IMAGE_RE.test(file.originalname)
      ? `${Date.now()}-${file.originalname}`
      : file.originalname;
    cb(null, name);
  }
});
const upload = multer({ storage });

/** 将图片从临时目录移动到 slug 目录 */
function moveImageToSlugDir(tempPath: string, slug: string, filename: string): string {
  const slugDir = path.join(__dirname, '../data/posts/images', slug);
  if (!fs.existsSync(slugDir)) fs.mkdirSync(slugDir, { recursive: true });
  const destPath = path.join(slugDir, filename);
  fs.renameSync(tempPath, destPath);
  return `/images/posts/${slug}/${filename}`;
}

// JWT 校验中间件
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未提供令牌' });

  try {
    req.user = jwt.verify(token, getConfig().jwt.secret);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
};

/**
 * @openapi
 * /api/posts/upload:
 *   post:
 *     tags: [Posts]
 *     summary: 上传 Markdown 文章及封面图片
 *     description: 上传 .md 文件和可选的封面图片，自动更新文章索引和标签索引
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

  // 将 md 文件重命名为 slug.md
  const postsDir = path.join(__dirname, '../', getConfig().paths.posts_dir);
  const newMdPath = path.join(postsDir, `${slug}.md`);
  fs.renameSync(mdFile.path, newMdPath);

  // 将封面图移动到 slug 目录
  let coverUrl: string | null = null;
  if (coverFile) {
    coverUrl = moveImageToSlugDir(coverFile.path, slug, coverFile.filename);
  }

  // 将 _temp 目录中的图片移动到 slug 目录
  const tempDir = path.join(__dirname, '../data/posts/images/_temp');
  if (fs.existsSync(tempDir)) {
    const tempFiles = fs.readdirSync(tempDir);
    for (const f of tempFiles) {
      const tempPath = path.join(tempDir, f);
      if (fs.statSync(tempPath).isFile()) {
        moveImageToSlugDir(tempPath, slug, f);
      }
    }
    // 清理空的 _temp 目录
    try { fs.rmdirSync(tempDir); } catch {}
  }

  // 处理标签
  const tagsStr = req.body.tags || '';
  const tags = tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);

  // 更新文章索引
  const meta = addOrUpdatePost(slug);

  // 更新封面路径
  if (coverUrl && meta) {
    meta.cover = coverUrl;
    addOrUpdatePost(slug);
  }

  // 同步标签索引
  syncTagsForPost(slug, tags, []);

  res.json({
    message: '文件上传成功',
    slug,
    cover: coverUrl,
    tags,
    meta
  });
});

/**
 * @openapi
 * /api/posts/upload-image:
 *   post:
 *     tags: [Posts]
 *     summary: 上传文章内图片
 *     description: 上传单张图片，返回可访问的 URL
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
 *     responses:
 *       200:
 *         description: 上传成功，返回图片 URL
 *       401:
 *         description: 无权访问
 */
router.post('/upload-image', verifyToken, upload.single('image'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: '没有图片文件' });
  const slug = req.body.slug || '_temp';
  const url = moveImageToSlugDir(req.file.path, slug, req.file.filename);
  res.json({ url, filename: req.file.filename });
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
router.get('/search', (req, res) => {
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
router.get('/index', (req, res) => {
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
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const postsDir = path.join(__dirname, '../', getConfig().paths.posts_dir);
  const filePath = path.join(postsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文章不存在' });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const index = readIndex();
  const meta = index.posts.find(p => p.slug === slug);

  res.json({ slug, content, meta });
});

/**
 * @openapi
 * /api/posts/{slug}:
 *   delete:
 *     tags: [Posts]
 *     summary: 删除文章
 *     description: 删除指定文章并清理索引
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

  // 先获取文章的标签，以便清理标签索引
  const index = readIndex();
  const meta = index.posts.find(p => p.slug === slug);
  if (meta) {
    syncTagsForPost(slug, [], meta.tags); // 移除所有标签关联
  }

  const removed = removePost(slug);
  if (!removed) {
    return res.status(404).json({ error: '文章不存在' });
  }

  res.json({ message: '文章删除成功', slug });
});

/**
 * @openapi
 * /api/posts/{slug}:
 *   put:
 *     tags: [Posts]
 *     summary: 更新文章内容
 *     description: 更新指定文章的 Markdown 内容，重新提取元数据
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: 完整的 Markdown 内容（含 frontmatter）
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 文章不存在
 */
router.put('/:slug', verifyToken, (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: '内容不能为空' });

  const postsDir = path.join(__dirname, '../', getConfig().paths.posts_dir);
  const filePath = path.join(postsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文章不存在' });
  }

  // 读取旧标签
  const index = readIndex();
  const oldPost = index.posts.find(p => p.slug === slug);
  const oldTags = oldPost?.tags || [];

  fs.writeFileSync(filePath, content, 'utf-8');
  const meta = addOrUpdatePost(slug);

  // 同步标签
  if (meta) {
    syncTagsForPost(slug, meta.tags, oldTags);
  }

  res.json({ message: '更新成功', slug, meta });
});

export default router;
