<template>
  <div class="admin-layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="sidebarOpen"
      class="admin-layout__overlay"
      @click="sidebarOpen = false"
    />

    <!-- 侧边栏 -->
    <aside
      class="admin-layout__sidebar"
      :class="{ 'admin-layout__sidebar--open': sidebarOpen }"
    >
      <div class="admin-layout__logo">
        <router-link to="/admin" class="admin-layout__logo-link">
          <span class="admin-layout__logo-text">管理后台</span>
        </router-link>
      </div>

      <nav class="admin-layout__nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="admin-layout__nav-item"
          :class="{ 'admin-layout__nav-item--active': isActive(item.path) }"
          @click="sidebarOpen = false"
        >
          <span class="admin-layout__nav-icon">
            <svg v-if="item.icon === 'dashboard'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <svg v-else-if="item.icon === 'posts'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <svg v-else-if="item.icon === 'settings'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <svg v-else-if="item.icon === 'friends'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <svg v-else-if="item.icon === 'social'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          <span class="admin-layout__nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="admin-layout__footer">
        <button class="admin-layout__logout" @click="handleLogout">
          <span class="admin-layout__nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span>退出登录</span>
        </button>
        <router-link to="/" class="admin-layout__back-site">
          <span class="admin-layout__nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </span>
          <span>返回前台</span>
        </router-link>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="admin-layout__main">
      <!-- 顶部栏 -->
      <header class="admin-layout__header">
        <button
          class="admin-layout__menu-btn"
          @click="sidebarOpen = !sidebarOpen"
        >
          ☰
        </button>
        <div class="admin-layout__header-title">{{ currentPageTitle }}</div>
        <div class="admin-layout__header-user">
          {{ adminUsername }}
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const adminUsername = computed(() => {
  const token = localStorage.getItem('upload_token')
  if (!token) return 'Admin'
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.user || 'Admin'
  } catch {
    return 'Admin'
  }
})

const navItems = [
  {
    path: '/admin',
    label: '仪表盘',
    icon: 'dashboard',
  },
  {
    path: '/admin/posts',
    label: '文章管理',
    icon: 'posts',
  },
  {
    path: '/admin/settings',
    label: '站点设置',
    icon: 'settings',
  },
  {
    path: '/admin/friends',
    label: '友链管理',
    icon: 'friends',
  },
  {
    path: '/admin/social',
    label: '社交媒体',
    icon: 'social',
  },
]

const currentPageTitle = computed(() => {
  const currentPath = route.path
  const item = navItems.find((nav) => nav.path === currentPath)
  return item?.label || '管理后台'
})

function isActive(path: string): boolean {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

function handleLogout() {
  localStorage.removeItem('upload_token')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* 侧边栏 */
.admin-layout__sidebar {
  width: 240px;
  background: var(--color-surface);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}

.admin-layout__logo {
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--glass-border);
}

.admin-layout__logo-link {
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 1.2em;
}

.admin-layout__logo-text {
  background: linear-gradient(135deg, var(--color-accent), #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.admin-layout__nav {
  flex: 1;
  padding: var(--space-md) 0;
  overflow-y: auto;
}

.admin-layout__nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.admin-layout__nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.admin-layout__nav-item--active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.admin-layout__nav-icon {
  font-size: 1.2em;
  width: 24px;
  text-align: center;
}

.admin-layout__nav-label {
  font-size: 0.95em;
}

.admin-layout__footer {
  padding: var(--space-md) 0;
  border-top: 1px solid var(--glass-border);
}

.admin-layout__logout,
.admin-layout__back-site {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  color: var(--color-text-secondary);
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  font-size: 0.95em;
  transition: all 0.2s ease;
}

.admin-layout__logout:hover,
.admin-layout__back-site:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.admin-layout__logout:hover {
  color: #ef4444;
}

/* 主内容区 */
.admin-layout__main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.admin-layout__header {
  height: 60px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-xl);
  gap: var(--space-md);
  position: sticky;
  top: 0;
  z-index: 50;
}

.admin-layout__menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 1.5em;
  cursor: pointer;
  padding: var(--space-sm);
}

.admin-layout__header-title {
  flex: 1;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--color-text-primary);
}

.admin-layout__header-user {
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.admin-layout__content {
  flex: 1;
  padding: var(--space-xl);
}

/* 遮罩层 */
.admin-layout__overlay {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-layout__sidebar {
    transform: translateX(-100%);
  }

  .admin-layout__sidebar--open {
    transform: translateX(0);
  }

  .admin-layout__main {
    margin-left: 0;
  }

  .admin-layout__menu-btn {
    display: block;
  }

  .admin-layout__overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
}
</style>
