import express from 'express';
import fs from 'fs';
import path from 'path';
import open from 'open';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import apiRouter from './routes/index';
import { buildIndex } from './services/post_index';
import { syncAllTags } from './services/tag';
import { initSiteStats } from './services/site_stats';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

const configPath = path.join(__dirname, './data/config/core_server_config.json');
const serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Swagger
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Misaka API Documentation',
      version: '1.0.0',
      description: '个人网站后端 API 文档',
    },
    servers: [
      {
        url: `http://localhost:${serverConfig.server.port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, './routes/*.ts'), path.join(__dirname, './index.ts')],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @openapi
 * /api/config:
 *   get:
 *     tags: [System]
 *     summary: 获取网站完整配置
 *     description: 从语言配置文件加载站点标题、导航、社交链接、英雄区、友链等全部前端可配置字段
 *     responses:
 *       200:
 *         description: 成功获取配置
 */
app.get('/api/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const lang = req.query.lang || 'zh_cn';
    const siteConfigPath = path.join(__dirname, `./data/langrage/site_config_${lang}.json`);

    if (fs.existsSync(siteConfigPath)) {
      const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf-8'));
      res.json(siteConfig);
    } else {
      // 回退到中文配置
      const fallbackPath = path.join(__dirname, './data/langrage/site_config_zh_cn.json');
      if (fs.existsSync(fallbackPath)) {
        res.json(JSON.parse(fs.readFileSync(fallbackPath, 'utf-8')));
      } else {
        res.json({ siteTitle: 'Misaka Personal Web', welcomeMessage: 'Welcome!' });
      }
    }
  } catch (e) {
    res.status(500).json({ error: '配置读取失败' });
  }
});

/**
 * @openapi
 * /api/server-config:
 *   get:
 *     tags: [System]
 *     summary: 获取服务器配置
 *     description: 返回前端需要的服务器配置参数（不含敏感信息）
 *     responses:
 *       200:
 *         description: 成功获取服务器配置
 */
app.get('/api/server-config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    // 只返回前端需要的非敏感配置
    const publicConfig: Record<string, any> = {};

    if (config.display) publicConfig.display = config.display;
    if (config.imageCompression) publicConfig.imageCompression = config.imageCompression;
    if (config.hero) publicConfig.hero = config.hero;
    if (config.defaults) publicConfig.defaults = config.defaults;
    if (config.fallbackImages) publicConfig.fallbackImages = config.fallbackImages;

    res.json(publicConfig);
  } catch (e) {
    res.status(500).json({ error: '服务器配置读取失败' });
  }
});

/**
 * @openapi
 * /api/friendlinks:
 *   get:
 *     tags: [System]
 *     summary: 获取友情链接列表
 *     description: 从语言配置文件中提取友链数据
 *     responses:
 *       200:
 *         description: 成功获取友链列表
 */
app.get('/api/friendlinks', (req, res) => {
  try {
    const lang = req.query.lang || 'zh_cn';
    const siteConfigPath = path.join(__dirname, `./data/langrage/site_config_${lang}.json`);
    const fallbackPath = path.join(__dirname, './data/langrage/site_config_zh_cn.json');
    const configPath = fs.existsSync(siteConfigPath) ? siteConfigPath : fallbackPath;

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      res.json({ friendLinks: config.friendLinks || [] });
    } else {
      res.json({ friendLinks: [] });
    }
  } catch (e) {
    res.status(500).json({ error: '友链读取失败' });
  }
});

// 静态文件：文章图片（映射到 posts 根目录，支持月份子目录）
// 安全过滤：禁止访问 post_index.json 和 tags/ 目录
app.use('/images/posts', (req, res, next) => {
  if (req.path === '/post_index.json' || req.path.startsWith('/tags/')) {
    return res.status(403).end();
  }
  next();
}, express.static(path.join(__dirname, './data/posts')));

// 静态文件：所有可修改图片统一存放在 data/images/
app.use('/images/backgrounds', express.static(path.join(__dirname, './data/images/backgrounds')));
app.use('/images/avatars', express.static(path.join(__dirname, './data/images/avatars')));
app.use('/images/friends', express.static(path.join(__dirname, './data/images/friends')));
app.use('/images/social', express.static(path.join(__dirname, './data/images/social')));
app.use('/images/uploads', express.static(path.join(__dirname, './data/images/uploads')));

// 静态文件：兜底（favicon、cursor 等框架级静态资源）
app.use('/images', express.static(path.join(__dirname, '../dist/images')));

// API 路由
app.use('/api', apiRouter);

// 前端静态文件（生产模式）
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA 回退：非 API、非图片、非文档的路由都返回 index.html
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`Frontend served from: ${distPath}`);
}

const port = serverConfig.server.port;
app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger Docs: http://localhost:${port}/api-docs`);

  // 启动时构建文章索引并同步标签
  try {
    const index = buildIndex();
    syncAllTags(index.posts);
    console.log(`Post index built: ${index.posts.length} posts found`);
  } catch (e) {
    console.log('Post index build skipped (no posts directory or empty)');
  }

  // 初始化站点统计
  try {
    const stats = initSiteStats();
    console.log(`Site stats initialized: ${stats.totalPosts} posts, ${stats.totalTags} tags`);
  } catch (e) {
    console.log('Site stats initialization skipped');
  }

  try {
    await open(`http://localhost:${port}/api-docs`);
  } catch (err) {
    console.log('自动打开浏览器失败，请手动访问上面的链接');
  }
});
