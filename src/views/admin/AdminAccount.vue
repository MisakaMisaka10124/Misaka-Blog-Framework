<template>
  <div class="admin-settings">
    <h2 class="admin-settings__title">账户设置</h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="admin-settings__loading">
      加载中...
    </div>

    <!-- 账户信息 -->
    <div v-else class="admin-settings__form">
      <!-- 修改用户名 -->
      <div class="admin-settings__section">
        <h3 class="admin-settings__section-title">修改用户名</h3>

        <div class="admin-settings__field">
          <label>当前用户名</label>
          <input
            :value="currentUsername"
            type="text"
            disabled
            class="admin-settings__input-disabled"
          />
        </div>

        <div class="admin-settings__field">
          <label>新用户名</label>
          <input
            v-model="newUsername"
            type="text"
            placeholder="输入新的用户名"
          />
        </div>

        <div class="admin-settings__actions">
          <button
            type="button"
            class="admin-settings__btn"
            @click="handleUpdateUsername"
            :disabled="updatingUsername"
          >
            {{ updatingUsername ? '保存中...' : '保存用户名' }}
          </button>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="admin-settings__section">
        <h3 class="admin-settings__section-title">修改密码</h3>

        <div class="admin-settings__field">
          <label>当前密码</label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="输入当前密码"
          />
        </div>

        <div class="admin-settings__field">
          <label>新密码</label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="输入新的密码"
          />
        </div>

        <div class="admin-settings__field">
          <label>确认新密码</label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
          />
        </div>

        <div class="admin-settings__field">
          <label>验证码</label>
          <div class="admin-settings__captcha-row">
            <input
              v-model="passwordForm.captchaText"
              type="text"
              placeholder="输入验证码"
              maxlength="4"
            />
            <div
              class="admin-settings__captcha-img"
              v-html="captchaSvg"
              @click="loadCaptcha"
              title="点击刷新验证码"
            ></div>
          </div>
        </div>

        <div class="admin-settings__actions">
          <button
            type="button"
            class="admin-settings__btn"
            @click="handleUpdatePassword"
            :disabled="updatingPassword"
          >
            {{ updatingPassword ? '修改中...' : '修改密码' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认对话框 -->
    <Teleport to="body">
      <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click.self="cancelConfirm">
        <div class="confirm-dialog">
          <h3 class="confirm-dialog__title">{{ confirmTitle }}</h3>
          <p class="confirm-dialog__message">{{ confirmMessage }}</p>
          <div class="confirm-dialog__actions">
            <button class="confirm-dialog__cancel" @click="cancelConfirm">取消</button>
            <button class="confirm-dialog__confirm" @click="executeConfirm">确认</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 提示消息 -->
    <div v-if="toast.show" class="admin-settings__toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 当前用户名
const currentUsername = ref('')
const loading = ref(true)

// 修改用户名
const newUsername = ref('')
const updatingUsername = ref(false)

// 修改密码表单
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  captchaId: '',
  captchaText: ''
})
const captchaSvg = ref('')
const updatingPassword = ref(false)

// 确认对话框
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let confirmCallback: (() => void) | null = null

// 提示消息
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// 显示提示
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// 显示确认对话框
function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmTitle.value = title
    confirmMessage.value = message
    showConfirmDialog.value = true
    confirmCallback = () => resolve(true)
  })
}

function cancelConfirm() {
  showConfirmDialog.value = false
  confirmCallback = null
}

function executeConfirm() {
  showConfirmDialog.value = false
  if (confirmCallback) {
    confirmCallback()
    confirmCallback = null
  }
}

// 加载验证码
async function loadCaptcha() {
  try {
    const { data } = await axios.get('/api/login/captcha')
    passwordForm.value.captchaId = data.id
    captchaSvg.value = data.data
    passwordForm.value.captchaText = ''
  } catch (e) {
    showToast('加载验证码失败', 'error')
  }
}

// 获取当前账户信息
async function loadAccountInfo() {
  try {
    loading.value = true
    const { data } = await axios.get('/api/admin/account')
    currentUsername.value = data.username
  } catch (e) {
    showToast('获取账户信息失败', 'error')
  } finally {
    loading.value = false
  }
}

// 修改用户名（无需验证码）
async function handleUpdateUsername() {
  if (!newUsername.value.trim()) {
    showToast('请输入新用户名', 'error')
    return
  }

  if (newUsername.value.trim() === currentUsername.value) {
    showToast('新用户名与当前用户名相同', 'error')
    return
  }

  const confirmed = await showConfirm(
    '确认修改用户名',
    `确定要将用户名修改为 "${newUsername.value}" 吗？`
  )

  if (!confirmed) return

  try {
    updatingUsername.value = true
    const { data } = await axios.put('/api/admin/account/username', {
      newUsername: newUsername.value
    })

    currentUsername.value = data.username
    newUsername.value = ''
    showToast('用户名修改成功')
  } catch (e: any) {
    const msg = e.response?.data?.error || '修改失败'
    showToast(msg, 'error')
  } finally {
    updatingUsername.value = false
  }
}

// 修改密码（需要验证码并重新登录）
async function handleUpdatePassword() {
  if (!passwordForm.value.currentPassword) {
    showToast('请输入当前密码', 'error')
    return
  }

  if (!passwordForm.value.newPassword) {
    showToast('请输入新密码', 'error')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    showToast('新密码长度不能少于6位', 'error')
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showToast('两次输入的新密码不一致', 'error')
    return
  }

  if (!passwordForm.value.captchaText) {
    showToast('请输入验证码', 'error')
    return
  }

  const confirmed = await showConfirm(
    '确认修改密码',
    '确定要修改密码吗？修改后需要重新登录。'
  )

  if (!confirmed) return

  try {
    updatingPassword.value = true
    await axios.put('/api/admin/account/password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      captchaId: passwordForm.value.captchaId,
      captchaText: passwordForm.value.captchaText
    })

    showToast('密码修改成功，请重新登录')

    // 清除 token 并跳转到登录页
    setTimeout(() => {
      localStorage.removeItem('upload_token')
      router.push('/login')
    }, 1500)
  } catch (e: any) {
    const msg = e.response?.data?.error || '修改失败'
    showToast(msg, 'error')
    loadCaptcha()
  } finally {
    updatingPassword.value = false
  }
}

onMounted(() => {
  loadAccountInfo()
  loadCaptcha()
})
</script>

<style scoped>
.admin-settings {
  max-width: 600px;
  padding: 24px;
}

.admin-settings__title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--color-text);
}

.admin-settings__loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
}

.admin-settings__section {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.admin-settings__section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--color-text);
}

.admin-settings__field {
  margin-bottom: 16px;
}

.admin-settings__field label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-text);
}

.admin-settings__field input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.admin-settings__field input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.admin-settings__input-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.admin-settings__captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.admin-settings__captcha-row input {
  flex: 1;
}

.admin-settings__captcha-img {
  cursor: pointer;
  height: 40px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border-radius: 8px;
  overflow: hidden;
}

.admin-settings__captcha-img :deep(svg) {
  height: 100%;
  width: auto;
}

.admin-settings__actions {
  margin-top: 20px;
}

.admin-settings__btn {
  padding: 10px 24px;
  background: var(--color-accent);
  color: white;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-settings__btn:hover:not(:disabled) {
  opacity: 0.9;
}

.admin-settings__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 确认对话框 */
.confirm-dialog-overlay {
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

.confirm-dialog {
  background: var(--color-bg);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-dialog__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-text);
}

.confirm-dialog__message {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-dialog__cancel,
.confirm-dialog__confirm {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-dialog__cancel {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.confirm-dialog__cancel:hover {
  background: var(--color-bg-tertiary);
}

.confirm-dialog__confirm {
  background: var(--color-accent);
  color: white;
  border: 1px solid var(--color-accent);
}

.confirm-dialog__confirm:hover {
  opacity: 0.9;
}

/* 提示消息 */
.admin-settings__toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1001;
  animation: toast-in 0.3s ease;
}

.admin-settings__toast.success {
  background: #10b981;
  color: white;
}

.admin-settings__toast.error {
  background: #ef4444;
  color: white;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
