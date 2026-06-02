<template>
  <div class="search">
    <h1 class="search__title">搜索</h1>

    <!-- 搜索框 -->
    <div class="search__bar">
      <input
        v-model="query"
        type="text"
        placeholder="搜索文章标题、简介、标签..."
        class="search__input"
        @input="debouncedSearch"
      />
    </div>

    <!-- 标签筛选 -->
    <div class="search__tags" v-if="allTags.length">
      <button
        v-for="tag in allTags"
        :key="tag.tag"
        :class="['search__tag-btn', { active: selectedTag === tag.tag }]"
        @click="toggleTag(tag.tag)"
      >
        {{ tag.tag }} ({{ tag.count }})
      </button>
    </div>

    <!-- 搜索结果 -->
    <div class="search__results" v-if="searched">
      <p class="search__count">找到 {{ results.length }} 篇文章</p>
      <div class="search__list" v-if="results.length">
        <PostCard v-for="post in results" :key="post.slug" :post="post" />
      </div>
      <p v-else class="search__empty">没有匹配的文章</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PostCard from '../components/PostCard.vue'
import type { PostMeta } from '../types'

const query = ref('')
const selectedTag = ref('')
const results = ref<PostMeta[]>([])
const searched = ref(false)
const allTags = ref<{ tag: string; count: number }[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(doSearch, 300)
}

async function doSearch() {
  const params: Record<string, string> = {}
  if (query.value.trim()) params.q = query.value.trim()
  if (selectedTag.value) params.tag = selectedTag.value

  if (!params.q && !params.tag) {
    results.value = []
    searched.value = false
    return
  }

  try {
    const { data } = await axios.get('/api/posts/search', { params })
    results.value = data.posts || []
    searched.value = true
  } catch (e) {
    console.warn('Search failed:', e)
  }
}

function toggleTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? '' : tag
  doSearch()
}

async function loadTags() {
  try {
    const { data } = await axios.get('/api/tags')
    allTags.value = data.tags || []
  } catch (e) {
    console.warn('Failed to load tags:', e)
  }
}

onMounted(loadTags)
</script>

<style scoped>
.search {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg);
}

.search__title {
  font-size: 1.8em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xl);
}

.search__bar {
  margin-bottom: var(--space-lg);
}

.search__input {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 1em;
  outline: none;
  transition: var(--transition-fast);
}

.search__input:focus {
  border-color: var(--color-accent);
  background: rgba(255, 255, 255, 0.08);
}

.search__input::placeholder {
  color: var(--color-text-muted);
}

.search__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.search__tag-btn {
  padding: var(--space-xs) var(--space-md);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.85em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.search__tag-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

.search__tag-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.search__count {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  margin-bottom: var(--space-lg);
}

.search__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.search__empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--space-3xl);
}
</style>
