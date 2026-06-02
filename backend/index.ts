import express from 'express';
import fs from 'fs';
import path from 'path';
import open from 'open';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import apiRouter from './routes/index';
import { buildIndex } from './services/post_index';
import { syncAllTags } from './services/tag';

const app = express();
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

// 静态文件：文章图片
app.use('/images/posts', express.static(path.join(__dirname, './data/posts/images')));

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

  try {
    await open(`http://localhost:${port}/api-docs`);
  } catch (err) {
    console.log('自动打开浏览器失败，请手动访问上面的链接');
  }
});
