import { ref, onMounted } from 'vue'

const isDark = ref(true)

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  function initTheme() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  }

  return {
    isDark,
    toggle,
    initTheme
  }
}
