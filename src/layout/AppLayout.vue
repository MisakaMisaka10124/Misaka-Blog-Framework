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

interface HeroConfig {
  backgroundMode?: 'static' | 'timeOfDay' | 'rotation'
  staticBackground?: string
  backgroundImages?: string[]
  backgroundTimeRanges?: {
    morning: number[]
    noon: number[]
    evening: number[]
    night: number[]
  }
  backgroundRotationInterval?: number
}

interface SiteConfig {
  siteTitle: string
  welcomeMessage: string
  navLinks: NavLink[]
  footer?: { copyright?: string; icp?: string }
  hero?: HeroConfig
  [key: string]: any
}

interface ServerConfig {
  hero?: {
    backgroundMode?: string
    staticBackground?: string
    backgroundTimeRanges?: {
      morning: number[]
      noon: number[]
      evening: number[]
      night: number[]
    }
    backgroundRotationInterval?: number
    backgroundCheckInterval?: number
  }
  fallbackImages?: {
    heroBackgrounds?: {
      default: string[]
      custom: string[]
    }
  }
}

const siteConfig = ref<SiteConfig>({
  siteTitle: 'Misaka',
  welcomeMessage: '',
  navLinks: [],
})

const backgrounds = ref<string[]>([
  '/images/backgrounds/morning.jpg',
  '/images/backgrounds/noon.jpg',
  '/images/backgrounds/evening.jpg',
  '/images/backgrounds/night.jpg',
])

const activeBgIndex = ref(0)
const cursorRef = ref<HTMLElement | null>(null)
const backgroundMode = ref<'static' | 'timeOfDay' | 'rotation'>('timeOfDay')
const backgroundRotationInterval = ref(300000)
const backgroundCheckInterval = ref(60000)
const backgroundTimeRanges = ref({
  morning: [5, 11],
  noon: [11, 16],
  evening: [16, 22],
  night: [22, 5]
})

// 根据时间选择背景（时间段模式）
function updateBackgroundByTime() {
  const hour = new Date().getHours()
  const ranges = backgroundTimeRanges.value

  if (hour >= ranges.morning[0] && hour < ranges.morning[1]) {
    activeBgIndex.value = 0
  } else if (hour >= ranges.noon[0] && hour < ranges.noon[1]) {
    activeBgIndex.value = 1
  } else if (hour >= ranges.evening[0] && hour < ranges.evening[1]) {
    activeBgIndex.value = 2
  } else {
    activeBgIndex.value = 3
  }
}

// 轮换模式：切换到下一张背景
function rotateBackground() {
  if (backgrounds.value.length > 0) {
    activeBgIndex.value = (activeBgIndex.value + 1) % backgrounds.value.length
  }
}

// 更新背景（根据模式）
function updateBackground() {
  switch (backgroundMode.value) {
    case 'static':
      // 静态模式：只显示第一张
      activeBgIndex.value = 0
      break
    case 'timeOfDay':
      // 时间段模式：根据时间切换
      updateBackgroundByTime()
      break
    case 'rotation':
      // 轮换模式：自动切换
      rotateBackground()
      break
  }
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
    const [configRes, serverConfigRes] = await Promise.all([
      axios.get(`/api/config?lang=${lang}`),
      axios.get('/api/server-config').catch(() => ({ data: {} }))
    ])

    siteConfig.value = { ...siteConfig.value, ...configRes.data }

    // 加载语言配置中的背景图片
    if (configRes.data.hero?.backgroundImages?.length) {
      backgrounds.value = configRes.data.hero.backgroundImages
    }

    // 加载服务器配置
    const serverConfig: ServerConfig = serverConfigRes.data

    if (serverConfig.hero) {
      if (serverConfig.hero.backgroundMode) {
        backgroundMode.value = serverConfig.hero.backgroundMode as any
      }
      if (serverConfig.hero.backgroundTimeRanges) {
        backgroundTimeRanges.value = serverConfig.hero.backgroundTimeRanges
      }
      if (serverConfig.hero.backgroundRotationInterval) {
        backgroundRotationInterval.value = serverConfig.hero.backgroundRotationInterval
      }
      if (serverConfig.hero.backgroundCheckInterval) {
        backgroundCheckInterval.value = serverConfig.hero.backgroundCheckInterval
      }

      // 静态模式：使用配置的静态背景
      if (backgroundMode.value === 'static' && serverConfig.hero.staticBackground) {
        backgrounds.value = [serverConfig.hero.staticBackground]
      }
    }

    // 加载自定义背景图片
    if (serverConfig.fallbackImages?.heroBackgrounds?.custom?.length) {
      backgrounds.value = [
        ...backgrounds.value,
        ...serverConfig.fallbackImages.heroBackgrounds.custom
      ]
    }
  } catch (e) {
    console.warn('Failed to load site config:', e)
  }
}

let bgInterval: ReturnType<typeof setInterval>

onMounted(() => {
  loadConfig().then(() => {
    updateBackground()

    // 根据模式设置定时器
    if (backgroundMode.value === 'rotation') {
      bgInterval = setInterval(updateBackground, backgroundRotationInterval.value)
    } else if (backgroundMode.value === 'timeOfDay') {
      bgInterval = setInterval(updateBackground, backgroundCheckInterval.value)
    }
  })

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
  .app-layout * {
    cursor: none !important;
  }
  .custom-cursor {
    display: block;
  }
}
</style>

