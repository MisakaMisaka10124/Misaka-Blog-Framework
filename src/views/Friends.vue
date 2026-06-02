<template>
  <div class="friends">
    <h1 class="friends__title">友情链接</h1>
    <p class="friends__subtitle">感谢这些朋友们</p>

    <div class="friends__list">
      <GlassCard
        v-for="friend in friends"
        :key="friend.name"
        class="friends__card"
      >
        <div class="friends__card-inner">
          <img :src="friend.avatar" :alt="friend.name" class="friends__avatar" />
          <div class="friends__info">
            <h3 class="friends__name">{{ friend.name }}</h3>
            <p class="friends__desc">{{ friend.desc }}</p>
          </div>
          <a :href="friend.url" target="_blank" rel="noopener" class="friends__visit-btn">
            访问
          </a>
        </div>
      </GlassCard>
    </div>

    <div v-if="!friends.length && !loading" class="friends__empty">暂无友链</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import GlassCard from '../components/GlassCard.vue'
import type { FriendLink } from '../types'

const friends = ref<FriendLink[]>([])
const loading = ref(true)

async function loadFriends() {
  try {
    const { data } = await axios.get('/api/friendlinks')
    friends.value = data.friendLinks || []
  } catch (e) {
    console.warn('Failed to load friend links:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadFriends)
</script>

<style scoped>
.friends {
  max-width: 750px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg);
}

.friends__title {
  font-size: 2em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.friends__subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

.friends__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.friends__card-inner {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.friends__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--glass-border);
  flex-shrink: 0;
}

.friends__info {
  flex: 1;
  min-width: 0;
}

.friends__name {
  font-size: 1.1em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.friends__desc {
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.friends__visit-btn {
  flex-shrink: 0;
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.9em;
  transition: var(--transition-fast);
}

.friends__visit-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-text-primary);
}

.friends__empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--space-2xl);
}
</style>
