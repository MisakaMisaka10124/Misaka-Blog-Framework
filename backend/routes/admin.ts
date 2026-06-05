import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../middleware/auth';

const router = Router();

// 所有 admin 路由都需要认证
router.use(verifyToken);

const configPath = path.join(__dirname, '../data/config/core_server_config.json');
const getConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// 图片目录正则
const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

// 配置 Multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.params.type || 'general';
    let dir: string;

    switch (uploadType) {
      case 'avatar':
        dir = path.join(__dirname, '../data/images/avatars');
        break;
      case 'friends':
        dir = path.join(__dirname, '../data/images/friends');
        break;
      case 'social':
        dir = path.join(__dirname, '../data/images/social');
        break;
      default:
        dir = path.join(__dirname, '../data/images/uploads');
    }

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (IMAGE_RE.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/** 获取语言配置文件路径 */
function getLangConfigPath(lang?: string): string {
  const language = lang || 'zh_cn';
  const configDir = path.join(__dirname, '../data/langrage');
  const configPath = path.join(configDir, `site_config_${language}.json`);

  if (fs.existsSync(configPath)) {
    return configPath;
  }

  // 回退到中文配置
  const fallbackPath = path.join(configDir, 'site_config_zh_cn.json');
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  // 如果都不存在，返回示例配置
  const examplePath = path.join(configDir, 'site_config_zh_cn.example.json');
  if (fs.existsSync(examplePath)) {
    // 复制示例配置
    const content = fs.readFileSync(examplePath, 'utf-8');
    fs.writeFileSync(fallbackPath, content, 'utf-8');
    return fallbackPath;
  }

  throw new Error('找不到配置文件');
}

/** 更新所有语言配置文件的指定字段 */
function updateAllLangConfigs(field: string, value: any): void {
  const configDir = path.join(__dirname, '../data/langrage');
  const files = fs.readdirSync(configDir).filter(f => f.startsWith('site_config_') && f.endsWith('.json') && !f.includes('example'));

  for (const file of files) {
    const filePath = path.join(configDir, file);
    try {
      const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      config[field] = value;
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
      console.warn(`Failed to update ${file}:`, e);
    }
  }
}

/**
 * @openapi
 * /api/admin/config:
 *   get:
 *     tags: [Admin]
 *     summary: 获取站点配置（用于编辑）
 *     description: 返回当前语言的完整站点配置
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 语言代码
 *     responses:
 *       200:
 *         description: 成功获取配置
 *       401:
 *         description: 未授权
 */
router.get('/config', (req, res) => {
  try {
    const lang = req.query.lang as string;
    const configPath = getLangConfigPath(lang);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: '配置读取失败' });
  }
});

/**
 * @openapi
 * /api/admin/config:
 *   put:
 *     tags: [Admin]
 *     summary: 更新站点配置
 *     description: 更新指定字段的站点配置，会同步更新所有语言文件
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: 要更新的字段名
 *               value:
 *                 description: 新的值
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.put('/config', (req, res) => {
  try {
    const { field, value } = req.body;

    if (!field) {
      return res.status(400).json({ error: '缺少字段名' });
    }

    // 允许更新的字段列表
    const allowedFields = [
      'siteTitle', 'welcomeMessage', 'chatPlaceholder', 'about',
      'navLinks', 'socialLinks', 'footer', 'hero', 'friendLinks'
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: '不允许更新该字段' });
    }

    // 社交媒体链接数量限制
    if (field === 'socialLinks' && Array.isArray(value) && value.length > 4) {
      return res.status(400).json({ error: '社交媒体链接最多4个' });
    }

    updateAllLangConfigs(field, value);
    res.json({ message: '配置更新成功', field, value });
  } catch (e) {
    res.status(500).json({ error: '配置更新失败' });
  }
});

/**
 * @openapi
 * /api/admin/config/batch:
 *   put:
 *     tags: [Admin]
 *     summary: 批量更新站点配置
 *     description: 一次更新多个字段的站点配置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: 要更新的字段和值
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未授权
 */
router.put('/config/batch', (req, res) => {
  try {
    const updates = req.body;

    const allowedFields = [
      'siteTitle', 'welcomeMessage', 'chatPlaceholder', 'about',
      'navLinks', 'socialLinks', 'footer', 'hero', 'friendLinks'
    ];

    // 验证所有字段
    for (const field of Object.keys(updates)) {
      if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: `不允许更新字段: ${field}` });
      }
    }

    // 社交媒体链接数量限制
    if (updates.socialLinks && Array.isArray(updates.socialLinks) && updates.socialLinks.length > 4) {
      return res.status(400).json({ error: '社交媒体链接最多4个' });
    }

    // 更新所有语言配置
    const configDir = path.join(__dirname, '../data/langrage');
    const files = fs.readdirSync(configDir).filter(f => f.startsWith('site_config_') && f.endsWith('.json') && !f.includes('example'));

    for (const file of files) {
      const filePath = path.join(configDir, file);
      try {
        const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        Object.assign(config, updates);
        fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
      } catch (e) {
        console.warn(`Failed to update ${file}:`, e);
      }
    }

    res.json({ message: '配置批量更新成功', updates });
  } catch (e) {
    res.status(500).json({ error: '配置更新失败' });
  }
});

/**
 * @openapi
 * /api/admin/upload/{type}:
 *   post:
 *     tags: [Admin]
 *     summary: 上传图片
 *     description: 上传图片到指定目录（avatar/friends/social）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [avatar, friends, social, general]
 *         description: 上传类型
 *     requestBody:
 *       required: true
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
 *         description: 上传成功，返回图片URL
 *       400:
 *         description: 没有文件或文件类型错误
 *       401:
 *         description: 未授权
 */
router.post('/upload/:type', upload.single('image'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const type = req.params.type;
    const filename = req.file.filename;

    // 根据类型生成访问URL
    let url: string;
    switch (type) {
      case 'avatar':
        url = `/images/avatars/${filename}`;
        break;
      case 'friends':
        url = `/images/friends/${filename}`;
        break;
      case 'social':
        url = `/images/social/${filename}`;
        break;
      default:
        url = `/images/uploads/${filename}`;
    }

    res.json({ url, filename });
  } catch (e) {
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * @openapi
 * /api/admin/friends:
 *   get:
 *     tags: [Admin]
 *     summary: 获取友链列表
 *     description: 获取当前语言配置中的友链列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 语言代码
 *     responses:
 *       200:
 *         description: 成功获取友链列表
 *       401:
 *         description: 未授权
 */
router.get('/friends', (req, res) => {
  try {
    const lang = req.query.lang as string;
    const configPath = getLangConfigPath(lang);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json({ friendLinks: config.friendLinks || [] });
  } catch (e) {
    res.status(500).json({ error: '友链读取失败' });
  }
});

/**
 * @openapi
 * /api/admin/friends:
 *   put:
 *     tags: [Admin]
 *     summary: 更新友链列表
 *     description: 更新所有语言配置中的友链列表
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     desc:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.put('/friends', (req, res) => {
  try {
    const { friendLinks } = req.body;

    if (!Array.isArray(friendLinks)) {
      return res.status(400).json({ error: '友链列表格式错误' });
    }

    // 验证友链数据
    for (const link of friendLinks) {
      if (!link.name || !link.url) {
        return res.status(400).json({ error: '友链名称和URL不能为空' });
      }
    }

    updateAllLangConfigs('friendLinks', friendLinks);
    res.json({ message: '友链更新成功', friendLinks });
  } catch (e) {
    res.status(500).json({ error: '友链更新失败' });
  }
});

/**
 * @openapi
 * /api/admin/social:
 *   get:
 *     tags: [Admin]
 *     summary: 获取社交媒体列表
 *     description: 获取当前语言配置中的社交媒体列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *         description: 语言代码
 *     responses:
 *       200:
 *         description: 成功获取社交媒体列表
 *       401:
 *         description: 未授权
 */
router.get('/social', (req, res) => {
  try {
    const lang = req.query.lang as string;
    const configPath = getLangConfigPath(lang);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json({ socialLinks: config.socialLinks || [] });
  } catch (e) {
    res.status(500).json({ error: '社交媒体读取失败' });
  }
});

/**
 * @openapi
 * /api/admin/social:
 *   put:
 *     tags: [Admin]
 *     summary: 更新社交媒体列表
 *     description: 更新所有语言配置中的社交媒体列表（最多4个）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               socialLinks:
 *                 type: array
 *                 maxItems: 4
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     url:
 *                       type: string
 *                     icon:
 *                       type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.put('/social', (req, res) => {
  try {
    const { socialLinks } = req.body;

    if (!Array.isArray(socialLinks)) {
      return res.status(400).json({ error: '社交媒体列表格式错误' });
    }

    if (socialLinks.length > 4) {
      return res.status(400).json({ error: '社交媒体链接最多4个' });
    }

    // 验证数据
    for (const link of socialLinks) {
      if (!link.platform || !link.url) {
        return res.status(400).json({ error: '平台名称和URL不能为空' });
      }
    }

    updateAllLangConfigs('socialLinks', socialLinks);
    res.json({ message: '社交媒体更新成功', socialLinks });
  } catch (e) {
    res.status(500).json({ error: '社交媒体更新失败' });
  }
});

/**
 * @openapi
 * /api/admin/social/icons:
 *   get:
 *     tags: [Admin]
 *     summary: 获取可用的社交媒体图标列表
 *     description: 返回预置的社交媒体图标列表
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取图标列表
 *       401:
 *         description: 未授权
 */
router.get('/social/icons', (req, res) => {
  const icons = [
    { id: 'github', name: 'GitHub', url: '/images/social/github.svg' },
    { id: 'bilibili', name: 'Bilibili', url: '/images/social/bilibili.svg' },
    { id: 'twitter', name: 'Twitter/X', url: '/images/social/twitter.svg' },
    { id: 'email', name: '邮箱', url: '/images/social/email.svg' },
  ];

  res.json({ icons });
});

export default router;
