#!/bin/bash

# =============================================================================
# Misaka Blog Framework 部署/更新脚本
# 用法: ./deploy.sh [选项]
#   --mode <nginx|docker>    部署模式（默认: nginx）
#   --version <版本号>       指定版本（默认: 最新版本）
#   --path <安装路径>        安装路径（默认: /var/www/Misaka-Blog-Framework）
#   --help                   显示帮助信息
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' 

# 默认配置
DEFAULT_INSTALL_PATH="/var/www/Misaka-Blog-Framework"
DEFAULT_MODE="nginx"
REPO_OWNER="MisakaMisaka10124"
REPO_NAME="Misaka-Blog-Framework"
PM2_APP_NAME="personal_web"

# 工具函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 版本比较：返回 0 如果 $1 > $2
version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# 显示帮助信息
show_help() {
    cat << EOF
Misaka Blog Framework 部署/更新脚本

用法: ./deploy.sh [选项]

选项:
  --mode <nginx|docker>    部署模式（默认: nginx）
  --version <版本号>       指定版本，如 v1.0.0（默认: 最新版本）
  --path <安装路径>        安装路径（默认: /var/www/Misaka-Blog-Framework）
  --help                   显示此帮助信息

示例:
  # 首次安装最新版本（Nginx + pm2 模式）
  ./deploy.sh --mode nginx

  # 更新到指定版本
  ./deploy.sh --mode nginx --version v1.2.0

  # Docker 模式安装
  ./deploy.sh --mode docker

  # 自定义安装路径
  ./deploy.sh --path /opt/my-blog --mode nginx

EOF
    exit 0
}

# 环境检查

check_dependencies() {
    local mode=$1

    log_info "检查系统依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo ""
        log_error "未找到 Node.js

请先安装 Node.js >= 18:

  Ubuntu/Debian:
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs

  CentOS/RHEL:
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs

  Arch Linux:
    sudo pacman -S nodejs npm

  macOS:
    brew install node
"
    fi

    local node_version=$(node -v | sed 's/v//')
    local node_major=$(echo "$node_version" | cut -d. -f1)
    if [ "$node_major" -lt 18 ]; then
        log_error "Node.js 版本过低: v$node_version，需要 >= 18"
    fi
    log_success "Node.js v$node_version"

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "未找到 npm，请重新安装 Node.js"
    fi
    log_success "npm $(npm -v)"

    # 检查 curl
    if ! command -v curl &> /dev/null; then
        echo ""
        log_error "未找到 curl

请先安装 curl:

  Ubuntu/Debian: sudo apt install -y curl
  CentOS/RHEL:   sudo yum install -y curl
  Arch Linux:    sudo pacman -S curl
  macOS:         brew install curl
"
    fi
    log_success "curl 已安装"

    # 检查 tar
    if ! command -v tar &> /dev/null; then
        echo ""
        log_error "未找到 tar

请先安装 tar:

  Ubuntu/Debian: sudo apt install -y tar
  CentOS/RHEL:   sudo yum install -y tar
  Arch Linux:    sudo pacman -S tar
  macOS:         已预装
"
    fi
    log_success "tar 已安装"

    # 根据模式检查特定依赖
    if [ "$mode" = "nginx" ]; then
        # 检查 pm2（自动安装）
        if ! command -v pm2 &> /dev/null; then
            log_warn "未找到 pm2，正在自动安装..."
            npm install -g pm2
            if [ $? -ne 0 ]; then
                log_error "pm2 安装失败，请手动运行: npm install -g pm2"
            fi
            log_success "pm2 已安装"
        else
            log_success "pm2 $(pm2 -v)"
        fi
    elif [ "$mode" = "docker" ]; then
        # 检查 docker
        if ! command -v docker &> /dev/null; then
            echo ""
            log_error "未找到 Docker

请先安装 Docker:

  Ubuntu/Debian:
    sudo apt install -y docker.io docker-compose-plugin
    sudo usermod -aG docker \$USER
    # 重新登录以使 docker 组生效

  CentOS/RHEL:
    sudo yum install -y docker docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker \$USER

  Arch Linux:
    sudo pacman -S docker docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker \$USER

  macOS:
    brew install --cask docker
    # 然后启动 Docker Desktop 应用
"
        fi
        log_success "docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

        # 检查 docker compose
        if ! docker compose version &> /dev/null; then
            echo ""
            log_error "未找到 Docker Compose V2

Docker Compose V2 已包含在 Docker 中，请确保安装了最新版本的 Docker。

或者单独安装:
  sudo apt install -y docker-compose-plugin  # Ubuntu/Debian
  sudo yum install -y docker-compose-plugin  # CentOS/RHEL
"
        fi
        log_success "docker compose 已安装"
    fi

    log_success "所有依赖检查通过"
}

# =============================================================================
# GitHub API 函数
# =============================================================================

get_latest_version() {
    log_info "获取最新版本信息..."

    local response=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest")

    if echo "$response" | grep -q '"message": "Not Found"'; then
        log_error "未找到 Release，请先在 GitHub 上发布版本"
    fi

    local version=$(echo "$response" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

    if [ -z "$version" ]; then
        log_error "无法解析版本号，API 响应: $response"
    fi

    echo "$version"
}

get_current_version() {
    local install_path=$1
    local version_file="${install_path}/.version"

    if [ -f "$version_file" ]; then
        cat "$version_file"
    else
        echo "none"
    fi
}

save_version() {
    local install_path=$1
    local version=$2
    echo "$version" > "${install_path}/.version"
}

# =============================================================================
# 下载函数
# =============================================================================

download_release() {
    local version=$1
    local download_dir=$2

    log_info "下载版本 ${version}..."

    local base_url="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${version}"

    # 下载校验文件
    log_info "下载校验文件 (checksums-sha256.txt)..."
    curl -L -o "${download_dir}/checksums-sha256.txt" "${base_url}/checksums-sha256.txt"
    if [ $? -ne 0 ]; then
        log_error "下载校验文件失败"
    fi

    # 下载 dist.tar.gz
    log_info "下载前端文件 (dist.tar.gz)..."
    curl -L -o "${download_dir}/dist.tar.gz" "${base_url}/dist.tar.gz"
    if [ $? -ne 0 ]; then
        log_error "下载 dist.tar.gz 失败"
    fi

    # 下载 backend.tar.gz
    log_info "下载后端文件 (backend.tar.gz)..."
    curl -L -o "${download_dir}/backend.tar.gz" "${base_url}/backend.tar.gz"
    if [ $? -ne 0 ]; then
        log_error "下载 backend.tar.gz 失败"
    fi

    # SHA256 校验
    log_info "校验文件完整性..."
    cd "$download_dir"
    if sha256sum -c checksums-sha256.txt 2>/dev/null; then
        log_success "SHA256 校验通过"
    else
        log_error "SHA256 校验失败！文件可能被篡改或下载不完整"
    fi

    log_success "下载完成"
}

# =============================================================================
# 安装函数
# =============================================================================

fresh_install() {
    local install_path=$1
    local mode=$2
    local version=$3
    local download_dir=$4

    log_info "执行全新安装..."

    # 创建目录
    mkdir -p "$install_path"

    # 解压 dist
    log_info "解压前端文件..."
    tar -xzf "${download_dir}/dist.tar.gz" -C "$install_path"

    # 解压 backend
    log_info "解压后端文件..."
    tar -xzf "${download_dir}/backend.tar.gz" -C "$install_path"

    # 安装依赖
    log_info "安装 npm 依赖..."
    cd "$install_path"
    npm install --production
    if [ $? -ne 0 ]; then
        log_error "npm install 失败"
    fi
    log_success "依赖安装完成"

    # 根据模式配置服务
    if [ "$mode" = "nginx" ]; then
        setup_pm2 "$install_path"
    elif [ "$mode" = "docker" ]; then
        setup_docker "$install_path"
    fi

    # 保存版本号
    save_version "$install_path" "$version"

    log_success "安装完成！版本: $version"
}

# =============================================================================
# 更新函数
# =============================================================================

update_version() {
    local install_path=$1
    local mode=$2
    local version=$3
    local download_dir=$4

    log_info "执行版本更新..."

    # 停止服务
    stop_services "$install_path" "$mode"

    # 备份用户数据（只备份用户可能修改过的文件）
    local backup_dir="${download_dir}/user_data_backup"
    mkdir -p "$backup_dir"

    log_info "备份用户数据..."

    # 备份服务器配置（用户自定义的配置）
    if [ -f "${install_path}/backend/data/config/core_server_config.json" ]; then
        cp "${install_path}/backend/data/config/core_server_config.json" "$backup_dir/"
    fi
    if [ -f "${install_path}/backend/data/config/visitor_stats.json" ]; then
        cp "${install_path}/backend/data/config/visitor_stats.json" "$backup_dir/"
    fi

    # 备份语言配置（用户自定义的，不是 example）
    for lang in zh_cn zh_hk en_us; do
        if [ -f "${install_path}/backend/data/langrage/site_config_${lang}.json" ]; then
            cp "${install_path}/backend/data/langrage/site_config_${lang}.json" "$backup_dir/"
        fi
    done

    # 备份文章和标签
    if [ -d "${install_path}/backend/data/posts" ]; then
        mkdir -p "$backup_dir/posts"
        # 备份文章 markdown 文件（兼容 macOS，不使用 cp --parents）
        find "${install_path}/backend/data/posts" -name "*.md" | while read file; do
            relpath="${file#${install_path}/backend/data/posts/}"
            mkdir -p "$backup_dir/posts/$(dirname "$relpath")"
            cp "$file" "$backup_dir/posts/$relpath"
        done
        # 备份文章索引和标签
        cp "${install_path}/backend/data/posts/post_index.json" "$backup_dir/posts/" 2>/dev/null || true
        cp -r "${install_path}/backend/data/posts/tags" "$backup_dir/posts/" 2>/dev/null || true
        # 备份文章图片
        cp -r "${install_path}/backend/data/posts/images" "$backup_dir/posts/" 2>/dev/null || true
        # 备份月份目录下的图片
        for month_dir in "${install_path}/backend/data/posts"/*/; do
            if [ -d "${month_dir}images" ]; then
                local month_name=$(basename "$month_dir")
                mkdir -p "$backup_dir/posts/${month_name}"
                cp -r "${month_dir}images" "$backup_dir/posts/${month_name}/"
            fi
        done
    fi

    # 备份用户上传的图片
    if [ -d "${install_path}/backend/data/images/uploads" ]; then
        mkdir -p "$backup_dir/images"
        cp -r "${install_path}/backend/data/images/uploads" "$backup_dir/images/"
    fi

    # 备份 ecosystem.config.js 和 .env
    if [ -f "${install_path}/ecosystem.config.js" ]; then
        cp "${install_path}/ecosystem.config.js" "$backup_dir/"
    fi
    if [ -f "${install_path}/.env" ]; then
        cp "${install_path}/.env" "$backup_dir/"
    fi

    log_success "用户数据备份完成"

    # 解压新版本（包含默认配置和初始化数据）
    log_info "更新前端文件..."
    tar -xzf "${download_dir}/dist.tar.gz" -C "$install_path"

    log_info "更新后端文件..."
    tar -xzf "${download_dir}/backend.tar.gz" -C "$install_path"

    # 恢复用户数据（覆盖新版本中的默认配置）
    log_info "恢复用户数据..."

    # 恢复服务器配置
    if [ -f "$backup_dir/core_server_config.json" ]; then
        cp "$backup_dir/core_server_config.json" "${install_path}/backend/data/config/"
    fi
    if [ -f "$backup_dir/visitor_stats.json" ]; then
        cp "$backup_dir/visitor_stats.json" "${install_path}/backend/data/config/"
    fi

    # 恢复语言配置
    for lang in zh_cn zh_hk en_us; do
        if [ -f "$backup_dir/site_config_${lang}.json" ]; then
            cp "$backup_dir/site_config_${lang}.json" "${install_path}/backend/data/langrage/"
        fi
    done

    # 恢复文章和标签
    if [ -d "$backup_dir/posts" ]; then
        # 恢复文章 markdown
        find "$backup_dir/posts" -name "*.md" -exec sh -c '
            file="$0"
            relpath="${file#'"$backup_dir"'/posts/}"
            dest="'"$install_path"'/backend/data/posts/$relpath"
            mkdir -p "$(dirname "$dest")"
            cp "$file" "$dest"
        ' {} \;
        # 恢复索引和标签
        cp "$backup_dir/posts/post_index.json" "${install_path}/backend/data/posts/" 2>/dev/null || true
        cp -r "$backup_dir/posts/tags" "${install_path}/backend/data/posts/" 2>/dev/null || true
        # 恢复文章图片
        cp -r "$backup_dir/posts/images" "${install_path}/backend/data/posts/" 2>/dev/null || true
        # 恢复月份目录下的图片
        for month_dir in "$backup_dir/posts"/*/; do
            if [ -d "${month_dir}images" ]; then
                local month_name=$(basename "$month_dir")
                mkdir -p "${install_path}/backend/data/posts/${month_name}"
                cp -r "${month_dir}images" "${install_path}/backend/data/posts/${month_name}/"
            fi
        done
    fi

    # 恢复用户上传的图片
    if [ -d "$backup_dir/images/uploads" ]; then
        mkdir -p "${install_path}/backend/data/images"
        cp -r "$backup_dir/images/uploads" "${install_path}/backend/data/images/"
    fi

    # 恢复 ecosystem.config.js 和 .env
    if [ -f "$backup_dir/ecosystem.config.js" ]; then
        cp "$backup_dir/ecosystem.config.js" "$install_path/"
    fi
    if [ -f "$backup_dir/.env" ]; then
        cp "$backup_dir/.env" "$install_path/"
    fi

    log_success "用户数据恢复完成"

    # 更新依赖
    log_info "更新 npm 依赖..."
    cd "$install_path"
    npm install --production
    if [ $? -ne 0 ]; then
        log_error "npm install 失败"
    fi
    log_success "依赖更新完成"

    # 启动服务
    start_services "$install_path" "$mode"

    # 保存版本号
    save_version "$install_path" "$version"

    log_success "更新完成！版本: $version"
}

# =============================================================================
# 服务管理函数
# =============================================================================

setup_pm2() {
    local install_path=$1
    local is_update=${2:-false}

    log_info "配置 pm2..."

    # 创建 ecosystem.config.js（如果不存在）
    if [ ! -f "${install_path}/ecosystem.config.js" ]; then
        cat > "${install_path}/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '${PM2_APP_NAME}',
    script: 'tsx',
    args: 'backend/index.ts',
    cwd: '${install_path}',
    env: {
      NODE_ENV: 'production'
    },
    // 日志配置
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // 自动重启配置
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    // 重启延迟
    restart_delay: 3000,
    // 最大重启次数
    max_restarts: 10
  }]
}
EOF
        log_success "已创建 pm2 配置文件"
    fi

    # 创建日志目录
    mkdir -p "${install_path}/logs"

    # 启动服务
    cd "$install_path"
    pm2 start ecosystem.config.js
    pm2 save

    # 设置开机自启
    pm2 startup 2>/dev/null || true

    log_success "pm2 服务已启动"

    # 只有首次部署才询问是否配置 Nginx
    if [ "$is_update" = false ]; then
        ask_nginx_config "$install_path"
    fi
}

ask_nginx_config() {
    local install_path=$1

    echo ""
    log_info "=========================================="
    log_info "Nginx 反向代理配置"
    log_info "=========================================="
    echo ""
    echo "后端已启动在 localhost:3000"
    echo "如需通过域名访问，需要配置 Nginx 反向代理。"
    echo ""

    read -p "是否现在配置 Nginx？(y/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_nginx "$install_path"
    else
        echo ""
        log_info "跳过 Nginx 配置"
        echo ""
        echo "如需手动配置，请执行："
        echo ""
        echo "  # 1. 安装 Nginx（如果没有）"
        echo "  sudo apt install nginx"
        echo ""
        echo "  # 2. 复制配置文件"
        echo "  sudo cp ${install_path}/nginx.conf /etc/nginx/sites-available/misaka-blog"
        echo ""
        echo "  # 3. 修改配置（替换域名）"
        echo "  sudo nano /etc/nginx/sites-available/misaka-blog"
        echo ""
        echo "  # 4. 启用站点"
        echo "  sudo ln -s /etc/nginx/sites-available/misaka-blog /etc/nginx/sites-enabled/"
        echo ""
        echo "  # 5. 测试并重启"
        echo "  sudo nginx -t && sudo systemctl restart nginx"
        echo ""
    fi
}

setup_nginx() {
    local install_path=$1

    log_info "配置 Nginx..."

    # 检查 Nginx 是否安装
    if ! command -v nginx &> /dev/null; then
        log_warn "未找到 Nginx"
        read -p "是否安装 Nginx？(y/N) " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "正在安装 Nginx..."
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y nginx
            elif command -v yum &> /dev/null; then
                sudo yum install -y nginx
            elif command -v dnf &> /dev/null; then
                sudo dnf install -y nginx
            else
                log_error "无法自动安装 Nginx，请手动安装"
            fi
            log_success "Nginx 安装完成"
        else
            log_info "跳过 Nginx 配置"
            return
        fi
    fi

    # 询问域名
    echo ""
    read -p "请输入你的域名（如 example.com）: " domain
    if [ -z "$domain" ]; then
        log_warn "未输入域名，使用默认配置"
        domain="localhost"
    fi

    # 询问是否配置 HTTPS
    local use_https=false
    echo ""
    read -p "是否配置 HTTPS（需要域名已解析）？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        use_https=true
    fi

    # 创建 Nginx 配置
    local nginx_config="/etc/nginx/sites-available/misaka-blog"

    if [ "$use_https" = true ]; then
        # HTTPS 配置
        sudo tee "$nginx_config" > /dev/null << EOF
server {
    listen 80;
    server_name ${domain};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    # SSL 证书（需要先用 certbot 申请）
    # ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    # 前端静态文件
    root ${install_path}/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # 前端路由（SPA 回退）
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 图片资源代理
    location /images/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }

    # Swagger 文档代理
    location /api-docs/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        log_success "Nginx HTTPS 配置已创建"
        echo ""
        log_warn "注意：需要使用 certbot 申请 SSL 证书"
        echo "  sudo certbot --nginx -d ${domain}"
        echo ""
    else
        # HTTP 配置
        sudo tee "$nginx_config" > /dev/null << EOF
server {
    listen 80;
    server_name ${domain};

    # 前端静态文件
    root ${install_path}/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # 前端路由（SPA 回退）
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 图片资源代理
    location /images/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }

    # Swagger 文档代理
    location /api-docs/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
        log_success "Nginx HTTP 配置已创建"
    fi

    # 启用站点
    if [ ! -f "/etc/nginx/sites-enabled/misaka-blog" ]; then
        sudo ln -s "$nginx_config" /etc/nginx/sites-enabled/
    fi

    # 删除默认站点（如果存在）
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        sudo rm /etc/nginx/sites-enabled/default
    fi

    # 测试配置
    log_info "测试 Nginx 配置..."
    if sudo nginx -t; then
        sudo systemctl restart nginx
        log_success "Nginx 配置完成并已重启"
        echo ""
        echo "现在可以通过 http://${domain} 访问网站"
        if [ "$use_https" = true ]; then
            echo "HTTPS 需要先申请证书：sudo certbot --nginx -d ${domain}"
        fi
    else
        log_error "Nginx 配置测试失败，请检查配置"
    fi
}

setup_docker() {
    local install_path=$1
    local is_update=${2:-false}

    log_info "配置 Docker..."

    # docker-compose.yml 应该已经包含在 release 中
    # 如果不存在，创建一个默认的
    if [ ! -f "${install_path}/docker-compose.yml" ]; then
        cat > "${install_path}/docker-compose.yml" << EOF
services:
  personal-web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./backend/data:/app/backend/data
    restart: unless-stopped
EOF
        log_success "已创建 docker-compose.yml"
    fi

    # 构建并启动
    cd "$install_path"
    docker compose up -d --build

    log_success "Docker 服务已启动"

    # 只有首次部署才询问是否配置 Nginx
    if [ "$is_update" = false ]; then
        ask_nginx_config "$install_path"
    fi
}

stop_services() {
    local install_path=$1
    local mode=$2

    log_info "停止服务..."

    if [ "$mode" = "nginx" ]; then
        if command -v pm2 &> /dev/null; then
            pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
            log_success "pm2 服务已停止"
        fi
    elif [ "$mode" = "docker" ]; then
        if [ -f "${install_path}/docker-compose.yml" ]; then
            cd "$install_path"
            docker compose down 2>/dev/null || true
            log_success "Docker 服务已停止"
        fi
    fi
}

start_services() {
    local install_path=$1
    local mode=$2

    log_info "启动服务..."

    if [ "$mode" = "nginx" ]; then
        cd "$install_path"
        if pm2 list | grep -q "$PM2_APP_NAME"; then
            pm2 restart "$PM2_APP_NAME"
        else
            pm2 start ecosystem.config.js
        fi
        pm2 save
        log_success "pm2 服务已启动"
    elif [ "$mode" = "docker" ]; then
        cd "$install_path"
        docker compose up -d
        log_success "Docker 服务已启动"
    fi
}

# =============================================================================
# 主函数
# =============================================================================

main() {
    # 解析命令行参数
    local mode="$DEFAULT_MODE"
    local version=""
    local install_path="$DEFAULT_INSTALL_PATH"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --mode)
                mode="$2"
                shift 2
                ;;
            --version)
                version="$2"
                shift 2
                ;;
            --path)
                install_path="$2"
                shift 2
                ;;
            --help)
                show_help
                ;;
            *)
                log_error "未知参数: $1\n使用 --help 查看帮助"
                ;;
        esac
    done

    # 验证模式
    if [ "$mode" != "nginx" ] && [ "$mode" != "docker" ]; then
        log_error "无效的部署模式: $mode，支持 nginx 或 docker"
    fi

    echo "============================================"
    echo "  Misaka Blog Framework 部署脚本"
    echo "============================================"
    echo ""
    log_info "部署模式: $mode"
    log_info "安装路径: $install_path"
    echo ""

    # 检查依赖
    check_dependencies "$mode"

    # 获取版本信息
    if [ -z "$version" ]; then
        version=$(get_latest_version)
        log_info "最新版本: $version"
    else
        log_info "指定版本: $version"
    fi

    # 检查是否已安装
    local current_version=$(get_current_version "$install_path")
    local is_update=false

    if [ "$current_version" != "none" ]; then
        is_update=true
        log_info "当前版本: $current_version"

        # 检查是否需要更新
        if [ "$current_version" = "$version" ]; then
            log_warn "当前已经是最新版本 $version，无需更新"
            exit 0
        fi

        if version_gt "$current_version" "$version"; then
            log_warn "当前版本 $current_version 比目标版本 $version 更新"
            read -p "是否继续降级？(y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "已取消操作"
                exit 0
            fi
        fi
    else
        log_info "检测到全新安装"
    fi

    # 创建临时下载目录
    local download_dir=$(mktemp -d)
    trap "rm -rf $download_dir" EXIT

    # 下载 release
    download_release "$version" "$download_dir"

    # 执行安装或更新
    if [ "$is_update" = true ]; then
        update_version "$install_path" "$mode" "$version" "$download_dir"
    else
        fresh_install "$install_path" "$mode" "$version" "$download_dir"
    fi

    echo ""
    echo "============================================"
    log_success "部署完成！"
    echo "============================================"
    echo ""
    log_info "安装路径: $install_path"
    log_info "版本: $version"
    log_info "模式: $mode"

    if [ "$mode" = "nginx" ]; then
        echo ""
        log_info "常用命令:"
        echo "  查看状态: pm2 status"
        echo "  查看日志: pm2 logs $PM2_APP_NAME"
        echo "  重启服务: pm2 restart $PM2_APP_NAME"
        echo "  停止服务: pm2 stop $PM2_APP_NAME"
    elif [ "$mode" = "docker" ]; then
        echo ""
        log_info "常用命令:"
        echo "  查看状态: docker compose ps"
        echo "  查看日志: docker compose logs -f"
        echo "  重启服务: docker compose restart"
        echo "  停止服务: docker compose down"
    fi
}

# 运行主函数
main "$@"
