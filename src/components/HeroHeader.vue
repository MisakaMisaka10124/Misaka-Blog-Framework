<template>
  <section class="hero" :style="bgStyle">
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <h1 class="hero__title">{{ title }}</h1>
      <div v-if="subtitle || date" class="hero__meta">
        <span v-if="date" class="hero__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          {{ date }}
        </span>
        <span v-if="wordCount" class="hero__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
          {{ wordCount }} 字
        </span>
        <span v-if="readTime" class="hero__meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {{ readTime }}
        </span>
      </div>
      <p v-if="subtitle" class="hero__subtitle">{{ subtitle }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  subtitle?: string
  coverImage?: string
  date?: string
  wordCount?: number
  readTime?: string
}>()

const bgStyle = computed(() => {
  if (props.coverImage) {
    return { backgroundImage: `url(${props.coverImage})` }
  }
  return {}
})
</script>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-size: cover;
  background-position: center;
  background-color: var(--color-bg-secondary);
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 26, 0.3) 0%,
    rgba(10, 10, 26, 0.7) 100%
  );
}

.hero__content {
  position: relative;
  z-index: 1;
  padding: var(--space-3xl) var(--space-lg);
  max-width: 800px;
}

.hero__title {
  font-size: 2.5em;
  font-weight: 700;
  color: #fff;
  margin-bottom: var(--space-md);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.hero__subtitle {
  font-size: 1.1em;
  color: rgba(255, 255, 255, 0.8);
  margin-top: var(--space-sm);
}

.hero__meta {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--space-sm);
}

.hero__meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .hero { min-height: 320px; }
  .hero__title { font-size: 1.8em; }
}
</style>
