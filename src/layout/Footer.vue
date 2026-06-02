<template>
  <footer class="footer">
    <div class="footer__inner">
      <span class="footer__copyright">© {{ copyright || '2026 Misaka10124' }}</span>
      <span v-if="icp" class="footer__divider">|</span>
      <a
        v-if="icp"
        :href="queryUrl"
        target="_blank"
        rel="noopener"
        class="footer__icp"
      >{{ icp }}</a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  copyright?: string
  icp?: string
}>()

const queryUrl = computed(() => {
  if (!props.icp) return ''
  const encoded = encodeURIComponent(props.icp)
  return `https://beian.miit.gov.cn/#/Integrated/recordQuery?siteName=${encoded}`
})
</script>

<style scoped>
.footer {
  background: rgba(10, 10, 26, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: var(--space-lg) 0;
  text-align: center;
}

[data-theme="light"] .footer {
  background: rgba(255, 255, 255, 0.6);
}

.footer__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-sm);
}

.footer__divider {
  color: var(--color-text-muted);
  font-size: 0.85em;
  opacity: 0.5;
}

.footer__copyright {
  color: var(--color-text-muted);
  font-size: 0.85em;
}

.footer__icp {
  color: var(--color-text-muted);
  font-size: 0.85em;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__icp:hover {
  color: var(--color-accent);
  text-decoration: underline;
}
</style>
