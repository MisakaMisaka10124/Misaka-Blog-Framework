<template>
  <div class="admin-post-edit">
    <!-- 编辑器头部 -->
    <div class="admin-post-edit__header">
      <div class="admin-post-edit__header-left">
        <h2 class="admin-post-edit__title">
          {{ isEditing ? '编辑文章' : '新建文章' }}
        </h2>
        <div class="admin-post-edit__stats">
          <span>字数: {{ wordCount }}</span>
          <span>阅读: {{ readTime }}</span>
          <span v-if="editDuration > 0">编辑: {{ formatDuration(editDuration) }}</span>
        </div>
      </div>
      <div class="admin-post-edit__header-right">
        <span v-if="isEditing" class="admin-post-edit__slug">Slug: {{ slug }}</span>
      </div>
    </div>

    <!-- 编辑表单 -->
    <form class="admin-post-edit__form" @submit.prevent="handleSave">
      <!-- 标题和Slug -->
      <div class="admin-post-edit__row">
        <div class="admin-post-edit__field admin-post-edit__field--grow">
          <label>标题</label>
          <input
            v-model="title"
            type="text"
            placeholder="文章标题"
            required
          />
        </div>
        <div v-if="isEditing" class="admin-post-edit__field">
          <label>Slug</label>
          <input :value="slug" type="text" disabled />
        </div>
      </div>

      <!-- 封面图片 -->
      <div class="admin-post-edit__field">
        <label>封面图片</label>
        <div class="admin-post-edit__cover-row">
          <input
            ref="coverInputRef"
            type="file"
            accept="image/*"
            @change="handleCoverSelect"
            hidden
          />
          <button
            type="button"
            class="admin-post-edit__cover-btn"
            @click="coverInputRef?.click()"
          >
            选择封面
          </button>
          <span v-if="coverName" class="admin-post-edit__cover-name">
            {{ coverName }}
          </span>
          <span v-else class="admin-post-edit__cover-hint">未选择</span>
          <button
            v-if="coverPreview"
            type="button"
            class="admin-post-edit__cover-preview-btn"
            @click="showCoverPreview = true"
          >
            预览
          </button>
        </div>
        <!-- 封面预览 -->
        <div v-if="coverPreview" class="admin-post-edit__cover-preview">
          <img :src="coverPreview" alt="封面预览" />
        </div>
      </div>

      <!-- 标签 -->
      <div class="admin-post-edit__field">
        <label>标签</label>
        <div class="admin-post-edit__tags-input">
          <span
            v-for="(tag, i) in tags"
            :key="i"
            class="admin-post-edit__tag"
          >
            {{ tag }}
            <button
              type="button"
              class="admin-post-edit__tag-remove"
              @click="removeTag(i)"
            >
              ×
            </button>
          </span>
          <div class="admin-post-edit__tag-input-wrap">
            <input
              v-model="newTag"
              type="text"
              class="admin-post-edit__tag-field"
              placeholder="输入标签后回车"
              @keydown.enter.prevent="addTag"
              @input="onTagInput"
              @focus="onTagInput"
              @blur="hideTagSuggestions"
            />
            <div
              v-if="tagSuggestions.length"
              class="admin-post-edit__tag-suggestions"
            >
              <div
                v-for="s in tagSuggestions"
                :key="s"
                class="admin-post-edit__tag-suggestion"
                @mousedown.prevent="selectTag(s)"
              >
                {{ s }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 简介 -->
      <div class="admin-post-edit__field">
        <label>简介（留空自动提取）</label>
        <textarea
          v-model="summary"
          rows="2"
          placeholder="文章简介..."
        ></textarea>
      </div>

      <!-- 编辑器工具栏 -->
      <div class="admin-post-edit__field">
        <label>正文（Markdown）</label>
        <div class="admin-post-edit__toolbar">
          <button
            type="button"
            @click="insertMd('**', '**')"
            title="加粗"
          >
            B
          </button>
          <button
            type="button"
            @click="insertMd('*', '*')"
            title="斜体"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            @click="insertMd('`', '`')"
            title="行内代码"
          >
            &lt;/&gt;
          </button>
          <button
            type="button"
            @click="insertMd('\n```\n', '\n```\n')"
            title="代码块"
          >
            [ ]
          </button>
          <button
            type="button"
            @click="insertMd('[', '](url)')"
            title="链接"
          >
            L
          </button>
          <button
            type="button"
            @click="triggerImageUpload"
            title="插入图片"
          >
            IMG
          </button>
          <button
            type="button"
            @click="insertMd('\n> ', '\n')"
            title="引用"
          >
            Q
          </button>
          <button
            type="button"
            @click="insertMd('\n- ', '\n')"
            title="列表"
          >
            -
          </button>
          <div class="admin-post-edit__toolbar-right">
            <button
              type="button"
              :class="[
                'admin-post-edit__mode-btn',
                { active: !previewMode },
              ]"
              @click="previewMode = false"
            >
              Code
            </button>
            <button
              type="button"
              :class="[
                'admin-post-edit__mode-btn',
                { active: previewMode },
              ]"
              @click="previewMode = true"
            >
              Preview
            </button>
          </div>
        </div>

        <!-- Markdown 编辑器 -->
        <textarea
          v-show="!previewMode"
          ref="editorRef"
          v-model="content"
          class="admin-post-edit__editor"
          rows="20"
          placeholder="在这里编写 Markdown..."
          @paste="handlePaste"
          @keydown.tab.prevent="insertTab"
        ></textarea>

        <!-- 预览区域 -->
        <div
          v-show="previewMode"
          class="admin-post-edit__preview markdown-body"
          v-html="previewHtml"
        ></div>
      </div>

      <!-- 隐藏的图片上传输入 -->
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        @change="handleImageSelect"
        hidden
      />

      <!-- 状态消息 -->
      <p v-if="error" class="admin-post-edit__error">{{ error }}</p>
      <p v-if="success" class="admin-post-edit__success">{{ success }}</p>
      <p v-if="compressing" class="admin-post-edit__info">图片压缩中...</p>

      <!-- 操作按钮 -->
      <div class="admin-post-edit__actions">
        <button
          type="submit"
          class="admin-post-edit__submit-btn"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : (isEditing ? '更新文章' : '发布文章') }}
        </button>
        <button
          type="button"
          class="admin-post-edit__cancel-btn"
          @click="handleCancel"
        >
          取消
        </button>
      </div>
    </form>

    <!-- 封面预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="showCoverPreview"
        class="admin-post-edit__preview-overlay"
        @click="showCoverPreview = false"
      >
        <img :src="coverPreview" alt="封面预览" />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

// 判断是编辑还是新建
const isEditing = computed(() => !!route.params.slug)
const slug = computed(() => route.params.slug as string)

// 表单数据
const title = ref('')
const content = ref('')
const summary = ref('')
const tags = ref<string[]>([])
const newTag = ref('')
const coverFile = ref<File | null>(null)
const coverName = ref('')
const coverPreview = ref('')
const showCoverPreview = ref(false)

// 编辑器状态
const editorRef = ref<HTMLTextAreaElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)
const allTags = ref<string[]>([])
const tagSuggestions = ref<string[]>([])
const previewMode = ref(false)
const previewHtml = ref('')

// 状态消息
const error = ref('')
const success = ref('')
const saving = ref(false)
const compressing = ref(false)

// 编辑计时
const editStartTime = ref(0)
const editDuration = ref(0)
let editTimer: ReturnType<typeof setInterval> | null = null

// 计算属性
const wordCount = computed(() => {
  return content.value
    .replace(/[#*`>\-\[\]()!\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
})

const readTime = computed(() => {
  return `${Math.max(1, Math.ceil(wordCount.value / 500))} min`
})

// 工具函数
function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: raw }
  const yaml = match[1]
  const body = raw.slice(match[0].length)
  const data: Record<string, any> = {}
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) {
      let val: any = m[2].trim()
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val
          .slice(1, -1)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
      data[m[1]] = val
    }
  }
  return { data, content: body }
}

function yamlEscape(val: string): string {
  if (!val) return "''"
  if (/[:{}\[\],&*?|>!%@`#'"\n\r]/.test(val)) {
    return (
      '"' +
      val
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r') +
      '"'
    )
  }
  return val
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

// 编辑计时器
function startEditTimer() {
  editStartTime.value = Date.now()
  editDuration.value = 0
  editTimer = setInterval(() => {
    editDuration.value = Math.floor((Date.now() - editStartTime.value) / 1000)
  }, 1000)
}

function stopEditTimer() {
  if (editTimer) {
    clearInterval(editTimer)
    editTimer = null
  }
}

// 标签管理
function addTag() {
  const tag = newTag.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
  }
  newTag.value = ''
  tagSuggestions.value = []
}

function removeTag(index: number) {
  tags.value.splice(index, 1)
}

function onTagInput() {
  const q = newTag.value.trim().toLowerCase()
  if (!q) {
    tagSuggestions.value = []
    return
  }
  tagSuggestions.value = allTags.value
    .filter((t) => t.toLowerCase().includes(q) && !tags.value.includes(t))
    .slice(0, 8)
}

function selectTag(tag: string) {
  if (!tags.value.includes(tag)) {
    tags.value.push(tag)
  }
  newTag.value = ''
  tagSuggestions.value = []
}

function hideTagSuggestions() {
  setTimeout(() => {
    tagSuggestions.value = []
  }, 150)
}

// 封面图片
function handleCoverSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    coverFile.value = file
    coverName.value = file.name
    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// 编辑器工具
watch(previewMode, async (val) => {
  if (val && content.value.trim()) {
    try {
      const { data } = await axios.post('/api/md/render', {
        markdown: content.value,
      })
      previewHtml.value = data.html || ''
    } catch {
      previewHtml.value = '<p>渲染失败</p>'
    }
  }
})

function insertMd(before: string, after: string) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = content.value.substring(start, end)
  content.value =
    content.value.substring(0, start) +
    before +
    selected +
    after +
    content.value.substring(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(
      start + before.length + selected.length,
      start + before.length + selected.length
    )
  })
}

function insertTab() {
  insertMd('  ', '')
}

// 图片处理
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const maxWidth = 1920
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height / width) * maxWidth)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) =>
            resolve(
              blob
                ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                  })
                : file
            ),
          'image/jpeg',
          0.82
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

function triggerImageUpload() {
  imageInputRef.value?.click()
}

async function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await insertImage(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function handlePaste(e: ClipboardEvent) {
  for (const item of e.clipboardData?.items || []) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) await insertImage(file)
      return
    }
  }
}

async function insertImage(file: File) {
  compressing.value = true
  try {
    const compressed = await compressImage(file)
    const formData = new FormData()
    formData.append('image', compressed)
    formData.append('slug', slug.value || '_temp')
    const { data } = await axios.post('/api/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    insertMd(`![${file.name}](${encodeURI(data.url)})`, '')
  } catch (e: any) {
    error.value = '图片上传失败: ' + (e.response?.data?.error || e.message)
  } finally {
    compressing.value = false
  }
}

// 加载文章数据
async function loadPost() {
  if (!slug.value) return

  try {
    const { data } = await axios.get(`/api/posts/${slug.value}`)
    const parsed = parseFrontmatter(data.content || '')
    const fm = parsed.data

    title.value = fm.title || slug.value
    summary.value = fm.summary || ''
    tags.value = Array.isArray(fm.tags) ? fm.tags : []
    content.value = parsed.content

    if (data.meta?.cover) {
      coverName.value = data.meta.cover.split('/').pop() || ''
      coverPreview.value = data.meta.cover
    }
  } catch (e: any) {
    error.value = '加载文章失败: ' + (e.response?.data?.error || e.message)
  }
}

// 加载所有标签
async function loadAllTags() {
  try {
    const { data } = await axios.get('/api/tags')
    allTags.value = (data.tags || []).map((t: any) => t.tag)
  } catch {}
}

// 保存文章
async function handleSave() {
  if (!title.value.trim()) {
    error.value = '请输入标题'
    return
  }
  if (!content.value.trim()) {
    error.value = '请输入文章内容'
    return
  }

  error.value = ''
  success.value = ''
  saving.value = true

  try {
    // 构建 frontmatter
    const fmLines = [
      '---',
      `title: ${yamlEscape(title.value)}`,
      `summary: ${yamlEscape(summary.value || '')}`,
      `tags: [${tags.value.join(', ')}]`,
      `date: ${new Date().toISOString().split('T')[0]}`,
    ]
    if (coverName.value) {
      fmLines.push(`cover: ${coverName.value}`)
    }
    fmLines.push('---', '')
    const frontmatter = fmLines.join('\n')
    const fullContent = frontmatter + content.value

    if (isEditing.value) {
      // 编辑已有文章
      const formData = new FormData()
      formData.append('content', fullContent)
      if (coverFile.value) {
        formData.append('cover', coverFile.value)
      }
      await axios.put(`/api/posts/${slug.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      success.value = '更新成功'
    } else {
      // 新建文章
      const mdFile = new File([fullContent], 'article.md', {
        type: 'text/markdown',
      })
      const formData = new FormData()
      formData.append('file', mdFile)
      formData.append('tags', tags.value.join(','))
      if (coverFile.value) {
        formData.append('cover', coverFile.value)
      }
      await axios.post('/api/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      success.value = '发布成功'
    }

    stopEditTimer()

    // 1秒后跳转到文章列表
    setTimeout(() => {
      router.push('/admin/posts')
    }, 1000)
  } catch (e: any) {
    error.value = e.response?.data?.error || '保存失败'
  } finally {
    saving.value = false
  }
}

// 取消编辑
function handleCancel() {
  router.push('/admin/posts')
}

// 生命周期
onMounted(() => {
  loadAllTags()
  startEditTimer()

  if (isEditing.value) {
    loadPost()
  }
})

onUnmounted(() => {
  stopEditTimer()
})
</script>

<style scoped>
.admin-post-edit {
  max-width: 1000px;
}

/* 头部 */
.admin-post-edit__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.admin-post-edit__title {
  font-size: 1.4em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.admin-post-edit__stats {
  display: flex;
  gap: var(--space-md);
  color: var(--color-text-muted);
  font-size: 0.85em;
}

.admin-post-edit__slug {
  font-size: 0.85em;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-family: monospace;
  color: var(--color-text-secondary);
}

/* 表单 */
.admin-post-edit__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-post-edit__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin-post-edit__field label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.admin-post-edit__field--grow {
  flex: 1;
}

.admin-post-edit__row {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
}

/* 输入框样式 */
.admin-post-edit__field input[type='text'],
.admin-post-edit__field textarea {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.95em;
  outline: none;
  transition: var(--transition-fast);
}

.admin-post-edit__field input:focus,
.admin-post-edit__field textarea:focus {
  border-color: var(--color-accent);
  background: rgba(255, 255, 255, 0.08);
}

.admin-post-edit__field input:disabled {
  opacity: 0.5;
}

/* 封面图片 */
.admin-post-edit__cover-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.admin-post-edit__cover-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.85em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-post-edit__cover-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.admin-post-edit__cover-name {
  color: var(--color-accent);
  font-size: 0.85em;
}

.admin-post-edit__cover-hint {
  color: var(--color-text-muted);
  font-size: 0.85em;
}

.admin-post-edit__cover-preview-btn {
  background: none;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
  color: var(--color-accent);
  font-size: 0.8em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-post-edit__cover-preview-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

.admin-post-edit__cover-preview {
  margin-top: var(--space-md);
  max-width: 300px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.admin-post-edit__cover-preview img {
  width: 100%;
  display: block;
}

/* 标签输入 */
.admin-post-edit__tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  min-height: 40px;
}

.admin-post-edit__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  font-size: 0.85em;
  color: var(--color-accent);
}

.admin-post-edit__tag-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1em;
  padding: 0;
  line-height: 1;
}

.admin-post-edit__tag-remove:hover {
  color: #ef4444;
}

.admin-post-edit__tag-field {
  flex: 1;
  min-width: 80px;
  background: none !important;
  border: none !important;
  padding: 2px 0 !important;
  font-size: 0.9em;
}

.admin-post-edit__tag-input-wrap {
  position: relative;
  flex: 1;
  min-width: 80px;
}

.admin-post-edit__tag-input-wrap .admin-post-edit__tag-field {
  width: 100%;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-sm) !important;
  padding: 4px 8px !important;
}

.admin-post-edit__tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(30, 30, 50, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.admin-post-edit__tag-suggestion {
  padding: 8px 12px;
  font-size: 0.85em;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-post-edit__tag-suggestion:hover {
  background: rgba(59, 130, 246, 0.2);
  color: var(--color-accent);
}

/* 编辑器工具栏 */
.admin-post-edit__toolbar {
  display: flex;
  gap: 2px;
  padding: var(--space-xs);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.admin-post-edit__toolbar button {
  padding: var(--space-xs) var(--space-sm);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.85em;
  cursor: pointer;
  border-radius: 3px;
  transition: var(--transition-fast);
}

.admin-post-edit__toolbar button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

.admin-post-edit__toolbar-right {
  margin-left: auto;
  display: flex;
  gap: 2px;
}

.admin-post-edit__mode-btn {
  padding: var(--space-xs) var(--space-sm) !important;
  font-size: 0.8em !important;
  border-radius: 3px !important;
}

.admin-post-edit__mode-btn.active {
  background: rgba(59, 130, 246, 0.3) !important;
  color: var(--color-accent) !important;
}

/* 编辑器 */
.admin-post-edit__editor {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  padding: var(--space-md);
  color: var(--color-text-primary);
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.9em;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  min-height: 400px;
}

.admin-post-edit__editor:focus {
  border-color: var(--color-accent);
}

/* 预览区域 */
.admin-post-edit__preview {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  padding: var(--space-md);
  min-height: 400px;
  overflow-y: auto;
  color: var(--color-text-primary);
  font-size: 0.95em;
  line-height: 1.8;
}

.admin-post-edit__preview :deep(h1),
.admin-post-edit__preview :deep(h2),
.admin-post-edit__preview :deep(h3) {
  color: var(--color-text-primary);
  margin: 1em 0 0.5em;
}

.admin-post-edit__preview :deep(p) {
  margin-bottom: 0.8em;
}

.admin-post-edit__preview :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 0.9em;
}

.admin-post-edit__preview :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin-bottom: 1em;
}

.admin-post-edit__preview :deep(pre code) {
  background: none;
  padding: 0;
}

.admin-post-edit__preview :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-md);
  color: var(--color-text-secondary);
  margin-bottom: 1em;
}

.admin-post-edit__preview :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

/* 状态消息 */
.admin-post-edit__error {
  color: #ef4444;
  font-size: 0.85em;
}

.admin-post-edit__success {
  color: #22c55e;
  font-size: 0.85em;
}

.admin-post-edit__info {
  color: var(--color-accent);
  font-size: 0.85em;
}

/* 操作按钮 */
.admin-post-edit__actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.admin-post-edit__submit-btn {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-post-edit__submit-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.admin-post-edit__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-post-edit__cancel-btn {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.admin-post-edit__cancel-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-muted);
}

/* 封面预览弹窗 */
.admin-post-edit__preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.admin-post-edit__preview-overlay img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: var(--radius-md);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .admin-post-edit__row {
    flex-direction: column;
  }

  .admin-post-edit__header {
    flex-direction: column;
  }
}
</style>
