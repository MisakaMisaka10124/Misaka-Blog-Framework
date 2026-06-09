<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="dashboard__stats">
      <div class="dashboard__stat-card">
        <div class="dashboard__stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div class="dashboard__stat-info">
          <div class="dashboard__stat-value">{{ stats.totalPosts }}</div>
          <div class="dashboard__stat-label">文章总数</div>
        </div>
      </div>

      <div class="dashboard__stat-card">
        <div class="dashboard__stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </div>
        <div class="dashboard__stat-info">
          <div class="dashboard__stat-value">{{ stats.totalTags }}</div>
          <div class="dashboard__stat-label">标签总数</div>
        </div>
      </div>

      <div class="dashboard__stat-card">
        <div class="dashboard__stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="dashboard__stat-info">
          <div class="dashboard__stat-value">{{ stats.totalVisitors }}</div>
          <div class="dashboard__stat-label">总访问量</div>
        </div>
      </div>

      <div class="dashboard__stat-card">
        <div class="dashboard__stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="dashboard__stat-info">
          <div class="dashboard__stat-value">{{ stats.todayVisitors }}</div>
          <div class="dashboard__stat-label">今日访问</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="dashboard__section">
      <h2 class="dashboard__section-title">快捷操作</h2>
      <div class="dashboard__actions">
        <router-link to="/admin/posts/new" class="dashboard__action-card">
          <div class="dashboard__action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
          <div class="dashboard__action-label">新建文章</div>
        </router-link>

        <router-link to="/admin/settings" class="dashboard__action-card">
          <div class="dashboard__action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <div class="dashboard__action-label">站点设置</div>
        </router-link>

        <router-link to="/admin/friends" class="dashboard__action-card">
          <div class="dashboard__action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <div class="dashboard__action-label">管理友链</div>
        </router-link>

        <router-link to="/admin/social" class="dashboard__action-card">
          <div class="dashboard__action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="dashboard__action-label">社交媒体</div>
        </router-link>
      </div>
    </div>

    <!-- 最近文章 -->
    <div class="dashboard__section">
      <h2 class="dashboard__section-title">最近文章</h2>
      <div class="dashboard__recent-posts">
        <div
          v-for="post in recentPosts"
          :key="post.slug"
          class="dashboard__post-item"
        >
          <div class="dashboard__post-info">
            <router-link
              :to="`/admin/posts/${post.slug}`"
              class="dashboard__post-title"
            >
              {{ post.title }}
            </router-link>
            <div class="dashboard__post-meta">
              <span>{{ post.date }}</span>
              <span v-if="post.tags?.length">
                · {{ post.tags.join(', ') }}
              </span>
            </div>
          </div>
          <router-link
            :to="`/admin/posts/${post.slug}`"
            class="dashboard__post-edit"
          >
            编辑
          </router-link>
        </div>

        <div v-if="!recentPosts.length" class="dashboard__empty">
          暂无文章
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface PostMeta {
  slug: string
  title: string
  summary: string
  cover?: string
  tags: string[]
  date: string
  wordCount: number
  readTime: string
}

const stats = ref({
  totalPosts: 0,
  totalTags: 0,
  totalVisitors: 0,
  todayVisitors: 0,
})

const recentPosts = ref<PostMeta[]>([])

onMounted(async () => {
  try {
    // 一次性加载预计算的站点统计
    const { data } = await axios.get('/api/visitor/site-stats')
    stats.value.totalPosts = data.totalPosts || 0
    stats.value.totalTags = data.totalTags || 0
    stats.value.totalVisitors = data.totalVisitors || 0
    stats.value.todayVisitors = data.todayVisitors || 0
    recentPosts.value = data.recentPosts || []
  } catch (e) {
    console.warn('Failed to load site stats:', e)
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

/* 统计卡片 */
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

.dashboard__stat-card {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard__stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard__stat-icon {
  font-size: 2em;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(234, 179, 8, 0.1);
  border-radius: var(--radius-md);
}

.dashboard__stat-value {
  font-size: 1.8em;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.dashboard__stat-label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}

/* 区块标题 */
.dashboard__section {
  margin-bottom: var(--space-2xl);
}

.dashboard__section-title {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid var(--color-accent);
  display: inline-block;
}

/* 快捷操作 */
.dashboard__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-lg);
}

.dashboard__action-card {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  text-align: center;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.dashboard__action-card:hover {
  background: rgba(234, 179, 8, 0.1);
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.dashboard__action-icon {
  font-size: 2em;
  margin-bottom: var(--space-md);
}

.dashboard__action-label {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 最近文章 */
.dashboard__recent-posts {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.dashboard__post-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--glass-border);
  transition: background 0.2s ease;
}

.dashboard__post-item:last-child {
  border-bottom: none;
}

.dashboard__post-item:hover {
  background: var(--admin-card-bg);
}

.dashboard__post-info {
  flex: 1;
  min-width: 0;
}

.dashboard__post-title {
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard__post-title:hover {
  color: var(--color-accent);
}

.dashboard__post-meta {
  font-size: 0.85em;
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}

.dashboard__post-edit {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.9em;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: var(--space-md);
}

.dashboard__post-edit:hover {
  background: var(--color-accent);
  color: #fff;
}

.dashboard__empty {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--color-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard__actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .dashboard__stats {
    grid-template-columns: 1fr;
  }

  .dashboard__actions {
    grid-template-columns: 1fr;
  }
}
</style>
