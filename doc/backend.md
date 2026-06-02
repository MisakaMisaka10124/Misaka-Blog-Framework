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
│   └── verify.ts           # 验证码生成
├── types/                  # TypeScript 类型定义
└── data/                   # 数据目录
    ├── config/             # 配置文件
    │   ├── core_server_config.json    # 服务端配置
    │   ├── core_server_config.example.json
    │   ├── post_index.json           # 文章索引（自动生成）
    │   └── tags/                     # 标签索引目录
    ├── langrage/           # 多语言配置
    │   ├── site_config_zh_cn.json
    │   ├── site_config_en_us.json
    │   └── site_config_zh_hk.json
    └── posts/              # 文章存储
        ├── *.md            # Markdown 文件
        └── images/         # 上传图片（按月分目录）
            └── YYYY/MM/    # 年/月子目录
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

### 1. 文章索引 (post_index.ts)

**职责**: 管理文章元数据的增删改查

**数据结构** (`PostMeta`):
```typescript
interface PostMeta {
  slug: string;        // 文件名（不含 .md）
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

**元数据提取规则**:
1. 标题: frontmatter.title > 首行 H1 > slug
2. 简介: frontmatter.summary > frontmatter.description > 正文前 200 字
3. 日期: frontmatter.date > 文件修改时间
4. 字数: 去除 Markdown 标记后的字符数
5. 阅读时间: max(1, ceil(字数 / 500)) 分钟

### 2. 标签系统 (tag.ts)

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
- `syncTagsForPost(slug, newTags, oldTags)`: 增量同步标签（对比新旧）
- `syncAllTags(posts)`: 从文章索引重建全部标签（启动时调用）
- `getAllTags()`: 获取所有标签及其文章数量
- `getPostsByTag(tag)`: 获取某标签下的文章列表

**文件名安全处理**: 将标签名中的特殊字符替换为下划线

### 3. 验证码 (verify.ts)

**职责**: 生成和验证图形验证码

**技术**: svg-captcha

**流程**:
1. `generateCaptcha()`: 生成 SVG 验证码，返回 `{ id, data }`
2. 前端显示 SVG，用户输入验证码
3. `verifyCaptcha(id, text)`: 验证用户输入

### 4. Markdown 渲染 (md_html.ts)

**职责**: 将 Markdown 转换为 HTML

**技术栈**:
- marked v18: Markdown 解析
- marked-highlight: 代码高亮扩展
- highlight.js: 语法高亮引擎（github-dark 主题）
- gray-matter: frontmatter 解析

**处理流程**:
1. 使用 gray-matter 剥离 frontmatter
2. 使用 marked 解析 Markdown
3. 使用 highlight.js 高亮代码块
4. 返回渲染后的 HTML

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
  1. 保存文件到 `data/posts/`
  2. 提取元数据，更新索引
  3. 同步标签索引
- **返回**: `{ message, filename, slug, cover, tags, meta }`

#### POST /api/posts/upload-image
- **认证**: JWT
- **功能**: 上传文章内图片
- **参数**: multipart/form-data
  - `image`: 图片文件
- **处理**:
  1. 按月分目录存储: `images/YYYY/MM/`
  2. 返回图片 URL
- **返回**: `{ url, filename }`

#### GET /api/posts/search
- **认证**: 无
- **功能**: 搜索文章
- **参数**: query string
  - `q`: 搜索关键字（匹配标题、简介、标签）
  - `tag`: 标签过滤
- **返回**: `{ posts: PostMeta[], total: number }`

#### GET /api/posts/index
- **认证**: 无
- **功能**: 获取全局文章索引
- **返回**: `{ posts: PostMeta[], lastUpdated: string }`

#### GET /api/posts/:slug
- **认证**: 无
- **功能**: 获取文章详情
- **返回**: `{ meta: PostMeta, content: string }`

#### PUT /api/posts/:slug
- **认证**: JWT
- **功能**: 更新文章内容
- **参数**: JSON body
  - `content`: 完整的 Markdown 内容（含 frontmatter）
- **处理**:
  1. 读取旧标签
  2. 写入新内容
  3. 更新索引
  4. 增量同步标签
- **返回**: `{ message, slug, meta }`

#### DELETE /api/posts/:slug
- **认证**: JWT
- **功能**: 删除文章
- **处理**:
  1. 移除所有标签关联
  2. 从索引中移除
  3. 删除 .md 文件
- **返回**: `{ message, slug }`

#### POST /api/posts/reindex
- **认证**: JWT
- **功能**: 重建文章索引
- **返回**: `{ message, count }`

### 标签路由 (tags.ts)

#### GET /api/tags
- **认证**: 无
- **功能**: 获取所有标签及文章数量
- **返回**: `{ tags: [{ tag, count }] }`

#### GET /api/tags/:tag
- **认证**: 无
- **功能**: 获取标签下的文章列表
- **返回**: `{ tag, posts: PostMeta[] }`

### 登录路由 (login.ts)

#### GET /api/captcha
- **认证**: 无
- **功能**: 获取验证码
- **返回**: `{ id, data }` (data 为 SVG 字符串)

#### POST /api/login
- **认证**: 无
- **功能**: 用户登录
- **参数**: JSON body
  - `username`: 用户名
  - `password`: 密码
  - `captchaId`: 验证码 ID
  - `captchaText`: 验证码文本
- **返回**: `{ token }`

### Markdown 路由 (md_html.ts)

#### POST /api/md/render
- **认证**: 无
- **功能**: 渲染 Markdown 为 HTML
- **参数**: JSON body
  - `markdown`: Markdown 文本
- **返回**: `{ html }`

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
3. **存储**: 按月分目录 `images/YYYY/MM/timestamp-filename.ext`
4. **返回**: 图片 URL `/images/posts/YYYY/MM/filename.ext`
5. **引用**: 在 Markdown 中使用 `![alt](url)`

## 错误处理

- 400: 请求参数错误
- 401: 未认证（无 token 或 token 无效）
- 404: 资源不存在
- 500: 服务器内部错误

## 数据安全

- 实际配置文件通过 .gitignore 排除
- 示例配置文件 (.example.json) 提供模板
- JWT 密钥通过环境变量或配置文件管理
- 验证码一次性使用
