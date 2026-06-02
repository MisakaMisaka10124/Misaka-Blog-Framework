<template>
  <div class="post-detail" v-if="post">
    <!-- Hero 头图 -->
    <HeroHeader
      :title="post.meta?.title || post.slug"
      :cover-image="post.meta?.cover"
      :date="post.meta?.date"
      :word-count="post.meta?.wordCount"
      :read-time="post.meta?.readTime"
    />

    <!-- 双栏布局 -->
    <div class="post-detail__layout">
      <!-- 主栏：文章正文 -->
      <article class="post-detail__article">
        <GlassCard class="post-detail__content" hoverable="false">
          <div class="markdown-body" v-html="renderedHtml"></div>
        </GlassCard>

        <!-- 标签 -->
        <div class="post-detail__tags" v-if="post.meta?.tags?.length">
          <TagBadge v-for="tag in post.meta.tags" :key="tag" :tag="tag" />
        </div>
      </article>

      <!-- 侧边栏：TOC -->
      <div class="post-detail__sidebar">
        <TocSidebar :items="tocItems" />
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-else-if="loading" class="post-detail__loading">
    <p>加载中...</p>
  </div>

  <!-- 错误状态 -->
  <div v-else class="post-detail__error">
    <p>文章不存在或加载失败</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import HeroHeader from '../components/HeroHeader.vue'
import GlassCard from '../components/GlassCard.vue'
import TocSidebar from '../components/TocSidebar.vue'
import TagBadge from '../components/TagBadge.vue'
import type { PostMeta, TocItem } from '../types'

interface PostData {
  slug: string
  content: string
  meta?: PostMeta
}

const route = useRoute()
const post = ref<PostData | null>(null)
const renderedHtml = ref('')
const loading = ref(true)

// 从渲染后的 HTML 提取 TOC
const tocItems = computed<TocItem[]>(() => {
  if (!renderedHtml.value) return []
  const div = document.createElement('div')
  div.innerHTML = renderedHtml.value
  const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6')
  return Array.from(headings).map((h) => {
    const text = h.textContent || ''
    const id = text
      .toLowerCase()
      .replace(/[^\w一-鿿]+/g, '-')
      .replace(/^-|-$/g, '')
    h.id = id // 给 heading 设置 id
    return { id, text, level: parseInt(h.tagName[1]) }
  })
})

async function loadPost() {
  const slug = route.params.slug as string
  loading.value = true
  try {
    const { data } = await axios.get(`/api/posts/${slug}`)
    post.value = data

    // 渲染 Markdown
    if (data.content) {
      const renderRes = await axios.post('/api/md/render', { markdown: data.content })
      renderedHtml.value = renderRes.data.html || renderRes.data

      // 渲染完成后给 heading 补 id（用于 TOC 跳转）
      requestAnimationFrame(() => {
        document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4').forEach((h) => {
          const text = h.textContent || ''
          h.id = text
            .toLowerCase()
            .replace(/[^\w一-鿿]+/g, '-')
            .replace(/^-|-$/g, '')
        })
      })
    }
  } catch (e) {
    console.error('Failed to load post:', e)
    post.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadPost)
</script>

<style scoped>
.post-detail__layout {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: var(--space-xl);
  align-items: start;
}

.post-detail__article {
  min-width: 0;
}

.post-detail__content {
  padding: var(--space-xl) !important;
}

.post-detail__tags {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-lg);
}

.post-detail__sidebar {
  position: sticky;
  top: calc(var(--navbar-height) + var(--space-lg));
}

.post-detail__loading,
.post-detail__error {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-secondary);
}

.post-detail__error a {
  display: inline-block;
  margin-top: var(--space-md);
}

@media (max-width: 900px) {
  .post-detail__layout {
    grid-template-columns: 1fr;
  }

  .post-detail__sidebar {
    display: none;
  }
}
</style>
