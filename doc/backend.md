# 后端开发文档

## 技术架构

- **运行时**: Node.js + TypeScript (tsx)
- **框架**: Express 5
- **认证**: JWT (JSON Web Token)
- **存储**: 文件系统 (JSON + Markdown)

## 目录结构

```
backend/
├── index.ts                # 服务入口
├── routes/                 # API 路由
│   ├── index.ts            # 路由聚合器
│   ├── posts.ts            # 文章 CRUD + 搜索 + 图片上传
│   ├── tags.ts             # 标签查询
│   ├── login.ts            # 登录认证
│   ├── visitor.ts          # 访客统计
│   ├── md_html.ts          # Markdown 渲染
│   └── ai_chat.ts          # AI 聊天（预留）
├── services/               # 业务逻辑层
│   ├── post_index.ts       # 文章索引管理
│   ├── tag.ts              # 标签索引管理
│   └── visitor.ts          # 访客统计服务
├── middleware/              # 中间件
│   └── auth.ts             # JWT 认证中间件
├── utils/                  # 工具函数
│   ├── slug.ts             # 哈希 slug 生成器
│   ├── md_html.ts          # Markdown 渲染器
│   ├── rate_limit.ts       # 通用限流中间件
│   └── verify.ts           # 验证码生成
├── types/                  # TypeScript 类型定义
└── data/                   # 数据目录
    ├── config/             # 配置文件
    │   ├── core_server_config.json
    │   ├── post_index.json       # 文章索引（自动生成）
    │   └── tags/                 # 标签索引目录
    ├── langrage/           # 多语言配置
    └── posts/              # 文章存储
        ├── *.md            # Markdown 文件
        └── images/         # 上传图片（按 slug 分目录）
            ├── {slug}/     # 每篇文章独立目录
            └── _temp/      # 临时目录（编辑器上传中）
```

## 启动流程

1. 读取 `core_server_config.json` 获取端口和路径配置
2. 初始化 Express 应用，设置 trust proxy，加载中间件
3. 配置 Swagger API 文档 (`/api-docs`)
4. 挂载静态文件服务 (`/images/posts`)
5. 挂载 API 路由 (`/api`)
6. 检测 `dist/` 目录，存在则挂载前端静态文件 + SPA 回退
7. 启动 HTTP 服务器
8. 构建文章索引 (`buildIndex`)
9. 同步标签索引 (`syncAllTags`)

## 核心模块

### 1. Slug 生成器 (slug.ts)

基于文件名 + 时间戳的 SHA-256 哈希，取前 8 位十六进制字符。

```typescript
export function generateSlug(filename: string): string {
  const timestamp = Date.now().toString();
  const raw = `${filename}-${timestamp}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 8);
}
```

### 2. 文章索引 (post_index.ts)

**PostMeta 结构**:
```typescript
interface PostMeta {
  slug: string;        // 哈希 slug
  title: string;       // 标题（frontmatter > H1 > slug）
  summary: string;     // 简介（frontmatter > 正文前 200 字）
  cover: string;       // 封面图 URL
  tags: string[];      // 标签数组
  date: string;        // 日期
  wordCount: number;   // 字数
  readTime: string;    // 阅读时间
}
```

**核心函数**:
- `scanPosts()`: 扫描所有 .md 文件，提取元数据，按日期降序 + 文件修改时间降序排列
- `buildIndex()`: 构建全局索引并写入 JSON
- `readIndex()`: 读取现有索引（不存在则构建）
- `addOrUpdatePost(slug)`: 增量更新单篇文章（同日期按 mtime 排序）
- `removePost(slug)`: 从索引中移除文章

### 3. 标签系统 (tag.ts)

每个标签一个 JSON 文件，存储在 `data/config/tags/` 目录。

**核心函数**:
- `syncTagsForPost(slug, newTags, oldTags)`: 增量同步标签
- `syncAllTags(posts)`: 启动时从索引重建全部标签
- `getAllTags()`: 获取所有标签及文章数量

### 4. 限流中间件 (rate_limit.ts)

通用数据接口限流，基于 `express-rate-limit`，配置来自 `core_server_config.json` 的 `rate_limit.data_api`。

```typescript
export function createDataLimiter() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const { window_ms, max_requests, message } = config.rate_limit.data_api;
  return rateLimit({ windowMs: window_ms, max: max_requests, message: { error: message } });
}
```

应用于所有 GET 数据读取接口（posts/tags 的查询类 API），写入类接口和已有独立限流的接口除外。

### 5. 访客统计 (services/visitor.ts)

JSON 文件存储（`config/visitor_stats.json`），同一 IP 同一天只计一次。

- `recordVisit(ip)`: 记录访问，返回今日/总访客数
- `getCountryCode(ip)`: 调用 ip-api.com 获取国家代码（用于国旗显示）
- 自动清理 30 天前的 IP 记录

### 6. JWT 认证中间件 (middleware/auth.ts)

共享的 `verifyToken` 中间件，校验 Authorization 头中的 Bearer Token。

```typescript
export function verifyToken(req, res, next) {
  // 校验 JWT，解析 payload 到 req.user
  // 过期返回 401 + 令牌已过期
  // 无效返回 401 + 令牌无效
}
```

### 7. 图片管理

**核心函数**:
- `moveImageToSlugDir(tempPath, slug, filename)`: 移动图片到 slug 目录
- `removeImageDir(slug)`: 删除 slug 对应的图片目录
- `writeFrontmatterField(slug, field, value)`: 写入 frontmatter 字段

## API 路由

### POST /api/posts/upload

上传 Markdown 文章 + 可选封面图。

- 自动生成哈希 slug
- 封面图移动到 `images/{slug}/` 并写入 frontmatter
- `_temp` 目录图片移动到 slug 目录，md 中的 `_temp` URL 自动替换为真实 URL
- 更新索引，同步标签

### POST /api/posts/upload-image

上传文章内图片到指定 slug 目录。

- 参数: `image`（文件）、`slug`（文章 slug）
- 文件名空格自动替换为连字符（避免 markdown 解析截断 URL）
- 返回: `{ url, filename }`

### PUT /api/posts/:slug

更新文章内容和可选封面。

- 支持 multipart/form-data（有封面时）和 JSON（无封面时）
- 条件性 multer 中间件
- 更新索引，增量同步标签

### DELETE /api/posts/:slug

删除文章、图片目录并清理索引。

### GET /api/posts/search

搜索文章，支持 `q`（关键字）和 `tag`（标签）参数。

### GET /api/posts/index

返回所有文章元数据列表。

### GET /api/posts/:slug

返回指定文章的 Markdown 原文和元数据。

### GET /api/tags

返回所有标签及文章数量。

### GET /api/tags/:tag

返回标签下的文章列表。

### GET /api/captcha

生成 SVG 验证码，返回 `{ id, data }`。

### POST /api/login

验证用户名、密码和验证码，返回 JWT。

### POST /api/md/render

将 Markdown 渲染为 HTML（支持代码高亮）。

### GET /api/visitor/stats

记录访问并返回站点统计。

- 记录当前 IP（同一天同一 IP 只计一次）
- 调用 ip-api.com 获取国家代码
- 统计今日更新文章数（从索引 date 字段）
- 返回: `{ ip, countryCode, todayVisitors, totalVisitors, todayPosts }`
- 限流: 受 `rate_limit.data_api` 配置约束

## 认证机制

- JWT 令牌，过期时间 24 小时
- `verifyToken` 中间件校验
- svg-captcha 一次性验证码

## 错误处理

- 400: 请求参数错误
- 401: 未认证
- 404: 资源不存在
- 500: 服务器内部错误
