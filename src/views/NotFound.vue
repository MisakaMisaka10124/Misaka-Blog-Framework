<template>
  <div class="not-found">
    <GlassCard class="not-found__card">
      <div class="not-found__code">404</div>
      <p class="not-found__text">页面不存在</p>
      <p class="not-found__desc">你访问的页面可能已被移除或地址输入有误</p>
      <router-link to="/" class="not-found__btn">返回首页</router-link>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import GlassCard from '../components/GlassCard.vue'
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--navbar-height) - 120px);
  padding: var(--space-2xl) var(--space-lg);
}

.not-found__card {
  text-align: center;
  padding: var(--space-3xl) var(--space-2xl) !important;
  max-width: 420px;
}

.not-found__code {
  font-size: 6em;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
  margin-bottom: var(--space-md);
  opacity: 0.8;
}

.not-found__text {
  font-size: 1.4em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.not-found__desc {
  color: var(--color-text-muted);
  font-size: 0.9em;
  margin-bottom: var(--space-xl);
}

.not-found__btn {
  display: inline-block;
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-accent);
  color: #fff;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: 0.95em;
  transition: var(--transition-smooth);
}

.not-found__btn:hover {
  background: var(--color-accent-hover);
  transform: translateY(-2px);
  color: #fff;
}
</style>
