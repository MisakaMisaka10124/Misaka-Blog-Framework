import { createApp } from 'vue'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import './assets/styles/base.css'
import 'highlight.js/styles/github-dark.css'

// 请求拦截器：自动添加 token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('upload_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：401 时自动跳转登录
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('upload_token')
      router.push('/login')
    }
    return Promise.reject(err)
  }
)

const app = createApp(App)
app.use(router)
app.mount('#app')
