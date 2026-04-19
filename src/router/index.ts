import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: () => import('@/views/WelcomeView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/servers',
      name: 'servers',
      component: () => import('@/views/ServersView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/servers/add',
      name: 'add-server',
      component: () => import('@/views/ServerFormView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/servers/:name(.*)',
      name: 'server-detail',
      component: () => import('@/views/ServerFormView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/clients',
      name: 'clients',
      component: () => import('@/views/ClientsView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/clients/:id',
      name: 'client-detail',
      component: () => import('@/views/ClientDetailView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/app-catalog/:slug',
      name: 'app-detail',
      component: () => import('@/views/AppDetailView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.checkSession()
  }

  if (to.meta.requiresAuth && !auth.authenticated) {
    return { name: 'login' }
  }
})

// Reset scroll on all internal scrollable containers on every navigation
router.afterEach(() => {
  document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]').forEach((el) => {
    el.scrollTop = 0
  })
})

export default router
