<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="navbar__inner">
      <!-- Logo -->
      <router-link to="/" class="navbar__logo">{{ siteTitle || 'Misaka' }}</router-link>

      <!-- 桌面端导航链接 -->
      <div class="navbar__links">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="navbar__link"
          active-class="navbar__link--active"
          :exact="link.path === '/'"
        >
          {{ link.label }}
        </router-link>
      </div>

      <!-- 右侧操作 -->
      <div class="navbar__actions">
        <!-- 后台管理链接（已登录时显示） -->
        <router-link
          v-if="isLoggedIn"
          to="/admin"
          class="navbar__admin-link"
          title="后台管理"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </router-link>
        <!-- 语言切换 -->
        <div class="navbar__lang" @click="toggleLangMenu" ref="langRef">
          <span class="navbar__lang-label">{{ currentLangLabel }}</span>
          <Transition name="fade">
            <div v-if="langMenuOpen" class="navbar__lang-dropdown">
              <button
                v-for="lang in langOptions"
                :key="lang.value"
                :class="['navbar__lang-option', { active: currentLang === lang.value }]"
                @click.stop="switchLang(lang.value)"
              >
                {{ lang.label }}
              </button>
            </div>
          </Transition>
        </div>
        <router-link to="/search" class="navbar__btn" title="搜索">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </router-link>
        <ThemeToggle />
        <!-- 移动端汉堡菜单 -->
        <button class="navbar__burger" @click="mobileOpen = !mobileOpen">
          <span :class="{ open: mobileOpen }"></span>
        </button>
      </div>
    </div>

    <!-- 移动端菜单 -->
    <Transition name="slide">
      <div v-if="mobileOpen" class="navbar__mobile">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="navbar__mobile-link"
          active-class="navbar__mobile-link--active"
          :exact="link.path === '/'"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </router-link>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import ThemeToggle from '../components/ThemeToggle.vue'

interface NavLink {
  label: string
  path: string
}

const props = defineProps<{
  navLinks: NavLink[]
  siteTitle?: string
}>()

defineEmits<{
  search: []
}>()

const isScrolled = ref(false)
const mobileOpen = ref(false)

// 检查是否已登录
const isLoggedIn = computed(() => {
  const token = localStorage.getItem('upload_token')
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
})

// 语言切换
const langOptions = ref([
  { value: 'zh_cn', label: '中' },
  { value: 'en_us', label: 'EN' },
  { value: 'zh_hk', label: '繁' },
])
const currentLang = ref(localStorage.getItem('site_lang') || 'zh_cn')
const langMenuOpen = ref(false)
const langRef = ref<HTMLElement | null>(null)

const currentLangLabel = computed(() => {
  return langOptions.value.find(l => l.value === currentLang.value)?.label || '中'
})

function toggleLangMenu() {
  langMenuOpen.value = !langMenuOpen.value
}

function switchLang(lang: string) {
  currentLang.value = lang
  localStorage.setItem('site_lang', lang)
  langMenuOpen.value = false
  window.location.reload()
}

function handleClickOutside(e: MouseEvent) {
  if (langRef.value && !langRef.value.contains(e.target as Node)) {
    langMenuOpen.value = false
  }
}

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

// 加载服务器配置
async function loadServerConfig() {
  try {
    const { data } = await axios.get('/api/server-config')
    if (data.defaults?.availableLanguages) {
      langOptions.value = data.defaults.availableLanguages
    }
    if (data.defaults?.language) {
      const savedLang = localStorage.getItem('site_lang')
      if (!savedLang) {
        currentLang.value = data.defaults.language
        localStorage.setItem('site_lang', data.defaults.language)
      }
    }
  } catch {
    // 使用默认值
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleClickOutside)
  loadServerConfig()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  z-index: 1000;
  transition: var(--transition-smooth);
  background: transparent;
}

.navbar.scrolled {
  background: rgba(17, 17, 17, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

[data-theme="light"] .navbar.scrolled {
  background: rgba(255, 255, 255, 0.85);
}

.navbar__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
}

.navbar__logo {
  font-size: 1.4em;
  font-weight: 700;
  color: var(--color-text-primary);
  text-decoration: none;
  letter-spacing: -0.5px;
}

.navbar__links {
  display: flex;
  gap: var(--space-lg);
  margin-left: auto;
}

.navbar__link {
  color: var(--color-text-secondary);
  font-size: 0.95em;
  padding: var(--space-xs) 0;
  position: relative;
  text-decoration: none;
  transition: var(--transition-fast);
}

.navbar__link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-accent);
  transition: width 0.3s ease;
}

.navbar__link:hover,
.navbar__link--active {
  color: var(--color-text-primary);
}

.navbar__link:hover::after,
.navbar__link--active::after {
  width: 100%;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: var(--space-lg);
  flex-shrink: 0;
}

.navbar__btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.navbar__btn:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.navbar__admin-link {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.1em;
}

.navbar__admin-link:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.navbar__lang {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.navbar__lang-label {
  color: var(--color-text-secondary);
  font-size: 0.85em;
  padding: var(--space-xs) var(--space-sm);
  transition: var(--transition-fast);
}

.navbar__lang-label:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.navbar__lang-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  z-index: 100;
  min-width: 60px;
}

[data-theme="light"] .navbar__lang-dropdown {
  background: rgba(255, 255, 255, 0.95);
}

.navbar__lang-option {
  display: block;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.85em;
  cursor: pointer;
  text-align: left;
  transition: var(--transition-fast);
}

.navbar__lang-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

.navbar__lang-option.active {
  color: var(--color-accent);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.navbar__burger {
  display: none;
  background: none;
  border: none;
  padding: var(--space-sm);
  cursor: pointer;
  width: 36px;
  height: 36px;
  position: relative;
}

.navbar__burger span,
.navbar__burger span::before,
.navbar__burger span::after {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--color-text-primary);
  position: absolute;
  left: 8px;
  transition: var(--transition-smooth);
}

.navbar__burger span {
  top: 17px;
}

.navbar__burger span::before {
  content: '';
  top: -6px;
}

.navbar__burger span::after {
  content: '';
  top: 6px;
}

.navbar__burger span.open {
  background: transparent;
}

.navbar__burger span.open::before {
  top: 0;
  transform: rotate(45deg);
}

.navbar__burger span.open::after {
  top: 0;
  transform: rotate(-45deg);
}

.navbar__mobile {
  display: none;
  background: rgba(17, 17, 17, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.navbar__mobile-link {
  display: block;
  color: var(--color-text-secondary);
  padding: var(--space-md) 0;
  font-size: 1.1em;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.navbar__mobile-link:hover {
  color: var(--color-text-primary);
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .navbar__links {
    display: none;
  }

  .navbar__burger {
    display: block;
  }

  .navbar__mobile {
    display: block;
  }
}
</style>
