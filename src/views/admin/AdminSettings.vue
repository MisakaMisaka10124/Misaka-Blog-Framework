<template>
  <div class="admin-settings">
    <h2 class="admin-settings__title">站点设置</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="admin-settings__loading">
      加载中...
    </div>

    <!-- 设置表单 -->
    <form v-else class="admin-settings__form" @submit.prevent="handleSave">
      <!-- 基本信息 -->
      <div class="admin-settings__section">
        <h3 class="admin-settings__section-title">基本信息</h3>

        <div class="admin-settings__field">
          <label>站点头像</label>
          <div class="admin-settings__avatar-row">
            <div v-if="avatarPreview" class="admin-settings__avatar-preview">
              <img :src="avatarPreview" alt="头像预览" />
            </div>
            <div class="admin-settings__avatar-actions">
              <input
                ref="avatarInputRef"
                type="file"
                accept="image/*"
                @change="handleAvatarSelect"
                hidden
              />
              <button
                type="button"
                class="admin-settings__upload-btn"
                @click="avatarInputRef?.click()"
              >
                上传头像
              </button>
              <span class="admin-settings__field-hint">
                或输入URL:
              </span>
              <input
                v-model="avatarUrl"
                type="text"
                placeholder="https://example.com/avatar.jpg"
                class="admin-settings__url-input"
              />
            </div>
          </div>
        </div>

        <div class="admin-settings__field">
          <label>站点标题</label>
          <input
            v-model="siteTitle"
            type="text"
            placeholder="我的个人空间"
          />
        </div>

        <div class="admin-settings__field">
          <label>欢迎消息</label>
          <input
            v-model="welcomeMessage"
            type="text"
            placeholder="你好，欢迎来到我的空间！"
          />
        </div>

        <div class="admin-settings__field">
          <label>AI 聊天占位符</label>
          <input
            v-model="chatPlaceholder"
            type="text"
            placeholder="有什么想问 AI 的吗？"
          />
        </div>

        <div class="admin-settings__field">
          <label>个人简介</label>
          <textarea
            v-model="about"
            rows="4"
            placeholder="你的个人简介，会显示在首页左侧卡片中。"
          ></textarea>
        </div>

        <div class="admin-settings__field">
          <label>关于页面内容（Markdown格式）</label>
          <textarea
            v-model="aboutContent"
            rows="12"
            placeholder="输入关于页面的Markdown内容...&#10;&#10;## 标题&#10;正文内容..."
            class="admin-settings__textarea-lg"
          ></textarea>
          <span class="admin-settings__field-hint">
            支持Markdown语法，将渲染为HTML显示在关于页面
          </span>
        </div>
      </div>

      <!-- Hero 区域 -->
      <div class="admin-settings__section">
        <h3 class="admin-settings__section-title">Hero 区域</h3>

        <div class="admin-settings__field">
          <label>个性签名</label>
          <input
            v-model="heroSubtitle"
            type="text"
            placeholder="你的个性签名"
          />
        </div>

        <div class="admin-settings__field">
          <label>背景切换模式</label>
          <select v-model="backgroundMode" class="admin-settings__select">
            <option value="static">静态模式 - 固定显示一张背景</option>
            <option value="timeOfDay">时间段模式 - 根据时间自动切换</option>
            <option value="rotation">轮换模式 - 定时自动切换</option>
          </select>
        </div>

        <div v-if="backgroundMode === 'static'" class="admin-settings__field">
          <label>静态背景</label>
          <input
            v-model="staticBackground"
            type="text"
            placeholder="/images/morning.jpg 或 https://example.com/bg.jpg"
          />
          <span class="admin-settings__field-hint">
            选择一张图片作为固定背景
          </span>
        </div>

        <div v-if="backgroundMode === 'rotation'" class="admin-settings__field">
          <label>轮换间隔（秒）</label>
          <input
            v-model.number="rotationInterval"
            type="number"
            min="10"
            max="3600"
            placeholder="300"
          />
          <span class="admin-settings__field-hint">
            每隔多少秒切换到下一张背景（10-3600秒）
          </span>
        </div>

        <div class="admin-settings__field">
          <label>背景图片列表</label>
          <div class="admin-settings__backgrounds">
            <div
              v-for="(bg, index) in heroBackgrounds"
              :key="index"
              class="admin-settings__bg-item"
            >
              <input
                v-model="heroBackgrounds[index]"
                type="text"
                :placeholder="`背景图片 ${index + 1} URL`"
              />
              <button
                type="button"
                class="admin-settings__bg-remove"
                @click="removeBackground(index)"
              >
                ×
              </button>
            </div>
            <button
              v-if="heroBackgrounds.length < maxHeroBackgrounds"
              type="button"
              class="admin-settings__bg-add"
              @click="addBackground"
            >
              + 添加背景
            </button>
          </div>
          <span class="admin-settings__field-hint">
            建议使用 1920x1080 以上的图片，支持 jpg/png/webp 格式
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="admin-settings__section">
        <h3 class="admin-settings__section-title">页脚信息</h3>

        <div class="admin-settings__field">
          <label>版权信息</label>
          <input
            v-model="footerCopyright"
            type="text"
            placeholder="2026 Your Name"
          />
        </div>

        <div class="admin-settings__field">
          <label>ICP 备案号</label>
          <input
            v-model="footerIcp"
            type="text"
            placeholder="京ICP备XXXXXXXX号"
          />
        </div>
      </div>

      <!-- 状态消息 -->
      <p v-if="error" class="admin-settings__error">{{ error }}</p>
      <p v-if="success" class="admin-settings__success">{{ success }}</p>

      <!-- 操作按钮 -->
      <div class="admin-settings__actions">
        <button
          type="submit"
          class="admin-settings__save-btn"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
        <button
          type="button"
          class="admin-settings__reset-btn"
          @click="loadSettings"
        >
          重置
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 表单数据
const siteTitle = ref('')
const welcomeMessage = ref('')
const chatPlaceholder = ref('')
const about = ref('')
const aboutContent = ref('')
const heroSubtitle = ref('')
const heroBackgrounds = ref<string[]>([])
const footerCopyright = ref('')
const footerIcp = ref('')
const avatarUrl = ref('')
const avatarPreview = ref('')
const avatarFile = ref<File | null>(null)
const maxHeroBackgrounds = ref(6)
const defaultAvatar = ref('/images/avatar1.jpg')

// 背景模式相关
const backgroundMode = ref<'static' | 'timeOfDay' | 'rotation'>('timeOfDay')
const staticBackground = ref('')
const rotationInterval = ref(300)

// UI 状态
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const avatarInputRef = ref<HTMLInputElement | null>(null)

// 加载设置
async function loadSettings() {
  loading.value = true
  error.value = ''

  try {
    const [configRes, serverConfigRes] = await Promise.all([
      axios.get('/api/admin/config'),
      axios.get('/api/server-config').catch(() => ({ data: {} }))
    ])

    const data = configRes.data
    const serverConfig = serverConfigRes.data

    siteTitle.value = data.siteTitle || ''
    welcomeMessage.value = data.welcomeMessage || ''
    chatPlaceholder.value = data.chatPlaceholder || ''
    about.value = data.about || ''
    aboutContent.value = data.aboutContent || ''
    heroSubtitle.value = data.hero?.subtitle || ''
    heroBackgrounds.value = data.hero?.backgroundImages || []
    footerCopyright.value = data.footer?.copyright || ''
    footerIcp.value = data.footer?.icp || ''

    // 加载背景模式配置
    if (serverConfig.hero) {
      backgroundMode.value = serverConfig.hero.backgroundMode || 'timeOfDay'
      staticBackground.value = serverConfig.hero.staticBackground || ''
      rotationInterval.value = (serverConfig.hero.backgroundRotationInterval || 300000) / 1000
    }

    // 查找头像
    avatarPreview.value = serverConfig.defaults?.avatar || defaultAvatar.value
  } catch (e: any) {
    error.value = '加载设置失败: ' + (e.response?.data?.error || e.message)
  } finally {
    loading.value = false
  }
}

// 头像上传
function handleAvatarSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    avatarFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// 背景图片管理
function addBackground() {
  heroBackgrounds.value.push('')
}

function removeBackground(index: number) {
  heroBackgrounds.value.splice(index, 1)
}

// 保存设置
async function handleSave() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    // 上传头像（如果有新头像）
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('image', avatarFile.value)
      const { data } = await axios.post('/api/admin/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      avatarUrl.value = data.url
    }

    // 批量更新语言配置
    const updates: Record<string, any> = {
      siteTitle: siteTitle.value,
      welcomeMessage: welcomeMessage.value,
      chatPlaceholder: chatPlaceholder.value,
      about: about.value,
      aboutContent: aboutContent.value,
      hero: {
        subtitle: heroSubtitle.value,
        backgroundImages: heroBackgrounds.value.filter(Boolean),
      },
      footer: {
        copyright: footerCopyright.value,
        icp: footerIcp.value,
      },
    }

    await axios.put('/api/admin/config/batch', updates)

    // 保存服务器配置（背景模式）
    await axios.put('/api/admin/server-config', {
      hero: {
        backgroundMode: backgroundMode.value,
        staticBackground: staticBackground.value,
        backgroundRotationInterval: rotationInterval.value * 1000,
      }
    })

    success.value = '设置保存成功'
  } catch (e: any) {
    error.value = '保存失败: ' + (e.response?.data?.error || e.message)
  } finally {
    saving.value = false
  }
}

// 加载服务器配置
async function loadServerConfig() {
  try {
    const { data } = await axios.get('/api/server-config')
    if (data.display?.maxHeroBackgrounds) {
      maxHeroBackgrounds.value = data.display.maxHeroBackgrounds
    }
    if (data.defaults?.avatar) {
      defaultAvatar.value = data.defaults.avatar
    }
  } catch {
    // 使用默认值
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  loadServerConfig()
})
</script>

<style scoped>
.admin-settings {
  max-width: 800px;
}

.admin-settings__title {
  font-size: 1.3em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xl);
}

.admin-settings__loading {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--space-2xl);
}

/* 表单 */
.admin-settings__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* 区块 - 玻璃拟态风格 */
.admin-settings__section {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
}

.admin-settings__section-title {
  font-size: 1em;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--admin-border);
}

/* 字段 */
.admin-settings__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.admin-settings__field:last-child {
  margin-bottom: 0;
}

.admin-settings__field label {
  font-size: 0.85em;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.admin-settings__field input[type='text'],
.admin-settings__field input[type='number'],
.admin-settings__field textarea,
.admin-settings__field select {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  color: var(--color-text-primary);
  font-size: 0.9em;
  outline: none;
  transition: all 0.2s ease;
}

.admin-settings__field input:focus,
.admin-settings__field textarea:focus,
.admin-settings__field select:focus {
  border-color: var(--color-accent);
  background: var(--admin-hover-bg);
}

.admin-settings__field select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.admin-settings__field-hint {
  font-size: 0.8em;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.admin-settings__textarea-lg {
  min-height: 240px;
  resize: vertical;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.85em;
  line-height: 1.6;
}

/* 头像 */
.admin-settings__avatar-row {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

.admin-settings__avatar-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--admin-border);
  flex-shrink: 0;
}

.admin-settings__avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-settings__avatar-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-settings__upload-btn {
  align-self: flex-start;
  padding: 8px 16px;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-settings__upload-btn:hover {
  background: var(--admin-hover-bg);
}

.admin-settings__url-input {
  width: 100%;
}

/* 背景图片 */
.admin-settings__backgrounds {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-settings__bg-item {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.admin-settings__bg-item input {
  flex: 1;
}

.admin-settings__bg-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: #ef4444;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.admin-settings__bg-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}

.admin-settings__bg-add {
  align-self: flex-start;
  padding: 8px 16px;
  background: var(--admin-card-bg);
  border: 1px dashed var(--admin-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-settings__bg-add:hover {
  background: var(--admin-hover-bg);
  color: var(--color-text-primary);
}

/* 状态消息 */
.admin-settings__error {
  color: #ef4444;
  font-size: 0.85em;
}

.admin-settings__success {
  color: #22c55e;
  font-size: 0.85em;
}

/* 操作按钮 */
.admin-settings__actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.admin-settings__save-btn {
  padding: 10px 24px;
  background: var(--admin-hover-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-md);
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-settings__save-btn:hover:not(:disabled) {
  background: var(--admin-active-bg);
}

.admin-settings__save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-settings__reset-btn {
  padding: 10px 20px;
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-settings__reset-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-muted);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .admin-settings__avatar-row {
    flex-direction: column;
    align-items: center;
  }
}
</style>
