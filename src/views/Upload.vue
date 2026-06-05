<template>
  <div class="upload">
    <!-- 顶部操作栏 -->
    <div class="upload__topbar">
      <h2 class="upload__panel-title">文章管理</h2>
      <div class="upload__topbar-actions">
        <button class="upload__new-btn" @click="startNew">新建文章</button>
        <button class="upload__logout-btn" @click="logout">退出</button>
      </div>
    </div>

    <!-- 文章列表 -->
    <GlassCard class="upload__list-card" v-if="!editing">
      <div class="upload__list-header">
        <span>共 {{ articles.length }} 篇文章</span>
      </div>
      <p v-if="articlesLoading" class="upload__empty">加载中...</p>
      <div class="upload__list" v-else-if="articles.length">
        <div
          v-for="article in articles"
          :key="article.slug"
          class="upload__list-item"
        >
          <div class="upload__list-info">
            <h3 class="upload__list-title">{{ article.title || article.slug }} <span class="upload__list-slug">{{ article.slug }}</span></h3>
            <div class="upload__list-meta">
              <span>{{ article.date }}</span>
              <span>{{ article.wordCount }} 字</span>
              <span>{{ article.readTime }}</span>
            </div>
            <div class="upload__list-tags" v-if="article.tags.length">
              <span v-for="tag in article.tags" :key="tag" class="upload__tag">{{ tag }}</span>
            </div>
          </div>
          <div class="upload__list-actions">
            <button class="upload__edit-btn" @click="startEdit(article.slug)">编辑</button>
            <button class="upload__delete-btn" @click="handleDelete(article.slug)">删除</button>
          </div>
        </div>
      </div>
      <p v-else class="upload__empty">暂无文章</p>
    </GlassCard>

    <!-- 编辑器 -->
    <GlassCard class="upload__editor-card" v-if="editing">
      <div class="upload__editor-header">
        <h3>{{ editSlug ? '编辑文章' : '新建文章' }}</h3>
        <div class="upload__editor-stats">
          <span>字数: {{ editorWordCount }}</span>
          <span>阅读: {{ editorReadTime }}</span>
          <span v-if="editDuration > 0">编辑: {{ formatDuration(editDuration) }}</span>
        </div>
        <button class="upload__back-btn" @click="cancelEdit">返回列表</button>
      </div>

      <form class="upload__form" @submit.prevent="handleSave">
        <div class="upload__row">
          <div class="upload__field upload__field--grow">
            <label>标题</label>
            <input v-model="editTitle" type="text" placeholder="文章标题" required />
          </div>
          <div class="upload__field" v-if="editSlug">
            <label>Slug</label>
            <input :value="editSlug" type="text" disabled />
          </div>
        </div>

        <div class="upload__field">
          <label>封面图片</label>
          <div class="upload__cover-row">
            <input ref="coverInputRef" type="file" accept="image/*" @change="handleCoverSelect" hidden />
            <button type="button" class="upload__cover-btn" @click="coverInputRef?.click()">选择封面</button>
            <span v-if="editCoverName" class="upload__cover-name">{{ editCoverName }}</span>
            <span v-else class="upload__cover-hint">未选择</span>
          </div>
        </div>

        <div class="upload__field">
          <label>标签</label>
          <div class="upload__tags-input">
            <span v-for="(tag, i) in editTags" :key="i" class="upload__tag">
              {{ tag }}
              <button type="button" class="upload__tag-remove" @click="removeTag(i)">×</button>
            </span>
            <div class="upload__tag-input-wrap">
              <input
                v-model="newTag"
                type="text"
                class="upload__tag-field"
                placeholder="输入标签后回车"
                @keydown.enter.prevent="addTag"
                @input="onTagInput"
                @focus="onTagInput"
                @blur="hideTagSuggestions"
              />
              <div class="upload__tag-suggestions" v-if="tagSuggestions.length">
                <div
                  v-for="s in tagSuggestions"
                  :key="s"
                  class="upload__tag-suggestion"
                  @mousedown.prevent="selectTag(s)"
                >
                  {{ s }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="upload__field">
          <label>简介（留空自动提取）</label>
          <textarea v-model="editSummary" rows="2" placeholder="文章简介..."></textarea>
        </div>

        <div class="upload__field">
          <label>正文（Markdown）</label>
          <div class="upload__editor-toolbar">
            <button type="button" @click="insertMd('**', '**')" title="加粗">B</button>
            <button type="button" @click="insertMd('*', '*')" title="斜体"><em>I</em></button>
            <button type="button" @click="insertMd('`', '`')" title="行内代码">&lt;/&gt;</button>
            <button type="button" @click="insertMd('\n```\n', '\n```\n')" title="代码块">[ ]</button>
            <button type="button" @click="insertMd('[', '](url)')" title="链接">L</button>
            <button type="button" @click="triggerImageUpload" title="插入图片">IMG</button>
            <button type="button" @click="insertMd('\n> ', '\n')" title="引用">Q</button>
            <button type="button" @click="insertMd('\n- ', '\n')" title="列表">-</button>
            <div class="upload__toolbar-right">
              <button type="button" :class="['upload__mode-btn', { active: !previewMode }]" @click="previewMode = false">Code</button>
              <button type="button" :class="['upload__mode-btn', { active: previewMode }]" @click="previewMode = true">Preview</button>
            </div>
          </div>
          <textarea
            v-show="!previewMode"
            ref="editorRef"
            v-model="editContent"
            class="upload__editor"
            rows="20"
            placeholder="在这里编写 Markdown..."
            @paste="handlePaste"
            @keydown.tab.prevent="insertTab"
          ></textarea>
          <div v-show="previewMode" class="upload__preview markdown-body" v-html="previewHtml"></div>
        </div>

        <input ref="imageInputRef" type="file" accept="image/*" @change="handleImageSelect" hidden />

        <p v-if="saveError" class="upload__error">{{ saveError }}</p>
        <p v-if="saveSuccess" class="upload__success">{{ saveSuccess }}</p>
        <p v-if="compressing" class="upload__info">图片压缩中...</p>

        <div class="upload__actions">
          <button type="submit" class="upload__submit-btn" :disabled="saveLoading">
            {{ saveLoading ? '保存中...' : (editSlug ? '更新文章' : '发布文章') }}
          </button>
          <button type="button" class="upload__cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </form>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import GlassCard from '../components/GlassCard.vue'

const router = useRouter()

// ========== 文章列表 ==========
interface ArticleMeta {
  slug: string
  title: string
  summary: string
  cover: string
  tags: string[]
  date: string
  wordCount: number
  readTime: string
}
const articles = ref<ArticleMeta[]>([])
const articlesLoading = ref(true)

// ========== 编辑器 ==========
const editing = ref(false)
const editSlug = ref('')
const editTitle = ref('')
const editContent = ref('')
const editSummary = ref('')
const editTags = ref<string[]>([])
const newTag = ref('')
const editSlugDisplay = ref('')
const saveError = ref('')
const saveSuccess = ref('')
const saveLoading = ref(false)
const compressing = ref(false)

const editorRef = ref<HTMLTextAreaElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)
const editCoverFile = ref<File | null>(null)
const editCoverName = ref('')
const allTags = ref<string[]>([])
const tagSuggestions = ref<string[]>([])
const previewMode = ref(false)
const previewHtml = ref('')

const editStartTime = ref(0)
const editDuration = ref(0)
let editTimer: ReturnType<typeof setInterval> | null = null

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: raw }
  const yaml = match[1]
  const content = raw.slice(match[0].length)
  const data: Record<string, any> = {}
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) {
      let val: any = m[2].trim()
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      data[m[1]] = val
    }
  }
  return { data, content }
}

/** 对 YAML 标量值进行转义，特殊字符时用双引号包裹 */
function yamlEscape(val: string): string {
  if (!val) return "''"
  if (/[:{}\[\],&*?|>!%@`#'"\n\r]/.test(val)) {
    return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"'
  }
  return val
}

const editorWordCount = computed(() => {
  return editContent.value.replace(/[#*`>\-\[\]()!\n]/g, ' ').replace(/\s+/g, ' ').trim().length
})

const editorReadTime = computed(() => {
  return `${Math.max(1, Math.ceil(editorWordCount.value / 500))} min`
})

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

// ========== 文章管理 ==========

async function loadArticles() {
  try {
    const { data } = await axios.get('/api/posts/index')
    articles.value = data.posts || []
  } catch (e) {
    console.warn('Failed to load articles:', e)
  } finally {
    articlesLoading.value = false
  }
}

async function startEdit(slug: string) {
  saveError.value = ''
  saveSuccess.value = ''
  try {
    const { data } = await axios.get(`/api/posts/${slug}`)
    editSlug.value = slug
    editSlugDisplay.value = slug
    const parsed = parseFrontmatter(data.content || '')
    const fm = parsed.data
    editTitle.value = fm.title || slug
    editSummary.value = fm.summary || ''
    editTags.value = Array.isArray(fm.tags) ? fm.tags : []
    editContent.value = parsed.content
    editCoverFile.value = null
    editCoverName.value = data.meta?.cover ? data.meta.cover.split('/').pop() : ''
    editing.value = true
    startEditTimer()
  } catch (e: any) {
    saveError.value = '加载文章失败: ' + (e.response?.data?.error || e.message)
  }
}

function startNew() {
  editSlug.value = ''
  editSlugDisplay.value = ''
  editTitle.value = ''
  editContent.value = ''
  editSummary.value = ''
  editTags.value = []
  editCoverFile.value = null
  editCoverName.value = ''
  saveError.value = ''
  saveSuccess.value = ''
  editing.value = true
  startEditTimer()
}

function handleCoverSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    editCoverFile.value = file
    editCoverName.value = file.name
  }
}

function cancelEdit() {
  editing.value = false
  stopEditTimer()
}

function startEditTimer() {
  editStartTime.value = Date.now()
  editDuration.value = 0
  editTimer = setInterval(() => {
    editDuration.value = Math.floor((Date.now() - editStartTime.value) / 1000)
  }, 1000)
}

function stopEditTimer() {
  if (editTimer) { clearInterval(editTimer); editTimer = null }
}

// ========== 标签 ==========

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !editTags.value.includes(tag)) editTags.value.push(tag)
  newTag.value = ''
  tagSuggestions.value = []
}

function removeTag(index: number) {
  editTags.value.splice(index, 1)
}

// 标签建议数配置
const maxTagSuggestions = ref(8)

function onTagInput() {
  const q = newTag.value.trim().toLowerCase()
  if (!q) { tagSuggestions.value = []; return }
  tagSuggestions.value = allTags.value
    .filter(t => t.toLowerCase().includes(q) && !editTags.value.includes(t))
    .slice(0, maxTagSuggestions.value)
}

function selectTag(tag: string) {
  if (!editTags.value.includes(tag)) editTags.value.push(tag)
  newTag.value = ''
  tagSuggestions.value = []
}

function hideTagSuggestions() {
  setTimeout(() => { tagSuggestions.value = [] }, 150)
}

async function loadAllTags() {
  try {
    const { data } = await axios.get('/api/tags')
    allTags.value = (data.tags || []).map((t: any) => t.tag)
  } catch {}
}

// ========== 编辑器工具 ==========

// 切换预览时渲染 Markdown
watch(previewMode, async (val) => {
  if (val && editContent.value.trim()) {
    try {
      const { data } = await axios.post('/api/md/render', { markdown: editContent.value })
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
  const selected = editContent.value.substring(start, end)
  editContent.value = editContent.value.substring(0, start) + before + selected + after + editContent.value.substring(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + before.length + selected.length, start + before.length + selected.length)
  })
}

function insertTab() { insertMd('  ', '') }

// 图片压缩配置
const imageCompressionMaxWidth = ref(1920)
const imageCompressionQuality = ref(0.82)

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const maxWidth = imageCompressionMaxWidth.value
        let { width, height } = img
        if (width > maxWidth) { height = Math.round((height / width) * maxWidth); width = maxWidth }
        canvas.width = width; canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file),
          'image/jpeg', imageCompressionQuality.value,
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

function triggerImageUpload() { imageInputRef.value?.click() }

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
    // 传递当前 slug（编辑已有文章时）或 _temp（新建文章时）
    formData.append('slug', editSlug.value || '_temp')
    const { data } = await axios.post('/api/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    insertMd(`![${file.name}](${encodeURI(data.url)})`, '')
  } catch (e: any) {
    saveError.value = '图片上传失败: ' + (e.response?.data?.error || e.message)
  } finally {
    compressing.value = false
  }
}

// ========== 保存 ==========

async function handleSave() {
  if (!editTitle.value.trim()) { saveError.value = '请输入标题'; return }
  if (!editContent.value.trim()) { saveError.value = '请输入文章内容'; return }
  saveError.value = ''; saveSuccess.value = ''; saveLoading.value = true

  try {
    const fmLines = ['---',
      `title: ${yamlEscape(editTitle.value)}`,
      `summary: ${yamlEscape(editSummary.value || '')}`,
      `tags: [${editTags.value.join(', ')}]`,
      `date: ${new Date().toISOString().split('T')[0]}`,
    ]
    if (editCoverName.value) fmLines.push(`cover: ${editCoverName.value}`)
    fmLines.push('---', '')
    const frontmatter = fmLines.join('\n')
    const fullContent = frontmatter + editContent.value

    if (editSlug.value) {
      // 编辑已有文章 - 使用 FormData 支持封面上传
      const formData = new FormData()
      formData.append('content', fullContent)
      if (editCoverFile.value) {
        formData.append('cover', editCoverFile.value)
      }
      await axios.put(`/api/posts/${editSlug.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      saveSuccess.value = '更新成功'
    } else {
      // 新建文章 - slug 由后端自动生成
      const mdFile = new File([fullContent], 'article.md', { type: 'text/markdown' })
      const formData = new FormData()
      formData.append('file', mdFile)
      formData.append('tags', editTags.value.join(','))
      if (editCoverFile.value) {
        formData.append('cover', editCoverFile.value)
      }
      await axios.post('/api/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      saveSuccess.value = '发布成功'
    }

    stopEditTimer()
    await loadArticles()
    editing.value = false
  } catch (e: any) {
    saveError.value = e.response?.data?.error || '保存失败'
  } finally {
    saveLoading.value = false
  }
}

async function handleDelete(slug: string) {
  if (!confirm(`确定删除文章「${slug}」？`)) return
  try {
    await axios.delete(`/api/posts/${slug}`)
    await loadArticles()
  } catch (e: any) {
    alert('删除失败: ' + (e.response?.data?.error || e.message))
  }
}

function logout() {
  localStorage.removeItem('upload_token')
  router.push('/login')
}

// 加载服务器配置
async function loadServerConfig() {
  try {
    const { data } = await axios.get('/api/server-config')
    if (data.display?.maxTagSuggestions) {
      maxTagSuggestions.value = data.display.maxTagSuggestions
    }
    if (data.imageCompression?.maxWidth) {
      imageCompressionMaxWidth.value = data.imageCompression.maxWidth
    }
    if (data.imageCompression?.quality) {
      imageCompressionQuality.value = data.imageCompression.quality
    }
  } catch {
    // 使用默认值
  }
}

onMounted(() => {
  loadArticles()
  loadAllTags()
  loadServerConfig()
})

onUnmounted(() => { stopEditTimer() })
</script>

<style scoped>
.upload {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg);
}

.upload__topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.upload__panel-title {
  font-size: 1.4em;
  color: var(--color-text-primary);
}

.upload__topbar-actions {
  display: flex;
  gap: var(--space-sm);
}

.upload__new-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__new-btn:hover { background: var(--color-accent-hover); }

.upload__list-card { padding: var(--space-lg) !important; }

.upload__list-header {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  margin-bottom: var(--space-md);
}

.upload__list { display: flex; flex-direction: column; gap: 1px; }

.upload__list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.upload__list-item:hover { background: rgba(255, 255, 255, 0.06); }

.upload__list-info { flex: 1; min-width: 0; }

.upload__list-title {
  font-size: 1em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload__list-slug {
  font-size: 0.8em;
  font-weight: normal;
  color: var(--color-text-muted);
  margin-left: var(--space-xs);
}

.upload__list-meta {
  display: flex;
  gap: var(--space-md);
  color: var(--color-text-muted);
  font-size: 0.8em;
  margin-bottom: var(--space-xs);
}

.upload__list-tags { display: flex; gap: var(--space-xs); flex-wrap: wrap; }

.upload__list-actions { display: flex; gap: var(--space-sm); flex-shrink: 0; margin-left: var(--space-md); }

.upload__edit-btn, .upload__delete-btn {
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: none;
  font-size: 0.85em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__edit-btn { color: var(--color-text-secondary); }
.upload__edit-btn:hover { color: var(--color-accent); border-color: var(--color-accent); }
.upload__delete-btn { color: var(--color-text-muted); }
.upload__delete-btn:hover { color: #ef4444; border-color: #ef4444; }

.upload__empty { text-align: center; color: var(--color-text-muted); padding: var(--space-2xl); }

.upload__editor-card { padding: var(--space-lg) !important; }

.upload__editor-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.upload__editor-header h3 { font-size: 1.1em; color: var(--color-text-primary); }

.upload__editor-stats {
  display: flex;
  gap: var(--space-md);
  color: var(--color-text-muted);
  font-size: 0.8em;
  flex: 1;
}

.upload__back-btn {
  margin-left: auto;
  padding: var(--space-xs) var(--space-md);
  background: none;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.85em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__back-btn:hover { color: var(--color-text-primary); border-color: var(--color-text-primary); }

.upload__form { display: flex; flex-direction: column; gap: var(--space-lg); }

.upload__field { display: flex; flex-direction: column; gap: var(--space-sm); }
.upload__field label { font-size: 0.9em; color: var(--color-text-secondary); }
.upload__field--grow { flex: 1; }
.upload__row { display: flex; gap: var(--space-lg); align-items: flex-start; }

.upload__field input[type="text"], .upload__field textarea {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.95em;
  outline: none;
  transition: var(--transition-fast);
}

.upload__field input:focus, .upload__field textarea:focus {
  border-color: var(--color-accent);
  background: rgba(255, 255, 255, 0.08);
}

.upload__field input:disabled { opacity: 0.5; }

.upload__cover-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.upload__cover-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.85em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__cover-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.upload__cover-name {
  color: var(--color-accent);
  font-size: 0.85em;
}

.upload__cover-hint {
  color: var(--color-text-muted);
  font-size: 0.85em;
}

.upload__tags-input {
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

.upload__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  font-size: 0.85em;
  color: var(--color-accent);
}

.upload__tag-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1em;
  padding: 0;
  line-height: 1;
}

.upload__tag-remove:hover { color: #ef4444; }

.upload__tag-field {
  flex: 1;
  min-width: 80px;
  background: none !important;
  border: none !important;
  padding: 2px 0 !important;
  font-size: 0.9em;
}

.upload__tag-input-wrap {
  position: relative;
  flex: 1;
  min-width: 80px;
}

.upload__tag-input-wrap .upload__tag-field {
  width: 100%;
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: var(--radius-sm) !important;
  padding: 4px 8px !important;
}

.upload__tag-suggestions {
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

.upload__tag-suggestion {
  padding: 8px 12px;
  font-size: 0.85em;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__tag-suggestion:hover {
  background: rgba(59, 130, 246, 0.2);
  color: var(--color-accent);
}

.upload__editor-toolbar {
  display: flex;
  gap: 2px;
  padding: var(--space-xs);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.upload__editor-toolbar button {
  padding: var(--space-xs) var(--space-sm);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.85em;
  cursor: pointer;
  border-radius: 3px;
  transition: var(--transition-fast);
}

.upload__editor-toolbar button:hover { background: rgba(255, 255, 255, 0.1); color: var(--color-text-primary); }

.upload__toolbar-right {
  margin-left: auto;
  display: flex;
  gap: 2px;
}

.upload__mode-btn {
  padding: var(--space-xs) var(--space-sm) !important;
  font-size: 0.8em !important;
  border-radius: 3px !important;
}

.upload__mode-btn.active {
  background: rgba(59, 130, 246, 0.3) !important;
  color: var(--color-accent) !important;
}

.upload__editor {
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

.upload__editor:focus { border-color: var(--color-accent); }

.upload__preview {
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

.upload__preview :deep(h1),
.upload__preview :deep(h2),
.upload__preview :deep(h3) {
  color: var(--color-text-primary);
  margin: 1em 0 0.5em;
}

.upload__preview :deep(p) {
  margin-bottom: 0.8em;
}

.upload__preview :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 0.9em;
}

.upload__preview :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin-bottom: 1em;
}

.upload__preview :deep(pre code) {
  background: none;
  padding: 0;
}

.upload__preview :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-md);
  color: var(--color-text-secondary);
  margin-bottom: 1em;
}

.upload__preview :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.upload__error { color: #ef4444; font-size: 0.85em; }
.upload__success { color: #22c55e; font-size: 0.85em; }
.upload__info { color: var(--color-accent); font-size: 0.85em; }

.upload__submit-btn {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__submit-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
.upload__submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.upload__cancel-btn, .upload__logout-btn {
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.upload__cancel-btn:hover, .upload__logout-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-muted);
}

.upload__actions { display: flex; gap: var(--space-md); align-items: center; }

@media (max-width: 640px) {
  .upload__row { flex-direction: column; }
  .upload__editor-header { flex-direction: column; align-items: flex-start; }
  .upload__back-btn { margin-left: 0; }
}
</style>
