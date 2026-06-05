<template>
  <router-link :to="`/post/${post.slug}`" class="post-card backdrop-blur">
    <div v-if="post.cover" class="post-card__cover">
      <img :src="post.cover" :alt="post.title" />
    </div>
    <div class="post-card__body">
      <h3 class="post-card__title">{{ post.title }}</h3>
      <p class="post-card__summary">{{ post.summary }}</p>
      <div class="post-card__meta">
        <span class="post-card__date">{{ post.date }}</span>
        <span class="post-card__words">{{ post.wordCount }} {{ wordCountUnit }}</span>
        <span class="post-card__readtime">{{ post.readTime }}</span>
      </div>
      <div v-if="post.tags?.length" class="post-card__tags">
        <TagBadge v-for="tag in post.tags" :key="tag" :tag="tag" />
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { PostMeta } from '../types'
import TagBadge from './TagBadge.vue'

defineProps<{
  post: PostMeta
}>()

const wordCountUnit = ref('字')

// 加载服务器配置
async function loadServerConfig() {
  try {
    const { data } = await axios.get('/api/server-config')
    if (data.display?.wordCountUnit) {
      wordCountUnit.value = data.display.wordCountUnit
    }
  } catch {
    // 使用默认值
  }
}

onMounted(() => {
  loadServerConfig()
})
</script>

<style scoped>
.post-card {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-lg);
  text-decoration: none;
  color: inherit;
  transition: var(--transition-smooth);
}

.post-card:hover {
  transform: translateY(-4px);
  color: inherit;
}

.post-card__cover {
  flex-shrink: 0;
  width: 200px;
  height: 140px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.post-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-card:hover .post-card__cover img {
  transform: scale(1.05);
}

.post-card__body {
  flex: 1;
  min-width: 0;
}

.post-card__title {
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card__summary {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  margin-bottom: var(--space-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-card__meta {
  display: flex;
  gap: var(--space-md);
  color: var(--color-text-muted);
  font-size: 0.8em;
  margin-bottom: var(--space-sm);
}

.post-card__tags {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .post-card {
    flex-direction: column;
  }

  .post-card__cover {
    width: 100%;
    height: 180px;
  }
}
</style>
