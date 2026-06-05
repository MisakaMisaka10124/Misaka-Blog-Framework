<template>
  <div class="home">
    <div class="home__layout">
      <!-- 左栏：整体资料卡 -->
      <aside class="home__sidebar">
        <GlassCard class="home__profile-card">
          <!-- 头像居中 -->
          <div class="home__profile-header">
            <img :src="defaultAvatar" alt="avatar" class="home__avatar" />
            <h2 class="home__profile-name">{{ config.siteTitle || 'Misaka10124' }}</h2>
            <p class="home__profile-tagline">{{ config.hero?.subtitle || config.welcomeMessage }}</p>
          </div>

          <!-- 关于我 -->
          <div class="home__about" v-if="config.about">
            <p class="home__about-text">{{ config.about }}</p>
          </div>

          <!-- 入口链接 -->
          <div class="home__entries">
            <router-link to="/categories" class="home__entry">博客空间</router-link>
            <router-link to="/friends" class="home__entry">友情链接</router-link>
            <router-link to="/about" class="home__entry">关于本站</router-link>
          </div>

          <!-- 社交图标 -->
          <div class="home__social-icons" v-if="config.socialLinks?.length">
            <a
              v-for="link in config.socialLinks"
              :key="link.platform"
              :href="socialUrl(link)"
              :target="link.platform === 'email' ? undefined : '_blank'"
              rel="noopener"
              class="home__social-icon"
            >
              <img :src="`/images/social/${link.icon}.svg`" :alt="link.platform" />
            </a>
          </div>
        </GlassCard>
      </aside>

      <!-- 右栏：博客文章 -->
      <section class="home__posts" v-if="posts.length">
        <h2 class="home__section-title">最新文章</h2>
        <div class="home__posts-list">
          <PostCard v-for="post in pagedPosts" :key="post.slug" :post="post" />
        </div>

        <!-- 翻页 -->
        <div class="home__pagination" v-if="totalPages > 1">
          <button class="home__page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p === '...'" class="home__page-dots">...</span>
            <button v-else class="home__page-btn" :class="{ active: p === currentPage }" @click="currentPage = p as number">{{ p }}</button>
          </template>
          <button class="home__page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
        </div>
      </section>

      <!-- 无文章提示 -->
      <section class="home__posts home__posts--empty" v-else>
        <p>暂无文章</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import GlassCard from '../components/GlassCard.vue'
import PostCard from '../components/PostCard.vue'
import type { SiteConfig, PostMeta } from '../types'

const config = ref<SiteConfig>({
  siteTitle: '',
  welcomeMessage: '',
  navLinks: [],
  socialLinks: [],
})

const posts = ref<PostMeta[]>([])
const currentPage = ref(1)
const pageSize = ref(5)
const defaultAvatar = ref('/images/avatar1.jpg')

function socialUrl(link: { platform: string; url: string }): string {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`
  }
  return link.url
}

const totalPages = computed(() => Math.ceil(posts.value.length / pageSize.value))

const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return posts.value.slice(start, start + pageSize.value)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

async function loadData() {
  try {
    const [configRes, indexRes] = await Promise.all([
      axios.get('/api/config'),
      axios.get('/api/posts/index').catch(() => ({ data: { posts: [] } })),
    ])
    config.value = configRes.data
    posts.value = indexRes.data.posts || []

    // 从服务器配置获取分页大小和默认头像
    try {
      const serverConfigRes = await axios.get('/api/server-config')
      if (serverConfigRes.data.display?.homePostsPerPage) {
        pageSize.value = serverConfigRes.data.display.homePostsPerPage
      }
      if (serverConfigRes.data.defaults?.avatar) {
        defaultAvatar.value = serverConfigRes.data.defaults.avatar
      }
    } catch {
      // 使用默认值
    }
  } catch (e) {
    console.warn('Failed to load data:', e)
  }
}

onMounted(loadData)
</script>

<style scoped>
.home {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-lg);
}

.home__layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: var(--space-xl);
  align-items: start;
}

/* 左栏 */
.home__sidebar {
  position: sticky;
  top: calc(var(--navbar-height) + var(--space-lg));
}

.home__profile-card {
  padding: var(--space-lg) !important;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 头像居中，名称在下方 */
.home__profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.home__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--glass-border);
  object-fit: cover;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin-bottom: var(--space-sm);
}

.home__profile-name {
  font-size: 1.15em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.home__profile-tagline {
  color: var(--color-text-secondary);
  font-size: 0.85em;
}

/* 关于我 */
.home__about-text {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  line-height: 1.6;
  text-indent: 2em;
}

/* 入口链接：居中均分 */
.home__entries {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
  padding: var(--space-sm) 0;
}

.home__entry {
  flex: 1;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.9em;
  text-decoration: none;
  padding: var(--space-xs) 0;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.home__entry:not(:last-child) {
  border-right: 1px solid var(--glass-border);
}

.home__entry:hover {
  color: var(--color-text-primary);
}

/* 社交图标：居中 */
.home__social-icons {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
}

.home__social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  transition: var(--transition-fast);
}

.home__social-icon img {
  width: 18px;
  height: 18px;
  filter: brightness(0.8);
}

.home__social-icon:hover {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-2px);
}

/* 右栏：文章列表 */
.home__posts {
  min-width: 0;
}

.home__posts--empty {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-secondary);
}

.home__section-title {
  font-size: 1.3em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--glass-border);
}

.home__posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 翻页 */
.home__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  padding: var(--space-lg) 0;
}

.home__page-btn {
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 0.9em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.home__page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.home__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.home__page-btn.active {
  background: var(--color-accent);
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}

.home__page-dots {
  color: var(--color-text-muted);
  padding: 0 4px;
}

@media (max-width: 900px) {
  .home__layout {
    grid-template-columns: 1fr;
  }

  .home__sidebar {
    position: static;
  }
}
</style>
