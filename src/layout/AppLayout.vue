<template>
  <div class="app-layout">
    <!-- 背景系统 -->
    <div class="bg-system">
      <img
        v-for="(bg, index) in backgrounds"
        :key="index"
        :src="bg"
        :class="['bg-system__image', { active: activeBgIndex === index }]"
        alt=""
      />
    </div>
    <div class="glass-overlay"></div>

    <!-- 导航栏 -->
    <Navbar :nav-links="siteConfig.navLinks" :site-title="siteConfig.siteTitle" />

    <!-- 主内容 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 页脚 -->
    <Footer :copyright="siteConfig.footer?.copyright" :icp="siteConfig.footer?.icp" />

    <!-- 自定义光标 -->
    <div ref="cursorRef" class="custom-cursor"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import Navbar from './Navbar.vue'
import Footer from './Footer.vue'

interface NavLink {
  label: string
  path: string
}

interface SiteConfig {
  siteTitle: string
  welcomeMessage: string
  navLinks: NavLink[]
  footer?: { copyright?: string; icp?: string }
  hero?: { backgroundImages?: string[] }
  [key: string]: any
}

const siteConfig = ref<SiteConfig>({
  siteTitle: 'Misaka',
  welcomeMessage: '',
  navLinks: [],
})

const backgrounds = ref<string[]>([
  '/images/morning.jpg',
  '/images/noon.jpg',
  '/images/evening.jpg',
  '/images/night.jpg',
])

const activeBgIndex = ref(0)
const cursorRef = ref<HTMLElement | null>(null)

// 根据时间选择背景
function updateBackground() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) activeBgIndex.value = 0
  else if (hour >= 11 && hour < 16) activeBgIndex.value = 1
  else if (hour >= 16 && hour < 22) activeBgIndex.value = 2
  else activeBgIndex.value = 3
}

// 自定义光标
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

function handleMouseMove(e: MouseEvent) {
  if (cursorRef.value) {
    cursorRef.value.style.left = `${e.clientX}px`
    cursorRef.value.style.top = `${e.clientY}px`
    cursorRef.value.style.display = 'block'
  }
}

function handleMouseLeave() {
  if (cursorRef.value) cursorRef.value.style.display = 'none'
}

function handleMouseEnter() {
  if (cursorRef.value) cursorRef.value.style.display = 'block'
}

// 加载配置
async function loadConfig() {
  try {
    const lang = localStorage.getItem('site_lang') || 'zh_cn'
    const { data } = await axios.get(`/api/config?lang=${lang}`)
    siteConfig.value = { ...siteConfig.value, ...data }
    if (data.hero?.backgroundImages?.length) {
      backgrounds.value = data.hero.backgroundImages
    }
  } catch (e) {
    console.warn('Failed to load site config:', e)
  }
}

let bgInterval: ReturnType<typeof setInterval>

onMounted(() => {
  loadConfig()
  updateBackground()
  bgInterval = setInterval(updateBackground, 5 * 60 * 1000)

  // 桌面端自定义光标
  if (!isTouchDevice && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)
  }
})

onUnmounted(() => {
  clearInterval(bgInterval)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseleave', handleMouseLeave)
  document.removeEventListener('mouseenter', handleMouseEnter)
})
</script>

<style>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  background-image: url('/images/cursor.png');
  background-size: 32px 32px;
  background-repeat: no-repeat;
  display: none;
}

@media (pointer: fine) {
  * {
    cursor: none !important;
  }
  .custom-cursor {
    display: block;
  }
}
</style>

