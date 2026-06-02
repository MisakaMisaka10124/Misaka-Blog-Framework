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
- Swagger API 文档

## 功能特性

- 文章管理：上传、编辑、删除 Markdown 文章
- 标签系统：基于独立 JSON 文件的标签索引
- 全文搜索：支持标题、简介、标签关键字搜索
- 图片上传：客户端压缩 + 服务端按月分目录存储
- 多语言：中文简体 / 中文繁体 / English
- 深色模式：自动跟随系统主题
- 响应式布局：适配桌面端和移动端
- 自定义光标：跟随鼠标的动态图片
- 友情链接：可配置的友链展示
- ICP 备案：页脚显示备案号并链接到工信部查询

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
# 服务端配置
cp backend/data/config/core_server_config.example.json backend/data/config/core_server_config.json

# 站点配置（多语言）
cp backend/data/langrage/site_config_zh_cn.example.json backend/data/langrage/site_config_zh_cn.json
cp backend/data/langrage/site_config_en_us.example.json backend/data/langrage/site_config_en_us.json
cp backend/data/langrage/site_config_zh_hk.example.json backend/data/langrage/site_config_zh_hk.json
```

### 启动开发服务器

```bash
# 启动后端（端口 3000）
npm run dev:server

# 启动前端（端口 5173，自动代理到后端）
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
personal_web/
├── backend/                    # 后端代码
│   ├── index.ts               # Express 服务入口
│   ├── routes/                # API 路由
│   │   ├── index.ts           # 路由聚合
│   │   ├── posts.ts           # 文章 CRUD + 搜索
│   │   ├── tags.ts            # 标签查询
│   │   ├── login.ts           # 登录认证
│   │   ├── md_html.ts         # Markdown 渲染
│   │   └── ai_chat.ts         # AI 聊天（预留）
│   ├── services/              # 业务逻辑
│   │   ├── post_index.ts      # 文章索引管理
│   │   └── tag.ts             # 标签索引管理
│   ├── utils/                 # 工具函数
│   │   ├── md_html.ts         # Markdown 渲染器
│   │   └── verify.ts          # 验证码生成
│   ├── types/                 # TypeScript 类型
│   └── data/                  # 数据目录
│       ├── config/            # 配置文件（gitignore）
│       │   ├── tags/          # 标签索引 JSON
│       │   └── post_index.json # 文章索引
│       ├── langrage/          # 多语言配置（gitignore）
│       └── posts/             # 文章文件（gitignore）
│           └── images/        # 上传图片（按月分目录）
├── src/                       # 前端代码
│   ├── views/                 # 页面组件
│   │   ├── Home.vue           # 首页（左栏+右栏）
│   │   ├── Categories.vue     # 博客分类页
│   │   ├── PostDetail.vue     # 文章详情
│   │   ├── Search.vue         # 搜索页
│   │   ├── Upload.vue         # 文章管理（需登录）
│   │   ├── Login.vue          # 登录页
│   │   ├── Friends.vue        # 友链页
│   │   ├── About.vue          # 关于页
│   │   └── CategoryDetail.vue # 标签详情
│   ├── components/            # 通用组件
│   ├── layout/                # 布局组件
│   │   ├── AppLayout.vue      # 主布局
│   │   ├── Navbar.vue         # 导航栏
│   │   └── Footer.vue         # 页脚
│   ├── router/                # 路由配置
│   ├── assets/                # 静态资源
│   └── types/                 # TypeScript 类型
├── public/                    # 公共静态资源
│   └── images/                # 图片资源
├── doc/                       # 项目文档
└── vite.config.ts             # Vite 配置
```

## API 端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/config` | 获取站点配置 | 否 |
| GET | `/api/friendlinks` | 获取友链列表 | 否 |
| GET | `/api/posts/index` | 获取文章索引 | 否 |
| GET | `/api/posts/search` | 搜索文章 | 否 |
| GET | `/api/posts/:slug` | 获取文章详情 | 否 |
| POST | `/api/posts/upload` | 上传文章 | JWT |
| PUT | `/api/posts/:slug` | 更新文章 | JWT |
| DELETE | `/api/posts/:slug` | 删除文章 | JWT |
| POST | `/api/posts/upload-image` | 上传图片 | JWT |
| POST | `/api/posts/reindex` | 重建索引 | JWT |
| GET | `/api/tags` | 获取所有标签 | 否 |
| GET | `/api/tags/:tag` | 获取标签下的文章 | 否 |
| GET | `/api/captcha` | 获取验证码 | 否 |
| POST | `/api/login` | 登录 | 否 |
| POST | `/api/md/render` | 渲染 Markdown | 否 |

## 配置说明

### 服务端配置 (core_server_config.json)

```json
{
  "server": { "port": 3000 },
  "jwt": { "secret": "your-secret-key" },
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
- `hero`: 英雄区配置
- `friendLinks`: 友情链接

## 部署

### 构建

```bash
npm run build
```

### 启动生产服务器

```bash
tsx backend/index.ts
```

前端静态文件在 `dist/` 目录，可通过 Nginx 或 Express 静态服务。

## 开发文档

详细文档见 [doc/](./doc/) 目录：

- [后端开发文档](./doc/backend.md)
- [前端开发文档](./doc/frontend.md)
- [阶段验收文档](./doc/acceptance.md)
- [更新日志](./doc/update/)

## 许可证

MIT
