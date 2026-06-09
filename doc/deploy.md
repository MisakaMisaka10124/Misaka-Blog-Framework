# 部署指南

## 环境要求

### 必须安装

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| **Node.js** | 18+ | 自带 npm |

> curl 和 tar 系统一般自带，脚本会自动检测

### 可选依赖（脚本会自动处理）

| 依赖 | 模式 | 说明 |
|------|------|------|
| pm2 | Nginx 模式 | 脚本自动安装 |
| Nginx | 两种模式 | 脚本询问是否安装 |
| Docker | Docker 模式 | 需提前安装 |
| Docker Compose | Docker 模式 | 需提前安装 |

---

## 安装 Node.js（首次部署前）

### Ubuntu / Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### CentOS / RHEL / Fedora

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Arch Linux / Manjaro

```bash
sudo pacman -S nodejs npm
```

### macOS

```bash
brew install node
```

### 验证

```bash
node -v  # 应显示 v18+ 或 v20+
npm -v   # 自动随 Node.js 安装
```

---

## 安装 Docker（Docker 模式需要）

### Ubuntu / Debian

```bash
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# 重新登录以生效
```

### CentOS / RHEL / Fedora

```bash
sudo yum install -y docker docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### Arch Linux / Manjaro

```bash
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### macOS

```bash
brew install --cask docker
# 然后启动 Docker Desktop 应用
```

---

## 快速开始

### 下载部署脚本

```bash
# 下载部署脚本
curl -L -O https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/raw/main/deploy.sh
chmod +x deploy.sh
```

### 运行部署

```bash
# 交互式选择模式（推荐新手使用）
sudo ./deploy.sh

# 或直接指定模式
sudo ./deploy.sh --mode nginx    # Nginx + pm2 模式
sudo ./deploy.sh --mode docker   # Docker 模式
```

> 不指定 `--mode` 参数时，脚本会交互式询问选择 nginx 还是 docker 模式。

---

## 方式一：Nginx + pm2 模式（推荐）

### 首次安装

```bash
# 1. 确保已安装依赖（见上方"安装依赖"章节）
node -v    # 需要 v18+
npm -v     # 需要 9+

# 2. 下载部署脚本（如果还没有）
curl -L -O https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/raw/main/deploy.sh
chmod +x deploy.sh

# 3. 运行安装
sudo ./deploy.sh --mode nginx

# 脚本会自动：
# ✓ 检查依赖（缺少会提示安装方法）
# ✓ 安装 pm2（自动）
# ✓ 下载并解压代码
# ✓ 安装 npm 依赖
# ✓ 启动 Express 后端
# ? 询问是否配置 Nginx（推荐选择 y）
#   ✓ 安装 Nginx（如果没有，会询问）
#   ✓ 询问域名
#   ✓ 询问是否配置 HTTPS
#   ✓ 创建并启用 Nginx 配置
#   ✓ 重启 Nginx
```

### 版本更新

```bash
# 更新到最新版本（自动更新后端和前端）
sudo ./deploy.sh --mode nginx

# 更新到指定版本
sudo ./deploy.sh --mode nginx --version v1.2.0
```

---

## 方式二：Docker 模式

### 首次安装

```bash
# 1. 确保已安装依赖（见上方"安装依赖"章节）
node -v              # 需要 v18+（构建时需要）
docker --version     # 需要 Docker
docker compose version  # 需要 Docker Compose V2

# 2. 下载部署脚本（如果还没有）
curl -L -O https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/raw/main/deploy.sh
chmod +x deploy.sh

# 3. 运行安装
sudo ./deploy.sh --mode docker

# 或使用交互式选择
sudo ./deploy.sh
# 然后选择 2) docker
```

# 脚本会自动：
# ✓ 检查依赖（缺少会提示安装方法）
# ✓ 下载并解压代码
# ✓ 安装 npm 依赖
# ✓ 构建 Docker 镜像并启动容器
# ? 询问是否配置 Nginx（推荐选择 y）
#   ✓ 安装 Nginx（如果没有，会询问）
#   ✓ 询问域名
#   ✓ 询问是否配置 HTTPS
#   ✓ 创建并启用 Nginx 配置
#   ✓ 重启 Nginx
```

### 版本更新

```bash
# 更新到最新版本
sudo ./deploy.sh --mode docker
```

### 方式二：手动部署

#### Nginx + pm2 模式

1. **下载 Release**
   ```bash
   # 从 GitHub Releases 下载
   wget https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/releases/latest/download/dist.tar.gz
   wget https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/releases/latest/download/backend.tar.gz
   ```

2. **解压文件**
   ```bash
   mkdir -p /var/www/Misaka-Blog-Framework
   tar -xzf dist.tar.gz -C /var/www/Misaka-Blog-Framework
   tar -xzf backend.tar.gz -C /var/www/Misaka-Blog-Framework
   ```

3. **安装依赖**
   ```bash
   cd /var/www/Misaka-Blog-Framework
   npm install --production
   ```

4. **配置 pm2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup  # 设置开机自启
   ```

5. **配置 Nginx**
   参考 `nginx.conf` 配置反向代理。

#### Docker 模式

1. **下载 Release**
   ```bash
   wget https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/releases/latest/download/dist.tar.gz
   wget https://github.com/MisakaMisaka10124/Misaka-Blog-Framework/releases/latest/download/backend.tar.gz
   ```

2. **解压文件**
   ```bash
   mkdir -p /var/www/Misaka-Blog-Framework
   tar -xzf dist.tar.gz -C /var/www/Misaka-Blog-Framework
   tar -xzf backend.tar.gz -C /var/www/Misaka-Blog-Framework
   ```

3. **启动服务**
   ```bash
   cd /var/www/Misaka-Blog-Framework
   docker compose up -d --build
   ```

## 部署架构

### Nginx + pm2 模式

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (端口 80/443)                       │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  静态文件请求    │  │   API 请求      │  │  图片请求   │ │
│  │  /assets/*      │  │   /api/*        │  │  /images/*  │ │
│  │  /favicon.ico   │  │                 │  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           ▼                    ▼                   ▼        │
│     直接返回              反向代理到          反向代理到     │
│     dist/ 文件          localhost:3000      localhost:3000   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Express 后端 (pm2 管理, 端口 3000)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/login    - 登录认证                            │   │
│  │  /api/posts    - 文章 CRUD                           │   │
│  │  /api/config   - 站点配置                            │   │
│  │  /api/visitor  - 访客统计                            │   │
│  │  ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /images/*     - 图片服务                            │   │
│  │  (avatars, backgrounds, friends, social, uploads)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    /var/www/Misaka-Blog-Framework/           │
│                                                             │
│  ├── backend/data/        ← 用户数据（持久化）              │
│  │   ├── config/          ← 服务器配置                      │
│  │   ├── images/          ← 图片资源                        │
│  │   ├── langrage/        ← 多语言配置                      │
│  │   └── posts/           ← 文章数据                        │
│  │                                                         │
│  ├── dist/                ← 前端构建产物                    │
│  └── node_modules/        ← npm 依赖                       │
└─────────────────────────────────────────────────────────────┘
```

### Docker 模式

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Nginx 宿主机 (端口 80/443) [可选]                 │
│                                                             │
│  静态文件请求        API 请求        图片请求               │
│  /assets/*          /api/*          /images/*               │
│      │                  │                │                  │
│      └──────────────────┼────────────────┘                  │
│                         │                                   │
│                         ▼                                   │
│               反向代理到 localhost:3000                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Docker 容器 (端口 3000)                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express 后端                                        │   │
│  │  - 处理 API 请求                                      │   │
│  │  - 服务静态文件 (dist/)                               │   │
│  │  - 服务图片 (/images/)                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Volume 挂载:                                               │
│  ./backend/data:/app/backend/data   ← 持久化用户数据        │
└─────────────────────────────────────────────────────────────┘

说明：
- 如果不配置 Nginx，用户直接访问 Docker 容器的 3000 端口
- 如果配置 Nginx，用户访问 80/443 端口，Nginx 反向代理到 3000
```

### 两种模式对比

| 特性 | Nginx + pm2 | Docker |
|------|-------------|--------|
| 性能 | ⭐⭐⭐ 更高（Nginx 处理静态文件） | ⭐⭐ 稍低 |
| 部署复杂度 | ⭐⭐ 需要配置 Nginx | ⭐⭐⭐ 更简单 |
| 资源占用 | ⭐⭐⭐ 更低 | ⭐⭐ 稍高 |
| 扩展性 | ⭐⭐ 需要额外配置 | ⭐⭐⭐ 更容易扩展 |
| 适用场景 | 单服务器、性能要求高 | 多服务器、需要容器化 |

---

## 配置说明

### 配置文件位置

部署完成后，所有配置文件位于：

```
/var/www/Misaka-Blog-Framework/backend/data/
├── config/
│   └── core_server_config.json    ← 服务器配置（重要！）
└── langrage/
    ├── site_config_zh_cn.json     ← 中文简体
    ├── site_config_zh_hk.json     ← 中文繁体
    └── site_config_en_us.json     ← English
```

### ⚠️ 首次部署必须修改的配置

#### 1. 服务器配置（必改）

```bash
nano /var/www/Misaka-Blog-Framework/backend/data/config/core_server_config.json
```

**必须修改的字段：**

```json
{
  "admin": {
    "username": "admin",           // ← 修改管理员用户名
    "password": "YOUR_PASSWORD"    // ← 修改管理员密码（必须改！）
  },
  "jwt": {
    "secret": "YOUR_JWT_SECRET"   // ← 修改 JWT 密钥（必须改！建议随机字符串）
  }
}
```

**可选修改的字段：**

```json
{
  "server": {
    "port": 3000                   // ← 服务端口（一般不用改）
  },
  "ai": {
    "base_url": "https://api.xxx.com/v1",  // ← AI API 地址
    "api_key": "sk-xxx",                    // ← AI API Key
    "model": "gpt-4"                        // ← AI 模型
  }
}
```

#### 2. 站点信息配置（建议修改）

```bash
# 根据你的语言选择一个编辑
nano /var/www/Misaka-Blog-Framework/backend/data/langrage/site_config_zh_cn.json
```

**主要字段：**

```json
{
  "siteTitle": "我的博客",                    // ← 站点标题
  "welcomeMessage": "欢迎来到我的博客！",      // ← 欢迎语
  "about": "关于我的简介",                    // ← 个人简介（首页显示）
  "socialLinks": [                           // ← 社交链接
    {"platform": "github", "url": "https://github.com/xxx"},
    {"platform": "email", "url": "your@email.com"}
  ],
  "footer": {
    "copyright": "2026 Your Name"            // ← 版权信息
  }
}
```

### 配置修改后

```bash
# 重启服务使配置生效
pm2 restart personal_web    # Nginx + pm2 模式
# 或
docker compose restart      # Docker 模式
```

### 全部配置项参考

#### core_server_config.json 完整说明

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `server.port` | number | 服务端口 | 3000 |
| `admin.username` | string | 管理员用户名 | admin |
| `admin.password` | string | 管理员密码 | （必须修改） |
| `jwt.secret` | string | JWT 签名密钥 | （必须修改） |
| `jwt.expires_in` | string | JWT 过期时间 | 24h |
| `ai.base_url` | string | AI API 地址 | - |
| `ai.api_key` | string | AI API Key | - |
| `ai.model` | string | AI 模型名称 | - |
| `display.homePostsPerPage` | number | 首页每页文章数 | 5 |
| `imageCompression.maxWidth` | number | 图片压缩最大宽度 | 1920 |
| `imageCompression.quality` | number | 图片压缩质量 | 0.82 |

## 常用命令

### Nginx + pm2 模式

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs personal_web

# 重启服务
pm2 restart personal_web

# 停止服务
pm2 stop personal_web

# 监控资源
pm2 monit
```

### Docker 模式

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build
```

## 发布新版本

### 自动构建（推荐）

1. 在 GitHub 上创建新的 Release
2. 创建 tag（格式：`v1.0.0`）
3. GitHub Actions 会自动构建并发布 `dist.tar.gz` 和 `backend.tar.gz`

### 手动构建

```bash
# 1. 更新 package.json 中的版本号
npm version patch  # 或 minor, major

# 2. 构建前端
npm run build

# 3. 打包
tar -czf dist.tar.gz dist/
tar -czf backend.tar.gz --exclude='backend/data' backend/ package.json package-lock.json ecosystem.config.js

# 4. 在 GitHub 上创建 Release 并上传文件
```

## 目录结构

```
/var/www/Misaka-Blog-Framework/
├── backend/                  # 后端代码
│   ├── data/                 # 持久化数据（不会被更新覆盖）
│   │   ├── config/           # 服务器配置
│   │   ├── images/           # 图片资源
│   │   ├── langrage/         # 多语言配置
│   │   └── posts/            # 文章数据
│   ├── middleware/            # 中间件
│   ├── routes/               # API 路由
│   ├── services/             # 业务逻辑
│   └── index.ts              # 入口文件
├── dist/                     # 前端构建产物
├── node_modules/             # npm 依赖
├── logs/                     # 日志文件
├── ecosystem.config.js       # pm2 配置
├── docker-compose.yml        # Docker 配置
├── Dockerfile                # Docker 镜像定义
├── .version                  # 当前版本记录
└── deploy.sh                 # 部署脚本
```

## 数据保护策略

### Release 包中的数据

| 数据类型 | 路径 | 来源 | 说明 |
|----------|------|------|------|
| 服务器配置 | `backend/data/config/core_server_config.json` | 从 example 复制 | 默认配置模板 |
| 语言配置 | `backend/data/langrage/site_config_*.json` | 从 example 复制 | 默认语言配置 |
| 社交图标 | `backend/data/images/social/*.svg` | 仓库原文件 | 12 个社交媒体图标 |
| 背景图片 | `backend/data/images/backgrounds/*.jpg` | 仓库原文件 | Hero 区域背景图 |
| 友链头像 | `backend/data/images/friends/*.jpg` | 仓库原文件 | 默认友链头像 |
| 默认头像 | `backend/data/images/avatars/*.jpg` | 仓库原文件 | 默认用户头像 |

### 更新时保护的数据（用户自定义）

| 数据类型 | 路径 | 说明 |
|----------|------|------|
| 服务器配置 | `backend/data/config/core_server_config.json` | 用户修改过的端口、账号、密钥等 |
| 访客统计 | `backend/data/config/visitor_stats.json` | 访客统计数据 |
| 语言配置 | `backend/data/langrage/site_config_*.json` | 用户自定义的站点标题、导航、友链等 |
| 文章数据 | `backend/data/posts/**/*.md` | 用户创建的所有文章 |
| 文章索引 | `backend/data/posts/post_index.json` | 自动生成的文章索引 |
| 标签数据 | `backend/data/posts/tags/*.json` | 文章标签 |
| 文章图片 | `backend/data/posts/*/images/` | 文章中的图片 |
| 用户上传 | `backend/data/images/uploads/` | 用户上传的图片 |
| pm2 配置 | `ecosystem.config.js` | pm2 进程配置 |
| 环境变量 | `.env` | 环境变量配置 |

### 更新流程

```
Release 包（默认配置）          用户服务器（自定义配置）
         │                              │
         │                              ▼
         │                     1. 备份用户数据
         ▼                              │
2. 解压新版本                           │
   （覆盖默认配置）                      │
         │                              ▼
         └────────────────────► 3. 恢复用户数据
                                （覆盖默认配置）
                                        │
                                        ▼
                                4. 最终结果
                                （保留用户自定义 + 更新代码）
```

### 首次安装 vs 更新

| 场景 | 配置文件 | 图片资源 |
|------|----------|----------|
| 首次安装 | 使用 Release 中的默认配置 | 使用 Release 中的默认图片 |
| 版本更新 | 保留用户自定义配置 | 更新默认图片（social、backgrounds 等） |

## 故障排查

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 权限问题

```bash
# 修复权限
sudo chown -R $USER:$USER /var/www/Misaka-Blog-Framework
chmod -R 755 /var/www/Misaka-Blog-Framework
```

### pm2 启动失败

```bash
# 查看详细日志
pm2 logs personal_web --lines 100

# 删除并重新启动
pm2 delete personal_web
pm2 start ecosystem.config.js
```

### Docker 构建失败

```bash
# 清理缓存
docker system prune -a

# 重新构建
docker compose build --no-cache
docker compose up -d
```

## 备份与恢复

### 备份数据

```bash
# 备份整个 data 目录
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/Misaka-Blog-Framework/backend/data/
```

### 恢复数据

```bash
# 停止服务
pm2 stop personal_web  # 或 docker compose down

# 恢复数据
tar -xzf backup_20260609.tar.gz -C /

# 启动服务
pm2 restart personal_web  # 或 docker compose up -d
```
