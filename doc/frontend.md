# 前端开发文档

## 技术架构

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 8
- **语言**: TypeScript
- **样式**: CSS (Scoped) + CSS Variables
- **路由**: Vue Router 4
- **HTTP**: Axios

## 目录结构

```
src/
├── main.ts                 # 应用入口
├── App.vue                 # 根组件
├── env.d.ts                # 环境类型声明
├── views/                  # 页面组件
│   ├── Home.vue            # 首页（左栏+右栏布局）
│   ├── Categories.vue      # 博客分类页（标签云+文章列表）
│   ├── CategoryDetail.vue  # 标签详情页
│   ├── PostDetail.vue      # 文章详情页
│   ├── Search.vue          # 搜索页
│   ├── Upload.vue          # 文章管理页（需登录）
│   ├── Login.vue           # 登录页
│   ├── Friends.vue         # 友链页
│   └── About.vue           # 关于页
├── components/             # 通用组件
│   ├── GlassCard.vue       # 玻璃拟态卡片
│   ├── HeroHeader.vue      # 英雄头图
│   ├── PostCard.vue        # 文章卡片
│   ├── TagBadge.vue        # 标签徽章
│   ├── ThemeToggle.vue     # 主题切换
│   └── TocSidebar.vue      # 目录侧边栏
├── layout/                 # 布局组件
│   ├── AppLayout.vue       # 主布局（导航+内容+页脚）
│   ├── Navbar.vue          # 导航栏
│   └── Footer.vue          # 页脚
├── router/                 # 路由配置
│   └── index.ts            # 路由定义
├── assets/                 # 静态资源
│   ├── cursor.png          # 自定义光标图片
│   └── styles/             # 全局样式
│       ├── variables.css   # CSS 变量
│       ├── base.css        # 基础样式
│       ├── colors.css      # 颜色主题
│       └── typography.css  # 排版样式
└── types/                  # TypeScript 类型
    └── index.ts            # 类型定义
```

## 核心模块

### 1. 路由系统 (router/index.ts)

**路由配置**:
```typescript
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/categories', name: 'categories', component: Categories },
  { path: '/categories/:tag', name: 'category-detail', component: CategoryDetail },
  { path: '/post/:slug', name: 'post-detail', component: PostDetail },
  { path: '/search', name: 'search', component: Search },
  { path: '/upload', name: 'upload', component: Upload, beforeEnter: authGuard },
  { path: '/login', name: 'login', component: Login },
  { path: '/friends', name: 'friends', component: Friends },
  { path: '/about', name: 'about', component: About },
]
```

**路由守卫**: `/upload` 页面需要 JWT 认证，未登录时重定向到 `/login`

### 2. 布局系统 (layout/)

#### AppLayout.vue
- **职责**: 主布局容器
- **功能**:
  - 加载站点配置
  - 自定义光标跟随
  - Flex 布局（sticky footer）
  - 英雄头图显示

#### Navbar.vue
- **职责**: 顶部导航栏
- **功能**:
  - 站点标题显示
  - 导航链接（右对齐）
  - 语言切换（中/EN/繁）
  - 搜索按钮
  - 移动端菜单

#### Footer.vue
- **职责**: 页脚
- **功能**:
  - 版权信息
  - ICP 备案号（可点击跳转工信部）

### 3. 页面组件

#### Home.vue
- **布局**: 左栏（个人信息）+ 右栏（文章列表）
- **左栏**:
  - 头像
  - 姓名/签名
  - 个人简介（text-indent: 2em）
  - 入口链接（博客/友链/关于）
  - 社交图标
- **右栏**:
  - 文章卡片列表
  - 分页器（页码按钮）

#### Categories.vue
- **功能**: 按标签浏览文章
- **内容**:
  - 标签云（链接到标签详情）
  - 最新文章列表
  - 分页器

#### PostDetail.vue
- **功能**: 文章详情展示
- **内容**:
  - 文章标题、日期、标签
  - Markdown 渲染内容
  - 代码高亮
  - 目录侧边栏

#### Search.vue
- **功能**: 文章搜索
- **内容**:
  - 搜索输入框（300ms 防抖）
  - 标签筛选按钮
  - 搜索结果列表
  - 分页器

#### Upload.vue
- **功能**: 文章管理（需登录）
- **内容**:
  - 文章列表（编辑/删除）
  - Markdown 编辑器
  - 工具栏（加粗/斜体/标题/链接/图片/代码）
  - 标签管理（输入添加/点击删除）
  - 图片上传（粘贴/点击）
  - 编辑时长统计

#### Login.vue
- **功能**: 用户登录
- **内容**:
  - 用户名/密码输入
  - 验证码显示和输入
  - 登录按钮
  - 错误提示

#### Friends.vue
- **功能**: 友情链接展示
- **内容**:
  - 友链卡片列表
  - 头像、名称、描述、链接

#### About.vue
- **功能**: 关于页面
- **内容**:
  - 从配置文件加载内容

### 4. 通用组件

#### GlassCard.vue
- **职责**: 玻璃拟态卡片容器
- **特性**: 毛玻璃背景、圆角、边框

#### PostCard.vue
- **职责**: 文章卡片
- **内容**: 标题、日期、简介、标签
- **交互**: 点击跳转到文章详情

#### TagBadge.vue
- **职责**: 标签徽章
- **样式**: 圆角标签，可点击

#### ThemeToggle.vue
- **职责**: 主题切换按钮
- **功能**: 切换深色/浅色模式

#### TocSidebar.vue
- **职责**: 文章目录侧边栏
- **功能**: 自动提取 H2/H3 生成目录

#### HeroHeader.vue
- **职责**: 英雄头图
- **功能**: 根据时间切换背景图片

## 样式系统

### CSS 变量 (variables.css)

```css
:root {
  /* 颜色 */
  --color-accent: #3b82f6;
  --color-accent-hover: #60a5fa;
  --color-text-primary: #e0e0f0;
  --color-text-secondary: #b0b0c8;
  --color-text-muted: #8888a0;
  
  /* 玻璃效果 */
  --glass-bg: rgba(20, 20, 40, 0.7);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  /* 间距 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  
  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-smooth: 0.3s ease;
  
  /* 内容宽度 */
  --content-max-width: 1200px;
}
```

### 主题切换

- **实现**: `data-theme` 属性切换
- **存储**: localStorage
- **检测**: `prefers-color-scheme` 媒体查询

### 响应式断点

- **桌面端**: > 900px（双栏布局）
- **移动端**: <= 900px（单栏布局）

## API 调用

### Axios 配置

```typescript
import axios from 'axios'

// 基础配置
axios.defaults.baseURL = '/api'

// 请求拦截器（添加 JWT）
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('upload_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### 主要 API 调用

```typescript
// 获取站点配置
const { data } = await axios.get('/api/config', { params: { lang } })

// 获取文章索引
const { data } = await axios.get('/api/posts/index')

// 搜索文章
const { data } = await axios.get('/api/posts/search', { params: { q, tag } })

// 获取文章详情
const { data } = await axios.get(`/api/posts/${slug}`)

// 上传文章
const formData = new FormData()
formData.append('file', mdFile)
formData.append('tags', tags)
await axios.post('/api/posts/upload', formData)

// 更新文章
await axios.put(`/api/posts/${slug}`, { content })

// 删除文章
await axios.delete(`/api/posts/${slug}`)

// 上传图片
const formData = new FormData()
formData.append('image', imageFile)
const { data } = await axios.post('/api/posts/upload-image', formData)
```

## 图片处理

### 客户端压缩

```typescript
async function compressImage(file: File): Promise<Blob> {
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await new Promise(resolve => img.onload = resolve)
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  let width = img.width
  let height = img.height
  
  // 最大 1920px
  if (width > 1920) {
    height = (1920 / width) * height
    width = 1920
  }
  
  canvas.width = width
  canvas.height = height
  ctx.drawImage(img, 0, 0, width, height)
  
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82)
  })
}
```

### 图片上传流程

1. 用户选择图片（点击/粘贴）
2. Canvas 压缩（最大 1920px，JPEG 82%）
3. FormData 上传到 `/api/posts/upload-image`
4. 返回图片 URL
5. 插入 Markdown 图片语法 `![alt](url)`

## 国际化

### 实现方式

- 配置文件: `site_config_{lang}.json`
- 语言切换: localStorage 存储语言选择
- 加载逻辑: 根据语言参数加载对应配置文件

### 支持语言

- `zh_cn`: 中文简体
- `zh_hk`: 中文繁体
- `en_us`: English

## 自定义光标

### 实现

```typescript
const cursor = ref<HTMLElement | null>(null)

function updateCursor(e: MouseEvent) {
  if (cursor.value) {
    cursor.value.style.left = `${e.clientX}px`
    cursor.value.style.top = `${e.clientY}px`
    cursor.value.style.opacity = '1'
  }
}

function hideCursor() {
  if (cursor.value) {
    cursor.value.style.opacity = '0'
  }
}
```

### CSS

```css
.custom-cursor {
  position: fixed;
  width: 32px;
  height: 32px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  background-image: url('/images/cursor.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 0.15s ease;
}

@media (pointer: fine) {
  .app-layout, .app-layout a, .app-layout button {
    cursor: none;
  }
}
```

## 开发调试

### 启动开发服务器

```bash
npm run dev
```

### 构建检查

```bash
npm run build
```

### TypeScript 检查

```bash
npx tsc --noEmit
```

## 性能优化

- **路由懒加载**: 所有页面组件使用动态 import
- **图片压缩**: 客户端压缩后再上传
- **防抖搜索**: 300ms 防抖避免频繁请求
- **分页加载**: 文章列表分页显示
- **CSS 变量**: 统一管理样式，便于主题切换
