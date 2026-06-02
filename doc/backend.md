# 后端开发文档

## 技术架构

- **运行时**: Node.js + TypeScript (tsx)
- **框架**: Express 5
- **认证**: JWT (JSON Web Token)
- **存储**: 文件系统 (JSON + Markdown)

## 目录结构

```
backend/
├── index.ts                # 服务入口，Express 配置
├── routes/                 # API 路由
│   ├── index.ts            # 路由聚合器
│   ├── posts.ts            # 文章 CRUD + 搜索
│   ├── tags.ts             # 标签查询
│   ├── login.ts            # 登录认证
│   ├── md_html.ts          # Markdown 渲染
│   └── ai_chat.ts          # AI 聊天（预留）
├── services/               # 业务逻辑层
│   ├── post_index.ts       # 文章索引管理
│   └── tag.ts              # 标签索引管理
├── utils/                  # 工具函数
│   ├── md_html.ts          # Markdown 渲染器
│   ├── verify.ts           # 验证码生成
│   └── slug.ts             # 哈希 slug 生成器
├── types/                  # TypeScript 类型定义
└── data/                   # 数据目录
    ├── config/             # 配置文件
    │   ├── core_server_config.json    # 服务端配置
    │   ├── core_server_config.example.json
    │   ├── post_index.json           # 文章索引（自动生成）
    │   └── tags/                     # 标签索引目录
    ├── langrage/           # 多语言配置
    └── posts/              # 文章存储
        ├── *.md            # Markdown 文件
        └── images/         # 上传图片（按 slug 分目录）
            └── {slug}/     # 每篇文章独立目录
```

## 启动流程

1. 读取 `core_server_config.json` 获取端口和路径配置
2. 初始化 Express 应用，加载中间件
3. 配置 Swagger API 文档 (`/api-docs`)
4. 挂载静态文件服务 (`/images/posts`)
5. 挂载 API 路由 (`/api`)
6. 启动 HTTP 服务器
7. 构建文章索引 (`buildIndex`)
8. 同步标签索引 (`syncAllTags`)

## 核心模块

### 1. Slug 生成器 (slug.ts)

**职责**: 生成文章唯一标识符

**算法**: 基于文件名 + 时间戳的 SHA-256 哈希，取前 8 位

```typescript
import crypto from 'crypto';

export function generateSlug(filename: string): string {
  const timestamp = Date.now().toString();
  const raw = `${filename}-${timestamp}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 8);
}
```

**特点**:
- 8 位十六进制字符（约 43 亿种组合）
- 基于文件名和时间戳，保证唯一性
- 不可逆，无法从 slug 推断原始文件名

### 2. 文章索引 (post_index.ts)

**职责**: 管理文章元数据的增删改查

**数据结构** (`PostMeta`):
```typescript
interface PostMeta {
  slug: string;        // 哈希 slug
  title: string;       // 标题（frontmatter > H1 > slug）
  summary: string;     // 简介（frontmatter > 正文前 200 字）
  cover: string;       // 封面图 URL
  tags: string[];      // 标签数组
  date: string;        // 日期（frontmatter > 文件修改时间）
  wordCount: number;   // 字数
  readTime: string;    // 阅读时间
}
```

**核心函数**:
- `scanPosts()`: 扫描所有 .md 文件，提取元数据
- `buildIndex()`: 构建全局索引并写入 JSON
- `readIndex()`: 读取现有索引（不存在则构建）
- `addOrUpdatePost(slug)`: 增量更新单篇文章
- `removePost(slug)`: 从索引中移除文章

### 3. 标签系统 (tag.ts)

**职责**: 管理标签与文章的关联关系

**存储方式**: 每个标签一个 JSON 文件，存储在 `data/config/tags/` 目录

**数据结构** (`TagIndex`):
```typescript
interface TagIndex {
  tag: string;      // 标签名
  posts: string[];  // 文章 slug 列表
}
```

**核心函数**:
- `addTagToPost(tag, slug)`: 将文章添加到标签
- `removeTagFromPost(tag, slug)`: 从标签中移除文章
- `syncTagsForPost(slug, newTags, oldTags)`: 增量同步标签
- `syncAllTags(posts)`: 从文章索引重建全部标签（启动时调用）
- `getAllTags()`: 获取所有标签及其文章数量
- `getPostsByTag(tag)`: 获取某标签下的文章列表

### 4. 图片管理

**存储结构**: `backend/data/posts/images/{slug}/`

**核心函数**:
- `moveImageToSlugDir(tempPath, slug, filename)`: 移动图片到 slug 目录
- `moveTempImagesToSlug(slug)`: 将 _temp 目录图片移到 slug 目录
- `removeImageDir(slug)`: 删除 slug 对应的图片目录
- `writeFrontmatterField(slug, field, value)`: 写入/更新 frontmatter 字段

## API 路由详解

### 文章路由 (posts.ts)

#### POST /api/posts/upload
- **认证**: JWT
- **功能**: 上传 Markdown 文章 + 可选封面图
- **参数**: multipart/form-data
  - `file`: Markdown 文件
  - `cover`: 封面图片（可选）
  - `tags`: 标签（逗号分隔）
- **处理**:
  1. 自动生成哈希 slug
  2. 保存 md 文件为 `{slug}.md`
  3. 封面图移动到 `images/{slug}/` 并写入 frontmatter
  4. _temp 图片移动到 slug 目录
  5. 更新索引，同步标签
- **返回**: `{ message, slug, cover, tags, meta }`

#### POST /api/posts/upload-image
- **认证**: JWT
- **功能**: 上传文章内图片
- **参数**: multipart/form-data
  - `image`: 图片文件
  - `slug`: 文章 slug（图片存入对应目录）
- **返回**: `{ url, filename }`

#### GET /api/posts/search
- **认证**: 无
- **功能**: 搜索文章
- **参数**: query string
  - `q`: 搜索关键字（匹配标题、简介、标签）
  - `tag`: 标签过滤
- **返回**: `{ posts: PostMeta[], total: number }`

#### PUT /api/posts/:slug
- **认证**: JWT
- **功能**: 更新文章内容和可选封面
- **参数**: multipart/form-data
  - `content`: 完整的 Markdown 内容（含 frontmatter）
  - `cover`: 新的封面图片（可选）
- **处理**:
  1. 读取旧标签
  2. 写入新内容
  3. 如果有新封面，移动到 slug 目录并更新 frontmatter
  4. 更新索引，增量同步标签
- **返回**: `{ message, slug, meta }`

#### DELETE /api/posts/:slug
- **认证**: JWT
- **功能**: 删除文章
- **处理**:
  1. 移除所有标签关联
  2. 从索引中移除
  3. 删除 .md 文件
  4. 删除图片目录 `images/{slug}/`
- **返回**: `{ message, slug }`

### 标签路由 (tags.ts)

#### GET /api/tags
- **认证**: 无
- **功能**: 获取所有标签及文章数量
- **返回**: `{ tags: [{ tag, count }] }`

#### GET /api/tags/:tag
- **认证**: 无
- **功能**: 获取标签下的文章列表
- **返回**: `{ tag, posts: PostMeta[] }`

## 认证机制

### JWT 令牌

- **签发**: 登录成功后返回
- **存储**: 前端 localStorage
- **验证**: `verifyToken` 中间件
- **过期**: 24 小时

### 验证码

- **生成**: svg-captcha 生成 SVG
- **存储**: 内存 Map（id -> text）
- **验证**: 一次性，验证后删除

## 图片上传流程

1. **前端压缩**: Canvas API 压缩（最大 1920px，JPEG 82% 质量）
2. **上传**: multipart/form-data 发送到后端
3. **临时存储**: 存入 `images/_temp/` 目录
4. **移动**: 根据 slug 移动到 `images/{slug}/` 目录
5. **返回**: 图片 URL `/images/posts/{slug}/filename.ext`
6. **引用**: 在 Markdown 中使用 `![alt](url)`

## 错误处理

- 400: 请求参数错误
- 401: 未认证（无 token 或 token 无效）
- 404: 资源不存在
- 500: 服务器内部错误
