# Misaka Blog Framework

个人博客系统，Vue 3 + Express + TypeScript。

## 快速开始

### 生产部署

```bash
# 国内服务器（推荐）
curl -L -O https://gitee.com/MisakaMisaka10124/Misaka-Blog-Framework/raw/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh

# 海外服务器
curl -L -O https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/raw/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh --source github
```

详见 [部署指南](./doc/deploy.md)。

### 本地开发

```bash
npm install

# 复制示例配置并去掉 .example 后缀
cp backend/data/config/core_server_config.example.json backend/data/config/core_server_config.json
cp backend/data/langrage/site_config_zh_cn.example.json backend/data/langrage/site_config_zh_cn.json
cp backend/data/langrage/site_config_zh_hk.example.json backend/data/langrage/site_config_zh_hk.json
cp backend/data/langrage/site_config_en_us.example.json backend/data/langrage/site_config_en_us.json

# 启动
npm run dev        # 前端 :5173
npm run server     # 后端 :3000
```

需要 Node.js >= 18。

## 功能

文章管理（上传/编辑/删除 Markdown，封面图，标签系统，全文搜索）、后台管理面板、多语言（简/繁/英）、深色/浅色主题、友链、访客统计、自定义光标、API 限流、JWT 认证、Swagger 文档。

## 数据存储

所有可编辑数据都在 `backend/data/` 下：

```
backend/data/
├── config/
│   ├── core_server_config.example.json  # 配置模板
│   ├── core_server_config.json          # 实际配置（从模板复制，去掉 .example）
│   └── tags/                            # 标签索引（自动生成）
├── langrage/
│   ├── site_config_{lang}.example.json  # 语言配置模板
│   └── site_config_{lang}.json          # 实际配置（从模板复制，去掉 .example）
├── images/
│   ├── avatars/                         # 头像
│   ├── backgrounds/                     # 背景图
│   ├── friends/                         # 友链头像
│   └── social/                          # 社交图标 SVG
└── posts/
    ├── *.md                             # 文章
    └── images/                          # 文章图片（按 slug 分目录）
```

> **注意**: `.example` 文件是模板，使用时需要复制并去掉后缀。正式配置文件不会提交到仓库。

## 后台管理

登录后进入 `/admin`，可管理文章、站点设置、友链、社交媒体。头像/背景图/社交图标等均可在后台修改。

## 文档

- [部署指南](./doc/deploy.md) - 环境要求、安装部署、版本更新
- [后端文档](./doc/backend.md) - API 接口、服务架构
- [前端文档](./doc/frontend.md) - 组件结构、路由配置
- [使用指南](./doc/guide.md) - 功能介绍、使用说明
- [更新日志](./doc/update/index.md) - 版本更新记录

## 许可证

MIT
