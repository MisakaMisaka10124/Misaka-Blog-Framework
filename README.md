# Misaka Personal Web

个人博客系统，基于 Vue 3 + Express + TypeScript 构建。

## 技术栈

**前端**
- Vue 3 (Composition API + `<script setup>`)
- Vite 8
- TypeScript
- highlight.js (代码高亮)
- marked (Markdown 渲染)

**后端**
- Express 5
- TypeScript (tsx 运行)
- JWT 认证
- svg-captcha 验证码
- multer 文件上传
- gray-matter frontmatter 解析
- express-rate-limit 限流
- Swagger API 文档

## 功能特性

- 文章管理：上传、编辑、删除 Markdown 文章
- 哈希 Slug：基于 SHA-256 自动生成 8 位唯一标识
- 标签系统：独立 JSON 文件存储，支持自动补全
- 全文搜索：支持标题、简介、标签关键字搜索
- 图片管理：按文章 slug 分目录存储，文件名自动去空格，支持封面图
- 编辑器：Code/Preview 双模式切换，支持粘贴图片
- 多语言：中文简体 / 中文繁体 / English
- 深色模式：自动跟随系统主题，浅色模式对比度优化
- 404 页面：未匹配路由自动跳转
- 响应式布局：适配桌面端和移动端
- 自定义光标：跟随鼠标的动态图片
- 友情链接：可配置的友链展示
- ICP 备案：页脚显示备案号并链接到工信部查询
- 访客统计：IP 地理定位 + 国旗显示，今日/总访客计数
- API 限流：数据接口 IP 级限流，防爬虫和 DDoS
- 认证拦截器：Axios 请求/响应拦截器自动注入 JWT，401 自动跳转登录

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 配置文件

复制示例配置文件并修改为实际配置：

```bash
cp backend/data/config/core_server_config.example.json backend/data/config/core_server_config.json
cp backend/data/langrage/site_config_zh_cn.example.json backend/data/langrage/site_config_zh_cn.json
cp backend/data/langrage/site_config_en_us.example.json backend/data/langrage/site_config_en_us.json
cp backend/data/langrage/site_config_zh_hk.example.json backend/data/langrage/site_config_zh_hk.json
```

### 启动开发服务器

```bash
npm run dev          # 启动前端开发服务器（端口 5173）
npm run server       # 启动后端（端口 3000）
npm run server:watch # 后端热重载（nodemon，修改自动重启）
```

### 构建生产版本

```bash
npm run build        # 编译前端到 dist/
npm run start        # 编译前端 + 启动后端（生产模式）
```

### 生产部署

后端自动检测 `dist/` 目录并提供前端静态文件服务，配合 Nginx 反向代理使用。参考 `nginx.conf` 配置模板。

## 项目结构

```
personal_web/
├── backend/                    # 后端代码
│   ├── index.ts               # Express 服务入口
│   ├── routes/                # API 路由
│   │   ├── posts.ts           # 文章 CRUD + 搜索 + 图片上传
│   │   ├── tags.ts            # 标签查询
│   │   ├── login.ts           # 登录认证
│   │   ├── visitor.ts         # 访客统计
│   │   └── md_html.ts         # Markdown 渲染
│   ├── services/              # 业务逻辑
│   │   ├── post_index.ts      # 文章索引管理
│   │   ├── tag.ts             # 标签索引管理
│   │   └── visitor.ts         # 访客统计服务
│   ├── middleware/             # 中间件
│   │   └── auth.ts            # JWT 认证中间件
│   ├── utils/                 # 工具函数
│   │   ├── slug.ts            # 哈希 slug 生成器
│   │   ├── md_html.ts         # Markdown 渲染器
│   │   ├── rate_limit.ts      # 通用限流中间件
│   │   └── verify.ts          # 验证码生成
│   └── data/                  # 数据目录（gitignore）
│       ├── config/            # 配置文件 + 标签索引
│       ├── langrage/          # 多语言配置
│       └── posts/             # 文章文件
│           └── images/        # 上传图片（按 slug 分目录）
├── src/                       # 前端代码
│   ├── views/                 # 页面组件
│   │   ├── Home.vue           # 首页
│   │   ├── Categories.vue     # 博客分类页
│   │   ├── PostDetail.vue     # 文章详情
│   │   ├── Search.vue         # 搜索页
│   │   ├── Upload.vue         # 文章管理（Code/Preview 编辑器）
│   │   ├── Login.vue          # 登录页
│   │   ├── Friends.vue        # 友链页
│   │   ├── About.vue          # 关于页
│   │   └── NotFound.vue       # 404 页面
│   ├── components/            # 通用组件
│   ├── layout/                # 布局组件
│   └── assets/                # 静态资源 + 样式
├── doc/                       # 项目文档
│   ├── backend.md             # 后端开发文档
│   ├── frontend.md            # 前端开发文档
│   ├── acceptance.md          # 阶段验收文档
│   └── update/                # 更新日志
└── vite.config.ts             # Vite 配置
```

## 图片管理

### 存储结构

```
backend/data/posts/images/
├── {slug1}/
│   ├── cover.jpg
│   └── 1717xxx-screenshot.png
├── {slug2}/
│   └── cover.png
└── _temp/                     # 临时目录（编辑器上传中）
```

### 上传流程

1. **前端压缩**: Canvas API 压缩（最大 1920px，JPEG 82%）
2. **临时存储**: 存入 `images/_temp/` 目录
3. **移动**: 文章保存后移动到 `images/{slug}/` 目录
4. **URL 替换**: 自动将 md 中的 `_temp` URL 替换为真实 slug URL
5. **引用**: Markdown 中使用 `![alt](/images/posts/{slug}/filename.jpg)`

### 封面图

- 上传文章时可选择封面图
- 封面 URL 写入 frontmatter 的 `cover` 字段
- 编辑时可更新封面图
- 文章卡片和详情页自动显示封面

## 编辑器

Upload 页面的 Markdown 编辑器支持：

- **Code 模式**: 语法编辑，支持粘贴图片
- **Preview 模式**: 实时预览渲染后的 Markdown
- **工具栏**: 加粗、斜体、行内代码、代码块、链接、图片、引用、列表
- **标签自动补全**: 输入时显示已有标签建议

## API 端点

| 方法 | 路径 | 说明 | 认证 | 限流 |
|------|------|------|------|------|
| GET | `/api/config` | 获取站点配置 | 否 | 否 |
| GET | `/api/friendlinks` | 获取友链列表 | 否 | 否 |
| GET | `/api/posts/index` | 获取文章索引 | 否 | 是 |
| GET | `/api/posts/search` | 搜索文章 | 否 | 是 |
| GET | `/api/posts/:slug` | 获取文章详情 | 否 | 是 |
| POST | `/api/posts/upload` | 上传文章+封面 | JWT | 否 |
| PUT | `/api/posts/:slug` | 更新文章+封面 | JWT | 否 |
| DELETE | `/api/posts/:slug` | 删除文章+图片目录 | JWT | 否 |
| POST | `/api/posts/upload-image` | 上传图片 | JWT | 否 |
| POST | `/api/posts/reindex` | 重建索引 | JWT | 否 |
| GET | `/api/tags` | 获取所有标签 | 否 | 是 |
| GET | `/api/tags/:tag` | 获取标签下的文章 | 否 | 是 |
| GET | `/api/captcha` | 获取验证码 | 否 | 否 |
| POST | `/api/login` | 登录 | 否 | 否 |
| POST | `/api/md/render` | 渲染 Markdown | 否 | 否 |
| GET | `/api/visitor/stats` | 访客统计+IP定位 | 否 | 是 |

## 配置说明

### 服务端配置 (core_server_config.json)

```json
{
  "server": { "port": 3000 },
  "jwt": { "secret": "your-secret-key", "expires_in": "24h" },
  "rate_limit": {
    "ai_chat": { "window_ms": 3600000, "max_requests": 30 },
    "data_api": { "window_ms": 60000, "max_requests": 120 }
  },
  "paths": { "posts_dir": "./data/posts/" }
}
```

### 站点配置 (site_config_zh_cn.json)

- `siteTitle`: 站点标题
- `welcomeMessage`: 欢迎语
- `about`: 个人简介（显示在首页左侧）
- `navLinks`: 导航链接
- `socialLinks`: 社交媒体链接
- `footer.copyright`: 版权信息
- `footer.icp`: ICP 备案号
- `hero`: 个性化配置（背景图片、签名）
- `friendLinks`: 友情链接

## 开发文档

详细文档见 [doc/](./doc/) 目录：

- [后端开发文档](./doc/backend.md)
- [前端开发文档](./doc/frontend.md)
- [阶段验收文档](./doc/acceptance.md)
- [更新日志](./doc/update/)

## 许可证

MIT
