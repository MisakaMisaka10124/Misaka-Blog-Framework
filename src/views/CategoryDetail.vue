<template>
  <div class="category-detail">
    <h1 class="category-detail__title">
      <span class="category-detail__label">标签：</span>{{ tag }}
    </h1>
    <router-link to="/categories" class="category-detail__back">← 返回分类</router-link>

    <div class="category-detail__list" v-if="posts.length">
      <PostCard v-for="post in posts" :key="post.slug" :post="post" />
    </div>

    <div v-else-if="loading" class="category-detail__status">加载中...</div>
    <div v-else class="category-detail__status">该标签下暂无文章</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import PostCard from '../components/PostCard.vue'
import type { PostMeta } from '../types'

const route = useRoute()
const tag = ref(route.params.tag as string)
const posts = ref<PostMeta[]>([])
const loading = ref(true)

async function loadPosts() {
  try {
    const { data } = await axios.get(`/api/tags/${tag.value}`)
    posts.value = data.posts || []
  } catch (e) {
    console.warn('Failed to load tag posts:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadPosts)
</script>

<style scoped>
.category-detail {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg);
}

.category-detail__title {
  font-size: 2em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.category-detail__label {
  color: var(--color-text-muted);
  font-weight: 400;
}

.category-detail__back {
  display: inline-block;
  margin-bottom: var(--space-xl);
  color: var(--color-accent);
  font-size: 0.9em;
}

.category-detail__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.category-detail__status {
  color: var(--color-text-muted);
  padding: var(--space-xl);
}
</style>
