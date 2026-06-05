# Misaka Blog Framework

个人博客系统，Vue 3 + Express + TypeScript。

## 快速开始

```bash
npm install

# 复制示例配置
cp backend/data/config/core_server_config.example.json backend/data/config/core_server_config.json
cp backend/data/langrage/site_config_zh_cn.example.json backend/data/langrage/site_config_zh_cn.json

# 开发
npm run dev        # 前端 :5173
npm run server     # 后端 :3000

# 生产
npm run build
npm run start
```

Node.js >= 18。

## 功能

文章管理（上传/编辑/删除 Markdown，封面图，标签系统，全文搜索）、后台管理面板、多语言（简/繁/英）、深色/浅色主题、友链、访客统计、自定义光标、API 限流、JWT 认证、Swagger 文档。

## 数据存储

所有可编辑数据都在 `backend/data/` 下：

```
backend/data/
├── config/
│   ├── core_server_config.json   # 服务端配置
│   ├── post_index.json           # 文章索引（自动生成）
│   └── tags/                     # 标签索引（自动生成）
├── langrage/
│   └── site_config_{lang}.json   # 多语言站点配置
├── images/
│   ├── avatars/                  # 头像
│   ├── backgrounds/              # 背景图
│   ├── friends/                  # 友链头像
│   └── social/                   # 社交图标 SVG
└── posts/
    ├── *.md                      # 文章
    └── images/                   # 文章图片（按 slug 分目录）
```

前端不存储数据，`public/` 下只有 favicon 和 cursor。

## 后台管理

登录后进入 `/admin`，可管理文章、站点设置、友链、社交媒体。头像/背景图/社交图标等均可在后台修改。

## 文档

- [后端文档](./doc/backend.md)
- [前端文档](./doc/frontend.md)
- [验收文档](./doc/acceptance.md)
- [更新日志](./doc/update/)

## 许可证

MIT
