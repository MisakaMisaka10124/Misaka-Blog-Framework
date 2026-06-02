<template>
  <div class="login">
    <GlassCard class="login__card">
      <h2 class="login__title">身份验证</h2>
      <form class="login__form" @submit.prevent="handleLogin">
        <div class="login__field">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="admin" required />
        </div>
        <div class="login__field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="••••••" required />
        </div>
        <div class="login__field">
          <label>验证码</label>
          <div class="login__captcha-row">
            <input v-model="captchaText" type="text" placeholder="输入验证码" required />
            <div class="login__captcha-img" v-html="captchaSvg" @click="loadCaptcha"></div>
          </div>
        </div>
        <p v-if="error" class="login__error">{{ error }}</p>
        <button type="submit" class="login__submit-btn" :disabled="loading">
          {{ loading ? '验证中...' : '登录' }}
        </button>
      </form>
    </GlassCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import GlassCard from '../components/GlassCard.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const captchaId = ref('')
const captchaText = ref('')
const captchaSvg = ref('')
const error = ref('')
const loading = ref(false)

async function loadCaptcha() {
  try {
    const { data } = await axios.get('/api/login/captcha')
    captchaId.value = data.id
    captchaSvg.value = data.data
    captchaText.value = ''
  } catch (e) {
    console.warn('Failed to load captcha:', e)
  }
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await axios.post('/api/login', {
      username: username.value,
      password: password.value,
      captchaId: captchaId.value,
      captchaText: captchaText.value,
    })
    localStorage.setItem('upload_token', data.token)
    router.push('/upload')
  } catch (e: any) {
    error.value = e.response?.data?.error || '登录失败'
    loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 已登录且 token 未过期则直接跳转
  const token = localStorage.getItem('upload_token')
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 > Date.now()) {
        router.replace('/upload')
        return
      }
    } catch {}
    localStorage.removeItem('upload_token')
  }
  loadCaptcha()
})
</script>

<style scoped>
.login {
  max-width: 420px;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-lg);
}

.login__card {
  padding: var(--space-xl) !important;
}

.login__title {
  font-size: 1.5em;
  color: var(--color-text-primary);
  margin-bottom: var(--space-lg);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.login__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.login__field label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.login__field input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-primary);
  font-size: 0.95em;
  outline: none;
  transition: var(--transition-fast);
}

.login__field input:focus {
  border-color: var(--color-accent);
  background: rgba(255, 255, 255, 0.08);
}

.login__captcha-row {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.login__captcha-row input { flex: 1; }

.login__captcha-img {
  flex-shrink: 0;
  height: 40px;
  width: 120px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}


.login__error {
  color: #ef4444;
  font-size: 0.85em;
}

.login__submit-btn {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1em;
  cursor: pointer;
  transition: var(--transition-fast);
}

.login__submit-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.login__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

<style>
/* 验证码 SVG 样式（v-html 内容需要非 scoped 样式） */
.login__captcha-img svg {
  height: 40px;
  width: 100%;
  max-width: 120px;
  display: block;
}
</style>
