<template>
  <router-link
    v-if="clickable"
    :to="`/categories/${tag}`"
    class="tag-badge tag-badge--clickable"
  >
    {{ tag }}
  </router-link>
  <span v-else class="tag-badge">
    {{ tag }}
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tag: string
  clickable?: boolean
}>(), {
  clickable: true,
})
</script>

<style scoped>
.tag-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 0.75em;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(59, 130, 246, 0.25);
  transition: var(--transition-fast);
}

.tag-badge--clickable {
  text-decoration: none;
}

.tag-badge--clickable:hover {
  background: rgba(59, 130, 246, 0.3);
  color: var(--color-accent-hover);
}
</style>
