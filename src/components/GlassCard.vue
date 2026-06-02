<template>
  <div :class="['glass-card', `glass-card--${color}`, { 'glass-card--hoverable': hoverable }]" :style="style">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color?: 'blue' | 'pink' | 'yellow' | 'purple' | 'orange' | 'green' | 'default'
  hoverable?: boolean
  padding?: string
}>(), {
  color: 'default',
  hoverable: true,
  padding: '24px',
})

const style = computed(() => ({
  padding: props.padding,
}))
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  transition: var(--transition-smooth);
}

.glass-card--hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.glass-card--blue { background: var(--card-blue); }
.glass-card--pink { background: var(--card-pink); }
.glass-card--yellow { background: var(--card-yellow); }
.glass-card--purple { background: var(--card-purple); }
.glass-card--orange { background: var(--card-orange); }
.glass-card--green { background: var(--card-green); }
</style>
