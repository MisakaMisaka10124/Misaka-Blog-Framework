<template>
  <div class="admin-social">
    <div class="admin-social__header">
      <h2 class="admin-social__title">社交媒体管理</h2>
      <span class="admin-social__count">{{ socialLinks.length }}/{{ maxSocialLinks }}</span>
    </div>

    <p class="admin-social__hint">
      最多可添加 {{ maxSocialLinks }} 个社交媒体链接，支持常见平台如 GitHub、Bilibili、Twitter、QQ空间等。
    </p>

    <!-- 社交媒体列表 -->
    <div class="admin-social__list">
      <div
        v-for="(link, index) in socialLinks"
        :key="index"
        class="admin-social__item"
      >
        <div class="admin-social__item-icon">
          <img
            :src="getIconUrl(link.icon)"
            :alt="link.platform"
            @error="handleIconError"
          />
        </div>
        <div class="admin-social__item-info">
          <div class="admin-social__item-platform">{{ link.platform }}</div>
          <a
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-social__item-url"
          >
            {{ link.url }}
          </a>
        </div>
        <div class="admin-social__item-actions">
          <button
            class="admin-social__action-btn admin-social__action-btn--edit"
            @click="editSocial(index)"
          >
            编辑
          </button>
          <button
            class="admin-social__action-btn admin-social__action-btn--delete"
            @click="deleteSocial(index)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="!socialLinks.length" class="admin-social__empty">
        暂无社交媒体链接
      </div>
    </div>

    <!-- 添加按钮 -->
    <button
      v-if="socialLinks.length < maxSocialLinks"
      class="admin-social__add-btn"
      @click="showDialog = true"
    >
      + 添加社交媒体
    </button>

    <!-- 添加/编辑对话框 -->
    <Teleport to="body">
      <div
        v-if="showDialog || editingIndex !== null"
        class="admin-social__dialog-overlay"
      >
        <div class="admin-social__dialog">
          <h3 class="admin-social__dialog-title">
            {{ editingIndex !== null ? '编辑社交媒体' : '添加社交媒体' }}
          </h3>

          <form
            class="admin-social__dialog-form"
            @submit.prevent="handleSave"
          >
            <div class="admin-social__dialog-field">
              <label>平台名称 *</label>
              <input
                v-model="formData.platform"
                type="text"
                placeholder="如：GitHub、Bilibili、QQ空间"
                required
              />
            </div>

            <div class="admin-social__dialog-field">
              <label>链接地址 *</label>
              <input
                v-model="formData.url"
                type="url"
                placeholder="https://..."
                required
              />
            </div>

            <div class="admin-social__dialog-field">
              <label>图标</label>
              <div class="admin-social__icon-selector">
                <div class="admin-social__icon-grid">
                  <div
                    v-for="icon in availableIcons"
                    :key="icon.id"
                    class="admin-social__icon-option"
                    :class="{
                      'admin-social__icon-option--selected':
                        formData.icon === icon.id,
                    }"
                    @click="selectIcon(icon)"
                  >
                    <img :src="icon.url" :alt="icon.name" />
                    <span>{{ icon.name }}</span>
                  </div>
                </div>
                <div class="admin-social__icon-custom">
                  <span class="admin-social__icon-custom-hint">
                    或输入自定义图标URL:
                  </span>
                  <input
                    v-model="formData.icon"
                    type="text"
                    placeholder="https://example.com/icon.svg"
                  />
                </div>
              </div>
            </div>

            <div class="admin-social__dialog-actions">
              <button
                type="button"
                class="admin-social__dialog-btn admin-social__dialog-btn--cancel"
                @click="handleCancel"
              >
                取消
              </button>
              <button
                type="submit"
                class="admin-social__dialog-btn admin-social__dialog-btn--confirm"
                :disabled="saving"
              >
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认对话框 -->
    <Teleport to="body">
      <div
        v-if="deletingIndex !== null"
        class="admin-social__dialog-overlay"
      >
        <div class="admin-social__dialog">
          <h3 class="admin-social__dialog-title">确认删除</h3>
          <p class="admin-social__dialog-message">
            确定要删除「{{ socialLinks[deletingIndex]?.platform }}」吗？
          </p>
          <div class="admin-social__dialog-actions">
            <button
              class="admin-social__dialog-btn admin-social__dialog-btn--cancel"
              @click="deletingIndex = null"
            >
              取消
            </button>
            <button
              class="admin-social__dialog-btn admin-social__dialog-btn--confirm"
              :disabled="saving"
              @click="confirmDelete"
            >
              {{ saving ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 状态消息 -->
    <p v-if="error" class="admin-social__error">{{ error }}</p>
    <p v-if="success" class="admin-social__success">{{ success }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface SocialLink {
  platform: string
  url: string
  icon: string
}

interface IconOption {
  id: string
  name: string
  url: string
}

const socialLinks = ref<SocialLink[]>([])
const availableIcons = ref<IconOption[]>([])
const showDialog = ref(false)
const editingIndex = ref<number | null>(null)
const deletingIndex = ref<number | null>(null)
const saving = ref(false)
const error = ref('')
const success = ref('')
const maxSocialLinks = ref(4)
const defaultSocialIcon = ref('/images/social/github.svg')

const formData = ref<SocialLink>({
  platform: '',
  url: '',
  icon: '',
})

// 获取图标URL
function getIconUrl(icon: string): string {
  if (!icon) return defaultSocialIcon.value
  if (icon.startsWith('http')) return icon
  return `/images/social/${icon}.svg`
}

// 图标加载失败处理
function handleIconError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = defaultSocialIcon.value
}

// 选择图标
function selectIcon(icon: IconOption) {
  formData.value.icon = icon.id
}

// 加载社交媒体列表
async function loadSocialLinks() {
  try {
    const { data } = await axios.get('/api/admin/social')
    socialLinks.value = data.socialLinks || []
  } catch (e: any) {
    error.value = '加载失败: ' + (e.response?.data?.error || e.message)
  }
}

// 加载可用图标
async function loadIcons() {
  try {
    const { data } = await axios.get('/api/admin/social/icons')
    availableIcons.value = data.icons || []
  } catch (e: any) {
    console.warn('Failed to load icons:', e)
    // 使用默认图标列表（从服务器配置或硬编码）
    try {
      const { data: serverConfig } = await axios.get('/api/server-config')
      if (serverConfig.fallbackImages?.socialIcons) {
        availableIcons.value = serverConfig.fallbackImages.socialIcons
      } else {
        availableIcons.value = [
          { id: 'github', name: 'GitHub', url: '/images/social/github.svg' },
          { id: 'bilibili', name: 'Bilibili', url: '/images/social/bilibili.svg' },
          { id: 'twitter', name: 'Twitter/X', url: '/images/social/twitter.svg' },
          { id: 'email', name: '邮箱', url: '/images/social/email.svg' },
          { id: 'qq', name: 'QQ', url: '/images/social/qq.svg' },
          { id: 'wechat', name: '微信', url: '/images/social/wechat.svg' },
          { id: 'telegram', name: 'Telegram', url: '/images/social/telegram.svg' },
          { id: 'discord', name: 'Discord', url: '/images/social/discord.svg' },
          { id: 'youtube', name: 'YouTube', url: '/images/social/youtube.svg' },
          { id: 'steam', name: 'Steam', url: '/images/social/steam.svg' },
          { id: 'instagram', name: 'Instagram', url: '/images/social/instagram.svg' },
          { id: 'weibo', name: '微博', url: '/images/social/weibo.svg' },
        ]
      }
    } catch {
      availableIcons.value = [
        { id: 'github', name: 'GitHub', url: '/images/social/github.svg' },
        { id: 'bilibili', name: 'Bilibili', url: '/images/social/bilibili.svg' },
        { id: 'twitter', name: 'Twitter/X', url: '/images/social/twitter.svg' },
        { id: 'email', name: '邮箱', url: '/images/social/email.svg' },
        { id: 'qq', name: 'QQ', url: '/images/social/qq.svg' },
        { id: 'wechat', name: '微信', url: '/images/social/wechat.svg' },
        { id: 'telegram', name: 'Telegram', url: '/images/social/telegram.svg' },
        { id: 'discord', name: 'Discord', url: '/images/social/discord.svg' },
        { id: 'youtube', name: 'YouTube', url: '/images/social/youtube.svg' },
        { id: 'steam', name: 'Steam', url: '/images/social/steam.svg' },
        { id: 'instagram', name: 'Instagram', url: '/images/social/instagram.svg' },
        { id: 'weibo', name: '微博', url: '/images/social/weibo.svg' },
      ]
    }
  }
}

// 编辑
function editSocial(index: number) {
  editingIndex.value = index
  formData.value = { ...socialLinks.value[index] }
}

// 删除
function deleteSocial(index: number) {
  deletingIndex.value = index
}

// 确认删除
async function confirmDelete() {
  if (deletingIndex.value === null) return

  saving.value = true
  try {
    socialLinks.value.splice(deletingIndex.value, 1)
    await axios.put('/api/admin/social', {
      socialLinks: socialLinks.value,
    })
    success.value = '删除成功'
    deletingIndex.value = null
  } catch (e: any) {
    error.value = '删除失败: ' + (e.response?.data?.error || e.message)
    await loadSocialLinks()
  } finally {
    saving.value = false
  }
}

// 保存
async function handleSave() {
  if (!formData.value.platform || !formData.value.url) {
    error.value = '请填写必填字段'
    return
  }

  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingIndex.value !== null) {
      // 编辑
      socialLinks.value[editingIndex.value] = { ...formData.value }
    } else {
      // 添加
      if (socialLinks.value.length >= maxSocialLinks.value) {
        error.value = `最多只能添加 ${maxSocialLinks.value} 个社交媒体链接`
        return
      }
      socialLinks.value.push({ ...formData.value })
    }

    await axios.put('/api/admin/social', {
      socialLinks: socialLinks.value,
    })

    success.value = editingIndex.value !== null ? '更新成功' : '添加成功'
    handleCancel()
  } catch (e: any) {
    error.value = '保存失败: ' + (e.response?.data?.error || e.message)
    await loadSocialLinks()
  } finally {
    saving.value = false
  }
}

// 取消
function handleCancel() {
  showDialog.value = false
  editingIndex.value = null
  formData.value = { platform: '', url: '', icon: '' }
}

// 加载服务器配置
async function loadServerConfig() {
  try {
    const { data } = await axios.get('/api/server-config')
    if (data.display?.maxSocialLinks) {
      maxSocialLinks.value = data.display.maxSocialLinks
    }
    if (data.defaults?.socialIcon) {
      defaultSocialIcon.value = data.defaults.socialIcon
    }
  } catch {
    // 使用默认值
  }
}

// 生命周期
onMounted(() => {
  loadSocialLinks()
  loadIcons()
  loadServerConfig()
})
</script>

<style scoped>
.admin-social {
  max-width: 800px;
}

/* 头部 */
.admin-social__header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.admin-social__title {
  font-size: 1.4em;
  color: var(--color-text-primary);
}

.admin-social__count {
  font-size: 0.9em;
  padding: 4px 12px;
  background: rgba(234, 179, 8, 0.1);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
}

.admin-social__hint {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  margin-bottom: var(--space-xl);
}

/* 列表 */
.admin-social__list {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-lg);
}

.admin-social__item {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
  transition: background 0.2s ease;
}

.admin-social__item:last-child {
  border-bottom: none;
}

.admin-social__item:hover {
  background: var(--admin-card-bg);
}

.admin-social__item-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--admin-hover-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: var(--space-lg);
}

.admin-social__item-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.admin-social__item-info {
  flex: 1;
  min-width: 0;
}

.admin-social__item-platform {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.admin-social__item-url {
  font-size: 0.85em;
  color: var(--color-accent);
  text-decoration: none;
  word-break: break-all;
}

.admin-social__item-url:hover {
  text-decoration: underline;
}

.admin-social__item-actions {
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;
  margin-left: var(--space-lg);
}

.admin-social__action-btn {
  padding: 6px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-social__action-btn--edit {
  color: var(--color-accent);
  background: transparent;
}

.admin-social__action-btn--edit:hover {
  background: rgba(234, 179, 8, 0.1);
}

.admin-social__action-btn--delete {
  color: #ef4444;
  background: transparent;
}

.admin-social__action-btn--delete:hover {
  background: rgba(239, 68, 68, 0.1);
}

.admin-social__empty {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--color-text-secondary);
}

/* 添加按钮 */
.admin-social__add-btn {
  width: 100%;
  padding: var(--space-lg);
  background: var(--color-surface);
  border: 2px dashed var(--glass-border);
  border-radius: var(--radius-lg);
  color: var(--color-accent);
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-social__add-btn:hover {
  border-color: var(--color-accent);
  background: rgba(234, 179, 8, 0.05);
}

/* 对话框 */
.admin-social__dialog-overlay {
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
  cursor: auto;
}

.admin-social__dialog-overlay * {
  cursor: auto;
}

.admin-social__dialog {
  background: var(--admin-dialog-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.admin-social__dialog-title {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
}

.admin-social__dialog-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

/* 表单 */
.admin-social__dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-social__dialog-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-social__dialog-field label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.admin-social__dialog-field input {
  background: var(--admin-hover-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.95em;
  outline: none;
  transition: var(--transition-fast);
}

.admin-social__dialog-field input:focus {
  border-color: var(--color-accent);
  background: var(--admin-hover-bg);
}

/* 图标选择器 */
.admin-social__icon-selector {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-social__icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-sm);
}

.admin-social__icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--admin-card-bg);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-social__icon-option:hover {
  background: var(--admin-hover-bg);
  border-color: var(--glass-border);
}

.admin-social__icon-option--selected {
  background: rgba(234, 179, 8, 0.1);
  border-color: var(--color-accent);
}

.admin-social__icon-option img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.admin-social__icon-option span {
  font-size: 0.75em;
  color: var(--color-text-secondary);
  text-align: center;
}

.admin-social__icon-custom {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-social__icon-custom-hint {
  font-size: 0.85em;
  color: var(--color-text-muted);
}

/* 对话框按钮 */
.admin-social__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.admin-social__dialog-btn {
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-social__dialog-btn--cancel {
  background: transparent;
  color: var(--color-text-primary);
}

.admin-social__dialog-btn--cancel:hover {
  background: var(--admin-hover-bg);
}

.admin-social__dialog-btn--confirm {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.admin-social__dialog-btn--confirm:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.admin-social__dialog-btn--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 状态消息 */
.admin-social__error {
  color: #ef4444;
  font-size: 0.9em;
  margin-top: var(--space-lg);
}

.admin-social__success {
  color: #22c55e;
  font-size: 0.9em;
  margin-top: var(--space-lg);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .admin-social__item {
    flex-wrap: wrap;
  }

  .admin-social__item-icon {
    margin-bottom: var(--space-md);
  }

  .admin-social__item-info {
    flex-basis: 100%;
  }

  .admin-social__item-actions {
    margin-left: 0;
    margin-top: var(--space-md);
  }

  .admin-social__icon-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
