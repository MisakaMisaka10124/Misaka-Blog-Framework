import { createRouter, createWebHistory } from 'vue-router'

/** 检查 JWT 是否有效（未过期） */
function isTokenValid(): boolean {
  const token = localStorage.getItem('upload_token')
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/Categories.vue'),
    },
    {
      path: '/categories/:tag',
      name: 'category-detail',
      component: () => import('../views/CategoryDetail.vue'),
    },
    {
      path: '/post/:slug',
      name: 'post',
      component: () => import('../views/PostDetail.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/About.vue'),
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('../views/Friends.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('../views/Upload.vue'),
      beforeEnter: () => {
        if (!isTokenValid()) {
          localStorage.removeItem('upload_token')
          return { name: 'login' }
        }
      },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/Search.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }
    return { top: 0 }
  },
})

export default router
