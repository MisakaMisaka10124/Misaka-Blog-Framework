<template>
  <div class="about">
    <h1 class="about__title">关于本站</h1>

    <GlassCard class="about__card" hoverable="false">
      <div class="about__content markdown-body" v-html="content"></div>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GlassCard from '../components/GlassCard.vue'

const content = ref(`
<h2>👋 Hi there</h2>
<p>我是 Misaka10124，一个热爱技术的开发者。</p>
<p>这个网站是我的个人空间，用来记录技术笔记、分享项目和一些生活感悟。</p>

<h3>🛠 技术栈</h3>
<ol>
  <li>前端：Vue 3 / TypeScript / Vite</li>
  <li>后端：Node.js / Express</li>
</ol>

<h3>联系我</h3>
<p>可以通过页面底部的社交链接找到我，或者直接发邮件。</p>
`)

// TODO: 从 API 动态加载关于页内容
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
</style>
