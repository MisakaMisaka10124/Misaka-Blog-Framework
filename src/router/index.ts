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
    // 前台页面（使用AppLayout）
    {
      path: '/',
      component: () => import('../layout/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/Home.vue'),
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('../views/Categories.vue'),
        },
        {
          path: 'categories/:tag',
          name: 'category-detail',
          component: () => import('../views/CategoryDetail.vue'),
        },
        {
          path: 'post/:slug',
          name: 'post',
          component: () => import('../views/PostDetail.vue'),
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/About.vue'),
        },
        {
          path: 'friends',
          name: 'friends',
          component: () => import('../views/Friends.vue'),
        },
        {
          path: 'search',
          name: 'search',
          component: () => import('../views/Search.vue'),
        },
      ],
    },
    // 登录页面
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { guestOnly: true },
    },
    // 后台管理页面（需要认证，使用AdminLayout）
    {
      path: '/admin',
      component: () => import('../layout/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/Dashboard.vue'),
        },
        {
          path: 'posts',
          name: 'admin-posts',
          component: () => import('../views/admin/AdminPosts.vue'),
        },
        {
          path: 'posts/new',
          name: 'admin-post-new',
          component: () => import('../views/admin/AdminPostEdit.vue'),
        },
        {
          path: 'posts/:slug',
          name: 'admin-post-edit',
          component: () => import('../views/admin/AdminPostEdit.vue'),
          props: true,
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('../views/admin/AdminSettings.vue'),
        },
        {
          path: 'account',
          name: 'admin-account',
          component: () => import('../views/admin/AdminAccount.vue'),
        },
        {
          path: 'friends',
          name: 'admin-friends',
          component: () => import('../views/admin/AdminFriends.vue'),
        },
        {
          path: 'social',
          name: 'admin-social',
          component: () => import('../views/admin/AdminSocial.vue'),
        },
      ],
    },
    // 保留旧路由兼容（可选）
    {
      path: '/upload',
      redirect: '/admin/posts',
    },
    // 404 页面
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

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = isTokenValid()

  // 需要认证的路由
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      localStorage.removeItem('upload_token')
      next({ name: 'login' })
      return
    }
  }

  // 仅限游客的路由（已登录用户不应访问）
  if (to.matched.some((record) => record.meta.guestOnly)) {
    if (isAuthenticated) {
      next({ name: 'admin-dashboard' })
      return
    }
  }

  next()
})

export default router
