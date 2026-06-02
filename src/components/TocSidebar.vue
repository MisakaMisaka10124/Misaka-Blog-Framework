<template>
  <aside class="toc" v-if="items.length">
    <h4 class="toc__title">目录</h4>
    <nav class="toc__nav">
      <a
        v-for="item in items"
        :key="item.id"
        :href="`#${item.id}`"
        :class="['toc__link', `toc__link--h${item.level}`, { 'toc__link--active': activeId === item.id }]"
        @click.prevent="scrollTo(item.id)"
      >
        <span class="toc__icon">{{ iconForLevel(item.level) }}</span>
        {{ item.text }}
      </a>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TocItem } from '../types'

const props = defineProps<{
  items: TocItem[]
}>()

const activeId = ref('')

function iconForLevel(level: number): string {
  const icons: Record<number, string> = {
    1: '📌',
    2: '📂',
    3: '📄',
    4: '•',
    5: '◦',
    6: '▪',
  }
  return icons[level] || '•'
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const offset = 80 // navbar height + some padding
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// Intersection Observer 高亮当前标题
let observer: IntersectionObserver | null = null

function setupObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  )

  props.items.forEach((item) => {
    const el = document.getElementById(item.id)
    if (el) observer!.observe(el)
  })
}

onMounted(() => {
  // 延迟一帧确保 DOM 已渲染
  requestAnimationFrame(setupObserver)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.toc {
  position: sticky;
  top: calc(var(--navbar-height) + var(--space-lg));
  max-height: calc(100vh - var(--navbar-height) - var(--space-2xl));
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.toc__title {
  font-size: 0.9em;
  color: var(--color-text-muted);
  margin-bottom: var(--space-md);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.toc__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc__link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 0.85em;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  line-height: 1.4;
}

.toc__link:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.toc__link--active {
  color: var(--color-accent);
  background: rgba(59, 130, 246, 0.1);
}

.toc__link--h3 { padding-left: 20px; }
.toc__link--h4 { padding-left: 32px; }
.toc__link--h5 { padding-left: 44px; }
.toc__link--h6 { padding-left: 56px; }

.toc__icon {
  font-size: 0.8em;
  flex-shrink: 0;
}
</style>
