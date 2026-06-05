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
├── views/                  # 页面组件
│   ├── Home.vue            # 首页（左栏+右栏布局）
│   ├── Categories.vue      # 博客分类页（标签云+文章列表+分页）
│   ├── CategoryDetail.vue  # 标签详情页
│   ├── PostDetail.vue      # 文章详情页（Markdown 渲染+TOC）
│   ├── Search.vue          # 搜索页（标签筛选+分页）
│   ├── Upload.vue          # 文章管理页（Code/Preview 编辑器）
│   ├── Login.vue           # 登录页
│   ├── Friends.vue         # 友链页
│   ├── About.vue           # 关于页
│   └── NotFound.vue        # 404 页面
├── components/             # 通用组件
│   ├── GlassCard.vue       # 玻璃拟态卡片
│   ├── HeroHeader.vue      # 英雄头图
│   ├── PostCard.vue        # 文章卡片（含封面图）
│   ├── TagBadge.vue        # 标签徽章
│   ├── ThemeToggle.vue     # 主题切换
│   └── TocSidebar.vue      # 目录侧边栏
├── layout/                 # 布局组件
│   ├── AppLayout.vue       # 主布局（背景+导航+内容+页脚+光标）
│   ├── Navbar.vue          # 导航栏（语言切换+搜索）
│   └── Footer.vue          # 页脚（版权+ICP）
├── router/                 # 路由配置
├── assets/                 # 静态资源
│   └── styles/             # 全局样式
│       ├── variables.css   # CSS 变量（深色/浅色主题）
│       ├── base.css        # 基础样式 + 背景系统
│       ├── colors.css      # 颜色主题
│       └── typography.css  # 排版样式
└── types/                  # TypeScript 类型
```

## 路由系统

```typescript
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/categories', name: 'categories', component: Categories },
  { path: '/categories/:tag', name: 'category-detail', component: CategoryDetail },
  { path: '/post/:slug', name: 'post', component: PostDetail },
  { path: '/search', name: 'search', component: Search },
  { path: '/upload', name: 'upload', component: Upload, beforeEnter: authGuard },
  { path: '/login', name: 'login', component: Login },
  { path: '/friends', name: 'friends', component: Friends },
  { path: '/about', name: 'about', component: About },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },  // 404
]
```

## 核心页面

### Upload.vue（文章管理）

- **文章列表**: 显示所有文章（标题后附 slug），支持编辑/删除，加载中显示骨架提示
- **编辑器**: Code/Preview 双模式切换
  - Code 模式: Markdown 语法编辑，支持粘贴图片
  - Preview 模式: 调用 `/api/md/render` 实时预览
- **工具栏**: 加粗、斜体、行内代码、代码块、链接、图片、引用、列表
- **标签管理**: 输入添加、点击删除、自动补全（从 `/api/tags` 加载）
- **封面图**: 选择文件上传，编辑时可更新，更新文章时保留已有封面
- **图片上传**: 客户端压缩后上传，URL 自动插入编辑器
- **YAML 转义**: `yamlEscape` 函数对标题/简介中的特殊字符自动双引号包裹，避免 frontmatter 解析错误
- **编辑时长**: 实时统计编辑时间

### PostDetail.vue（文章详情）

- 英雄头图（封面图 + 标题 + 元数据）
- Markdown 渲染（调用 `/api/md/render`，支持代码高亮）
- 目录侧边栏（自动提取 H2/H3）
- 标签徽章

### Home.vue（首页）

- 左栏: 个人信息卡片（头像、姓名、简介、入口链接、社交图标）
- 右栏: 文章列表（含封面图）+ 分页器

### Categories.vue（博客分类页）

- 标签云（链接到标签详情）
- 最新文章列表（含封面图）+ 分页器

### Search.vue（搜索页）

- 搜索输入框（300ms 防抖）
- 标签筛选按钮
- 搜索结果列表 + 分页器

### About.vue（关于页）

- 站点介绍内容（v-html 渲染）
- 访客统计栏：今日活跃、今日更新、总访客、今日访客、当前 IP（带国旗）
- 国旗使用 flag-icons CDN（jsdelivr）

### NotFound.vue（404 页面）

- 玻璃拟态卡片居中显示
- 大号 404 数字（主题色）
- "返回首页" 按钮

## 样式系统

### CSS 变量

```css
:root {
  --color-accent: #3b82f6;
  --color-accent-hover: #60a5fa;
  --color-text-primary: #e8e8e8;
  --color-text-secondary: #b0b0c8;
  --color-text-muted: #a0a0b8;
  --glass-bg: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.18);
  /* ... */
}

[data-theme="light"] {
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #3a3a4a;
  --color-text-muted: #5a5a6a;    /* 对比度优化 */
  /* ... */
}
```

### 自定义光标

```css
.custom-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  background-image: url('/images/cursor.png');
  display: none;
}

@media (pointer: fine) {
  * { cursor: none !important; }
  .custom-cursor { display: block; }
}
```

### 分页器样式

所有分页页面（Home、Categories、Search）使用统一分页器：
- 页码按钮 + 上一页/下一页
- 当前页高亮（主题色背景）
- 省略号（超过 7 页时）

## API 调用

### Axios 拦截器 (main.ts)

全局请求拦截器自动注入 JWT Token，响应拦截器处理 401 自动跳转登录页。

```typescript
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('upload_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('upload_token')
      router.push('/login')
    }
    return Promise.reject(err)
  }
)
```

### 上传示例

```typescript
// 上传文章（含封面）
const formData = new FormData()
formData.append('file', mdFile)
formData.append('tags', tags)
formData.append('cover', coverFile)
await axios.post('/api/posts/upload', formData) // Token 自动注入

// 更新文章（含封面）
const formData = new FormData()
formData.append('content', fullContent)
formData.append('cover', coverFile)
await axios.put(`/api/posts/${slug}`, formData)

// 上传编辑器图片（URL 自动 encodeURI 编码后插入 markdown）
const formData = new FormData()
formData.append('image', compressed)
formData.append('slug', editSlug || '_temp')
await axios.post('/api/posts/upload-image', formData)
```

## 主题切换

- `data-theme` 属性切换深色/浅色
- localStorage 持久化
- `prefers-color-scheme` 媒体查询自动检测

## 国际化

- 配置文件: `site_config_{lang}.json`
- 支持: zh_cn / zh_hk / en_us
- 语言切换: localStorage 持久化
