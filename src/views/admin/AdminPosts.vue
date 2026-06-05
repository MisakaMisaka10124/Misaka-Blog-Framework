<template>
  <div class="admin-posts">
    <!-- 顶部操作栏 -->
    <div class="admin-posts__toolbar">
      <div class="admin-posts__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章..."
          class="admin-posts__search-input"
        />
      </div>
      <router-link to="/admin/posts/new" class="admin-posts__create-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新建文章
      </router-link>
    </div>

    <!-- 文章列表 -->
    <div class="admin-posts__list">
      <div class="admin-posts__table-header">
        <div class="admin-posts__col admin-posts__col--title">标题</div>
        <div class="admin-posts__col admin-posts__col--slug">Slug</div>
        <div class="admin-posts__col admin-posts__col--tags">标签</div>
        <div class="admin-posts__col admin-posts__col--date">日期</div>
        <div class="admin-posts__col admin-posts__col--words">字数</div>
        <div class="admin-posts__col admin-posts__col--actions">操作</div>
      </div>

      <div
        v-for="post in filteredPosts"
        :key="post.slug"
        class="admin-posts__item"
      >
        <div class="admin-posts__col admin-posts__col--title">
          <router-link
            :to="`/admin/posts/${post.slug}`"
            class="admin-posts__post-link"
          >
            {{ post.title }}
          </router-link>
        </div>
        <div class="admin-posts__col admin-posts__col--slug">
          <code class="admin-posts__slug">{{ post.slug }}</code>
        </div>
        <div class="admin-posts__col admin-posts__col--tags">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="admin-posts__tag"
          >
            {{ tag }}
          </span>
        </div>
        <div class="admin-posts__col admin-posts__col--date">
          {{ post.date }}
        </div>
        <div class="admin-posts__col admin-posts__col--words">
          {{ post.wordCount }} 字
        </div>
        <div class="admin-posts__col admin-posts__col--actions">
          <router-link
            :to="`/admin/posts/${post.slug}`"
            class="admin-posts__action-btn admin-posts__action-btn--edit"
          >
            编辑
          </router-link>
          <button
            class="admin-posts__action-btn admin-posts__action-btn--delete"
            @click="handleDelete(post)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="!filteredPosts.length" class="admin-posts__empty">
        {{ searchQuery ? '没有找到匹配的文章' : '暂无文章' }}
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <Teleport to="body">
      <div v-if="showDeleteDialog" class="admin-posts__dialog-overlay">
        <div class="admin-posts__dialog">
          <h3 class="admin-posts__dialog-title">确认删除</h3>
          <p class="admin-posts__dialog-message">
            确定要删除文章「{{ deletingPost?.title }}」吗？此操作不可撤销。
          </p>
          <div class="admin-posts__dialog-actions">
            <button
              class="admin-posts__dialog-btn admin-posts__dialog-btn--cancel"
              @click="showDeleteDialog = false"
            >
              取消
            </button>
            <button
              class="admin-posts__dialog-btn admin-posts__dialog-btn--confirm"
              :disabled="deleting"
              @click="confirmDelete"
            >
              {{ deleting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

interface PostMeta {
  slug: string
  title: string
  summary: string
  cover?: string
  tags: string[]
  date: string
  wordCount: number
  readTime: number
}

const posts = ref<PostMeta[]>([])
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const deletingPost = ref<PostMeta | null>(null)
const deleting = ref(false)

const filteredPosts = computed(() => {
  if (!searchQuery.value) {
    return posts.value.sort((a, b) => b.date.localeCompare(a.date))
  }

  const query = searchQuery.value.toLowerCase()
  return posts.value
    .filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
})

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/posts/index')
    posts.value = data.posts || []
  } catch (e) {
    console.warn('Failed to load posts:', e)
  }
})

function handleDelete(post: PostMeta) {
  deletingPost.value = post
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingPost.value) return

  deleting.value = true
  try {
    await axios.delete(`/api/posts/${deletingPost.value.slug}`)
    posts.value = posts.value.filter(
      (p) => p.slug !== deletingPost.value?.slug
    )
    showDeleteDialog.value = false
    deletingPost.value = null
  } catch (e) {
    console.error('Failed to delete post:', e)
    alert('删除失败')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.admin-posts {
  max-width: 1200px;
}

/* 工具栏 */
.admin-posts__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  gap: var(--space-lg);
}

.admin-posts__search {
  flex: 1;
  max-width: 400px;
}

.admin-posts__search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 0.95em;
  outline: none;
  transition: border-color 0.2s ease;
}

.admin-posts__search-input:focus {
  border-color: var(--color-accent);
}

.admin-posts__create-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-accent);
  color: #fff;
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-size: 0.95em;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.admin-posts__create-btn:hover {
  background: var(--color-accent-hover);
}

/* 列表 */
.admin-posts__list {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.admin-posts__table-header {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid var(--glass-border);
  font-weight: 600;
  font-size: 0.85em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-posts__item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
  transition: background 0.2s ease;
}

.admin-posts__item:last-child {
  border-bottom: none;
}

.admin-posts__item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.admin-posts__col {
  padding: 0 var(--space-sm);
}

.admin-posts__col--title {
  flex: 3;
  min-width: 0;
}

.admin-posts__col--slug {
  flex: 1.5;
  min-width: 0;
}

.admin-posts__col--tags {
  flex: 1.5;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.admin-posts__col--date {
  flex: 1;
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.admin-posts__col--words {
  flex: 0.8;
  font-size: 0.9em;
  color: var(--color-text-secondary);
  text-align: right;
}

.admin-posts__col--actions {
  flex: 1.2;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.admin-posts__post-link {
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-posts__post-link:hover {
  color: var(--color-accent);
}

.admin-posts__slug {
  font-size: 0.85em;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  font-family: monospace;
}

.admin-posts__tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-accent);
  border-radius: 3px;
  font-size: 0.8em;
}

.admin-posts__action-btn {
  padding: 4px 12px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.admin-posts__action-btn--edit {
  color: var(--color-accent);
  background: transparent;
}

.admin-posts__action-btn--edit:hover {
  background: rgba(99, 102, 241, 0.1);
}

.admin-posts__action-btn--delete {
  color: #ef4444;
  background: transparent;
}

.admin-posts__action-btn--delete:hover {
  background: rgba(239, 68, 68, 0.1);
}

.admin-posts__empty {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--color-text-secondary);
}

/* 删除确认对话框 */
.admin-posts__dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.admin-posts__dialog {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  max-width: 400px;
  width: 90%;
}

.admin-posts__dialog-title {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
}

.admin-posts__dialog-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
  line-height: 1.5;
}

.admin-posts__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
}

.admin-posts__dialog-btn {
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-posts__dialog-btn--cancel {
  background: transparent;
  color: var(--color-text-primary);
}

.admin-posts__dialog-btn--cancel:hover {
  background: rgba(255, 255, 255, 0.05);
}

.admin-posts__dialog-btn--confirm {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.admin-posts__dialog-btn--confirm:hover:not(:disabled) {
  background: #dc2626;
}

.admin-posts__dialog-btn--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-posts__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-posts__search {
    max-width: 100%;
  }

  .admin-posts__table-header {
    display: none;
  }

  .admin-posts__item {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .admin-posts__col--title {
    flex-basis: 100%;
  }

  .admin-posts__col--slug,
  .admin-posts__col--tags,
  .admin-posts__col--date,
  .admin-posts__col--words {
    flex-basis: auto;
  }

  .admin-posts__col--words {
    text-align: left;
  }

  .admin-posts__col--actions {
    flex-basis: 100%;
    justify-content: flex-start;
  }
}
</style>
