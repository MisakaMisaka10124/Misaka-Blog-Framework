<template>
  <div class="admin-friends">
    <div class="admin-friends__header">
      <h2 class="admin-friends__title">友链管理</h2>
      <button
        class="admin-friends__add-btn"
        @click="showAddDialog = true"
      >
        + 添加友链
      </button>
    </div>

    <!-- 友链列表 -->
    <div class="admin-friends__list">
      <div
        v-for="(link, index) in friendLinks"
        :key="index"
        class="admin-friends__item"
      >
        <div class="admin-friends__item-avatar">
          <img
            :src="link.avatar || defaultFriendAvatar"
            :alt="link.name"
          />
        </div>
        <div class="admin-friends__item-info">
          <div class="admin-friends__item-name">{{ link.name }}</div>
          <div class="admin-friends__item-desc">{{ link.desc }}</div>
          <a
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-friends__item-url"
          >
            {{ link.url }}
          </a>
        </div>
        <div class="admin-friends__item-actions">
          <button
            class="admin-friends__action-btn admin-friends__action-btn--edit"
            @click="editFriend(index)"
          >
            编辑
          </button>
          <button
            class="admin-friends__action-btn admin-friends__action-btn--delete"
            @click="deleteFriend(index)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="!friendLinks.length" class="admin-friends__empty">
        暂无友链，点击上方按钮添加
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <Teleport to="body">
      <div
        v-if="showAddDialog || editingIndex !== null"
        class="admin-friends__dialog-overlay"
      >
        <div class="admin-friends__dialog">
          <h3 class="admin-friends__dialog-title">
            {{ editingIndex !== null ? '编辑友链' : '添加友链' }}
          </h3>

          <form
            class="admin-friends__dialog-form"
            @submit.prevent="handleSave"
          >
            <div class="admin-friends__dialog-field">
              <label>名称 *</label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="友链名称"
                required
              />
            </div>

            <div class="admin-friends__dialog-field">
              <label>描述</label>
              <input
                v-model="formData.desc"
                type="text"
                placeholder="简短描述"
              />
            </div>

            <div class="admin-friends__dialog-field">
              <label>链接 *</label>
              <input
                v-model="formData.url"
                type="url"
                placeholder="https://example.com"
                required
              />
            </div>

            <div class="admin-friends__dialog-field">
              <label>头像</label>
              <div class="admin-friends__avatar-input">
                <input
                  ref="avatarInputRef"
                  type="file"
                  accept="image/*"
                  @change="handleAvatarSelect"
                  hidden
                />
                <button
                  type="button"
                  class="admin-friends__avatar-btn"
                  @click="avatarInputRef?.click()"
                >
                  上传头像
                </button>
                <span class="admin-friends__avatar-hint">
                  或输入URL:
                </span>
                <input
                  v-model="formData.avatar"
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  class="admin-friends__avatar-url"
                />
              </div>
              <div
                v-if="avatarPreview"
                class="admin-friends__avatar-preview"
              >
                <img :src="avatarPreview" alt="头像预览" />
              </div>
            </div>

            <div class="admin-friends__dialog-actions">
              <button
                type="button"
                class="admin-friends__dialog-btn admin-friends__dialog-btn--cancel"
                @click="handleCancel"
              >
                取消
              </button>
              <button
                type="submit"
                class="admin-friends__dialog-btn admin-friends__dialog-btn--confirm"
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
        class="admin-friends__dialog-overlay"
      >
        <div class="admin-friends__dialog">
          <h3 class="admin-friends__dialog-title">确认删除</h3>
          <p class="admin-friends__dialog-message">
            确定要删除友链「{{ friendLinks[deletingIndex]?.name }}」吗？
          </p>
          <div class="admin-friends__dialog-actions">
            <button
              class="admin-friends__dialog-btn admin-friends__dialog-btn--cancel"
              @click="deletingIndex = null"
            >
              取消
            </button>
            <button
              class="admin-friends__dialog-btn admin-friends__dialog-btn--confirm"
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
    <p v-if="error" class="admin-friends__error">{{ error }}</p>
    <p v-if="success" class="admin-friends__success">{{ success }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface FriendLink {
  name: string
  avatar: string
  desc: string
  url: string
}

const friendLinks = ref<FriendLink[]>([])
const showAddDialog = ref(false)
const editingIndex = ref<number | null>(null)
const deletingIndex = ref<number | null>(null)
const saving = ref(false)
const error = ref('')
const success = ref('')
const defaultFriendAvatar = ref('/images/avatars/avatar1.jpg')

const avatarInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref('')

const formData = ref<FriendLink>({
  name: '',
  avatar: '',
  desc: '',
  url: '',
})

// 加载友链
async function loadFriends() {
  try {
    const { data } = await axios.get('/api/admin/friends')
    friendLinks.value = data.friendLinks || []
  } catch (e: any) {
    error.value = '加载友链失败: ' + (e.response?.data?.error || e.message)
  }
}

// 头像上传
function handleAvatarSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // 上传文件
    const formDataObj = new FormData()
    formDataObj.append('image', file)
    axios
      .post('/api/admin/upload/friends', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(({ data }) => {
        formData.value.avatar = data.url
      })
      .catch((err) => {
        error.value = '头像上传失败'
        console.error(err)
      })
  }
}

// 编辑友链
function editFriend(index: number) {
  editingIndex.value = index
  formData.value = { ...friendLinks.value[index] }
  avatarPreview.value = formData.value.avatar
}

// 删除友链
function deleteFriend(index: number) {
  deletingIndex.value = index
}

// 确认删除
async function confirmDelete() {
  if (deletingIndex.value === null) return

  saving.value = true
  try {
    friendLinks.value.splice(deletingIndex.value, 1)
    await axios.put('/api/admin/friends', {
      friendLinks: friendLinks.value,
    })
    success.value = '删除成功'
    deletingIndex.value = null
  } catch (e: any) {
    error.value = '删除失败: ' + (e.response?.data?.error || e.message)
    await loadFriends()
  } finally {
    saving.value = false
  }
}

// 保存友链
async function handleSave() {
  if (!formData.value.name || !formData.value.url) {
    error.value = '请填写必填字段'
    return
  }

  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingIndex.value !== null) {
      // 编辑
      friendLinks.value[editingIndex.value] = { ...formData.value }
    } else {
      // 添加
      friendLinks.value.push({ ...formData.value })
    }

    await axios.put('/api/admin/friends', {
      friendLinks: friendLinks.value,
    })

    success.value = editingIndex.value !== null ? '更新成功' : '添加成功'
    handleCancel()
  } catch (e: any) {
    error.value = '保存失败: ' + (e.response?.data?.error || e.message)
    await loadFriends()
  } finally {
    saving.value = false
  }
}

// 取消
function handleCancel() {
  showAddDialog.value = false
  editingIndex.value = null
  formData.value = { name: '', avatar: '', desc: '', url: '' }
  avatarPreview.value = ''
}

// 加载服务器配置
async function loadServerConfig() {
  try {
    const { data } = await axios.get('/api/server-config')
    if (data.defaults?.friendAvatar) {
      defaultFriendAvatar.value = data.defaults.friendAvatar
    }
  } catch {
    // 使用默认值
  }
}

// 生命周期
onMounted(() => {
  loadFriends()
  loadServerConfig()
})
</script>

<style scoped>
.admin-friends {
  max-width: 900px;
}

/* 头部 */
.admin-friends__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.admin-friends__title {
  font-size: 1.4em;
  color: var(--color-text-primary);
}

.admin-friends__add-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-friends__add-btn:hover {
  background: var(--color-accent-hover);
}

/* 列表 */
.admin-friends__list {
  background: var(--color-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.admin-friends__item {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
  transition: background 0.2s ease;
}

.admin-friends__item:last-child {
  border-bottom: none;
}

.admin-friends__item:hover {
  background: var(--admin-card-bg);
}

.admin-friends__item-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--glass-border);
  flex-shrink: 0;
  margin-right: var(--space-lg);
}

.admin-friends__item-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-friends__item-info {
  flex: 1;
  min-width: 0;
}

.admin-friends__item-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.admin-friends__item-desc {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.admin-friends__item-url {
  font-size: 0.85em;
  color: var(--color-accent);
  text-decoration: none;
  word-break: break-all;
}

.admin-friends__item-url:hover {
  text-decoration: underline;
}

.admin-friends__item-actions {
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;
  margin-left: var(--space-lg);
}

.admin-friends__action-btn {
  padding: 6px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-friends__action-btn--edit {
  color: var(--color-accent);
  background: transparent;
}

.admin-friends__action-btn--edit:hover {
  background: rgba(234, 179, 8, 0.1);
}

.admin-friends__action-btn--delete {
  color: #ef4444;
  background: transparent;
}

.admin-friends__action-btn--delete:hover {
  background: rgba(239, 68, 68, 0.1);
}

.admin-friends__empty {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--color-text-secondary);
}

/* 对话框 */
.admin-friends__dialog-overlay {
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

.admin-friends__dialog-overlay * {
  cursor: auto;
}

.admin-friends__dialog {
  background: var(--admin-dialog-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.admin-friends__dialog-title {
  font-size: 1.2em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
}

.admin-friends__dialog-message {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

/* 表单 */
.admin-friends__dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-friends__dialog-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-friends__dialog-field label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.admin-friends__dialog-field input {
  background: var(--admin-hover-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.95em;
  outline: none;
  transition: var(--transition-fast);
}

.admin-friends__dialog-field input:focus {
  border-color: var(--color-accent);
  background: var(--admin-hover-bg);
}

/* 头像输入 */
.admin-friends__avatar-input {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  flex-wrap: wrap;
}

.admin-friends__avatar-btn {
  padding: var(--space-sm) var(--space-md);
  background: var(--admin-hover-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 0.85em;
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.admin-friends__avatar-btn:hover {
  background: var(--admin-active-bg);
}

.admin-friends__avatar-hint {
  font-size: 0.85em;
  color: var(--color-text-muted);
}

.admin-friends__avatar-url {
  flex: 1;
  min-width: 150px;
}

.admin-friends__avatar-preview {
  margin-top: var(--space-md);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--glass-border);
}

.admin-friends__avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 对话框按钮 */
.admin-friends__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.admin-friends__dialog-btn {
  padding: var(--space-sm) var(--space-lg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-friends__dialog-btn--cancel {
  background: transparent;
  color: var(--color-text-primary);
}

.admin-friends__dialog-btn--cancel:hover {
  background: var(--admin-hover-bg);
}

.admin-friends__dialog-btn--confirm {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.admin-friends__dialog-btn--confirm:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.admin-friends__dialog-btn--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 状态消息 */
.admin-friends__error {
  color: #ef4444;
  font-size: 0.9em;
  margin-top: var(--space-lg);
}

.admin-friends__success {
  color: #22c55e;
  font-size: 0.9em;
  margin-top: var(--space-lg);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .admin-friends__header {
    flex-direction: column;
    gap: var(--space-md);
    align-items: stretch;
  }

  .admin-friends__item {
    flex-wrap: wrap;
  }

  .admin-friends__item-avatar {
    margin-bottom: var(--space-md);
  }

  .admin-friends__item-info {
    flex-basis: 100%;
  }

  .admin-friends__item-actions {
    margin-left: 0;
    margin-top: var(--space-md);
  }
}
</style>
