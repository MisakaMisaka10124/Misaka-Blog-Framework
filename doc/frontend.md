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
│   ├── Categories.vue      # 博客分类页（标签云+文章列表+分页）
│   ├── CategoryDetail.vue  # 标签详情页
│   ├── PostDetail.vue      # 文章详情页
│   ├── Search.vue          # 搜索页（标签筛选+分页）
│   ├── Upload.vue          # 文章管理页（需登录）
│   ├── Login.vue           # 登录页
│   ├── Friends.vue         # 友链页
│   └── About.vue           # 关于页
├── components/             # 通用组件
│   ├── GlassCard.vue       # 玻璃拟态卡片
│   ├── HeroHeader.vue      # 英雄头图
│   ├── PostCard.vue        # 文章卡片（含封面图）
│   ├── TagBadge.vue        # 标签徽章
│   ├── ThemeToggle.vue     # 主题切换
│   └── TocSidebar.vue      # 目录侧边栏
├── layout/                 # 布局组件
│   ├── AppLayout.vue       # 主布局（背景+导航+内容+页脚+光标）
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
  - 自定义光标跟随（`display` 控制可见性）
  - Flex 布局（sticky footer）
  - 英雄头图显示
  - 背景图片根据时间切换

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
  - 文章卡片列表（含封面图）
  - 分页器（页码按钮）

#### Categories.vue
- **功能**: 按标签浏览文章
- **内容**:
  - 标签云（链接到标签详情）
  - 最新文章列表（含封面图）
  - 分页器

#### PostDetail.vue
- **功能**: 文章详情展示
- **内容**:
  - 文章标题、日期、标签
  - Markdown 渲染内容
  - 代码高亮（highlight.js github-dark）
  - 目录侧边栏

#### Search.vue
- **功能**: 文章搜索
- **内容**:
  - 搜索输入框（300ms 防抖）
  - 标签筛选按钮
  - 搜索结果列表（含封面图）
  - 分页器

#### Upload.vue
- **功能**: 文章管理（需登录）
- **内容**:
  - 文章列表（编辑/删除）
  - Markdown 编辑器
  - 工具栏（加粗/斜体/标题/链接/图片/代码）
  - 标签管理（输入添加/点击删除/自动补全）
  - 封面图片上传
  - 图片上传（粘贴/点击）
  - 编辑时长统计

#### Login.vue
- **功能**: 用户登录
- **内容**:
  - 用户名/密码输入
  - 验证码显示和输入
  - 登录按钮
  - 错误提示

### 4. 通用组件

#### PostCard.vue
- **职责**: 文章卡片
- **内容**: 封面图、标题、日期、简介、标签
- **交互**: 点击跳转到文章详情
- **样式**: 封面图 200x140px，hover 放大效果

#### GlassCard.vue
- **职责**: 玻璃拟态卡片容器
- **特性**: 毛玻璃背景、圆角、边框

#### TagBadge.vue
- **职责**: 标签徽章
- **样式**: 圆角标签，可点击跳转

## 样式系统

### CSS 变量 (variables.css)

```css
:root {
  --color-accent: #3b82f6;
  --color-accent-hover: #60a5fa;
  --color-text-primary: #e0e0f0;
  --color-text-secondary: #b0b0c8;
  --color-text-muted: #8888a0;
  --glass-bg: rgba(20, 20, 40, 0.7);
  --glass-border: rgba(255, 255, 255, 0.12);
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --radius-sm: 6px;
  --radius-md: 12px;
  --transition-fast: 0.15s ease;
  --transition-smooth: 0.3s ease;
  --content-max-width: 1200px;
}
```

### 自定义光标

```css
.custom-cursor {
  position: fixed;
  width: 32px;
  height: 32px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  background-image: url('/images/cursor.png');
  background-size: 32px 32px;
  display: none;
}

@media (pointer: fine) {
  * { cursor: none !important; }
  .custom-cursor { display: block; }
}
```

## API 调用

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

// 上传文章（含封面）
const formData = new FormData()
formData.append('file', mdFile)
formData.append('tags', tags)
formData.append('cover', coverFile)
await axios.post('/api/posts/upload', formData)

// 更新文章（含封面）
const formData = new FormData()
formData.append('content', fullContent)
formData.append('cover', coverFile)
await axios.put(`/api/posts/${slug}`, formData)

// 删除文章
await axios.delete(`/api/posts/${slug}`)

// 上传图片
const formData = new FormData()
formData.append('image', imageFile)
formData.append('slug', slug)
await axios.post('/api/posts/upload-image', formData)
```

## 标签自动补全

Upload.vue 实现了标签自动补全功能：

1. **加载标签**: `loadAllTags()` 从 `/api/tags` 获取所有标签
2. **输入监听**: `onTagInput()` 根据输入过滤匹配的标签
3. **选择标签**: `selectTag(tag)` 将选中的标签添加到列表
4. **隐藏建议**: `hideTagSuggestions()` 延迟隐藏下拉列表

```typescript
const allTags = ref<string[]>([])
const tagSuggestions = ref<string[]>([])

function onTagInput() {
  const q = newTag.value.trim().toLowerCase()
  if (!q) { tagSuggestions.value = []; return }
  tagSuggestions.value = allTags.value
    .filter(t => t.toLowerCase().includes(q) && !editTags.value.includes(t))
    .slice(0, 8)
}

function selectTag(tag: string) {
  if (!editTags.value.includes(tag)) editTags.value.push(tag)
  newTag.value = ''
  tagSuggestions.value = []
}
```

## 图片处理

### 客户端压缩

```typescript
async function compressImage(file: File): Promise<File> {
  // Canvas API 压缩
  // 最大 1920px，JPEG 82% 质量
}
```

### 图片上传流程

1. 用户选择图片（点击/粘贴）
2. Canvas 压缩（最大 1920px，JPEG 82%）
3. FormData 上传到 `/api/posts/upload-image`
4. 后端存入 `images/{slug}/` 目录
5. 返回图片 URL
6. 插入 Markdown 图片语法 `![alt](url)`

## 开发调试

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npx tsc --noEmit     # TypeScript 检查
```
