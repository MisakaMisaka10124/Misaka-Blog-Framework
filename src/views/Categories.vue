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
        <PostCard v-for="post in pagedPosts" :key="post.slug" :post="post" />
      </div>
      <div class="categories__pagination" v-if="totalPages > 1">
        <button class="categories__page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="categories__page-dots">...</span>
          <button v-else class="categories__page-btn" :class="{ active: p === currentPage }" @click="currentPage = p as number">{{ p }}</button>
        </template>
        <button class="categories__page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import PostCard from '../components/PostCard.vue'
import type { PostMeta } from '../types'

interface TagInfo { tag: string; count: number }

const tags = ref<TagInfo[]>([])
const posts = ref<PostMeta[]>([])
const loading = ref(true)
const currentPage = ref(1)
const pageSize = 5

const totalPages = computed(() => Math.ceil(posts.value.length / pageSize))
const pagedPosts = computed(() => posts.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

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

.categories__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--glass-border);
}

.categories__page-btn {
  background: none;
  border: 1px solid var(--glass-border);
  color: var(--color-text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-smooth);
  font-size: 0.85em;
}

.categories__page-btn:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.categories__page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.categories__page-btn.active {
  background: var(--color-accent);
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}

.categories__page-dots {
  color: var(--color-text-muted);
  padding: 0 4px;
}
</style>
