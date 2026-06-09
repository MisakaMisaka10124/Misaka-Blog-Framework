import { ref } from 'vue'
import hljsDark from 'highlight.js/styles/github-dark.css?url'
import hljsLight from 'highlight.js/styles/github.css?url'

const isDark = ref(true)

// highlight.js 主题样式元素
let hljsStyleEl: HTMLLinkElement | null = null

function loadHljsTheme(dark: boolean) {
  if (!hljsStyleEl) {
    hljsStyleEl = document.createElement('link')
    hljsStyleEl.rel = 'stylesheet'
    hljsStyleEl.id = 'hljs-theme'
    document.head.appendChild(hljsStyleEl)
  }
  hljsStyleEl.href = dark ? hljsDark : hljsLight
}

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    loadHljsTheme(isDark.value)
  }

  function initTheme() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    loadHljsTheme(isDark.value)
  }

  return {
    isDark,
    toggle,
    initTheme
  }
}
