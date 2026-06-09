<template>
  <div class="about">
    <h1 class="about__title">关于本站</h1>

    <GlassCard class="about__card" :hoverable="false">
      <div class="about__content markdown-body" v-html="content"></div>

      <div class="about__visitor" v-if="visitor">
        <span>今日活跃：{{ visitor.todayVisitors }} 人</span>
        <span class="about__visitor-sep">|</span>
        <span>今日更新：{{ visitor.todayPosts }} 篇</span>
        <span class="about__visitor-sep">|</span>
        <span>本站已有{{ visitor.totalVisitors }}人访问</span>
        <span class="about__visitor-sep">|</span>
        <span>今日有{{ visitor.todayVisitors }}人访问</span>
        <span class="about__visitor-sep">|</span>
        <span>您的IP为：<span :class="`fi fi-${visitor.countryCode.toLowerCase()}`"></span> <code class="about__ip">{{ visitor.ip }}</code></span>
      </div>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { marked } from 'marked'
import GlassCard from '../components/GlassCard.vue'

const content = ref('')
const visitor = ref<{ ip: string; countryCode: string; todayVisitors: number; totalVisitors: number; todayPosts: number } | null>(null)

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/config')
    const rawContent = data.aboutContent || data.about || ''
    content.value = marked(rawContent) as string
  } catch {
    // 静默失败，使用默认内容
    content.value = '<h2>Hi there</h2><p>欢迎来到我的个人空间。</p>'
  }

  try {
    const { data } = await axios.get('/api/visitor/record')
    visitor.value = data
  } catch {
    // 静默失败，不影响页面
  }
})
</script>

<style scoped>
.about {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg);
}

.about__title {
  font-size: 2em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xl);
}

.about__card {
  padding: var(--space-xl) !important;
}

.about__visitor {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.9em;
  line-height: 1.8;
  overflow-wrap: break-word;
  word-break: break-all;
}

.about__visitor-sep {
  color: var(--color-border);
}

.about__visitor .fi {
  margin-right: 4px;
  vertical-align: middle;
}

.about__ip {
  font-family: var(--font-mono);
  background: rgba(255, 255, 255, 0.08);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  word-break: break-all;
}

@media (max-width: 600px) {
  .about__visitor {
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .about__visitor-sep {
    display: none;
  }
}
</style>
