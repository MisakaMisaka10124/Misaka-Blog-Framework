<template>
  <div class="categories">
    <h1 class="categories__title">分类</h1>
    <p class="categories__subtitle">按标签浏览所有文章</p>

    <!-- 标签云 -->
    <div class="categories__tags" v-if="tags.length">
      <router-link
        v-for="item in tags"
        :key="item.tag"
        :to="`/categories/${item.tag}`"
        class="categories__tag backdrop-blur"
      >
        <span class="categories__tag-name">{{ item.tag }}</span>
        <span class="categories__tag-count">{{ item.count }}</span>
      </router-link>
    </div>

    <div v-else-if="loading" class="categories__status">加载中...</div>
    <div v-else class="categories__status">暂无标签</div>

    <!-- 最新文章 -->
    <section class="categories__recent" v-if="posts.length">
      <h2 class="categories__section-title">最新文章</h2>
      <div class="categories__posts-list">
        <PostCard v-for="post in posts" :key="post.slug" :post="post" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PostCard from '../components/PostCard.vue'
import type { PostMeta } from '../types'

interface TagInfo { tag: string; count: number }

const tags = ref<TagInfo[]>([])
const posts = ref<PostMeta[]>([])
const loading = ref(true)

async function loadData() {
  try {
    const [tagsRes, indexRes] = await Promise.all([
      axios.get('/api/tags'),
      axios.get('/api/posts/index'),
    ])
    tags.value = tagsRes.data.tags || []
    posts.value = indexRes.data.posts || []
  } catch (e) {
    console.warn('Failed to load categories:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.categories {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg);
}

.categories__title {
  font-size: 2em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.categories__subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

.categories__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.categories__tag {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 0.95em;
  transition: var(--transition-smooth);
}

.categories__tag:hover {
  transform: translateY(-2px);
  color: var(--color-accent);
}

.categories__tag-count {
  font-size: 0.8em;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 10px;
}

.categories__status {
  color: var(--color-text-muted);
  padding: var(--space-xl);
  text-align: center;
}

.categories__section-title {
  font-size: 1.3em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--glass-border);
}

.categories__posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
</style>
