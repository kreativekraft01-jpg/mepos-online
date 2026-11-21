import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore, verifyToken } from '../store/authStore'
import { useStore } from '../store/useStore'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/Login.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../app/App.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('../pages/Dashboard.vue') },
      { path: 'products', name: 'products', component: () => import('../pages/Products.vue') },
      { path: 'inventory', name: 'inventory', component: () => import('../pages/Inventory.vue') },
      { path: 'sales', name: 'sales', component: () => import('../pages/Sales.vue') },
      { path: 'customers', name: 'customers', component: () => import('../pages/Customers.vue') },
      { path: 'tills', name: 'tills', component: () => import('../pages/Tills.vue') },
      { path: 'settings', name: 'settings', component: () => import('../pages/Settings.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

let authChecked = false
let authOk = false
let authCheckPromise: Promise<boolean> | null = null

async function ensureAuth(): Promise<boolean> {
  if (authChecked) return authOk
  if (authCheckPromise) return authCheckPromise
  authCheckPromise = (async () => {
    const token = useAuthStore.getState().token
    if (!token) {
      const API = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || ''
      const url = `${API}/api/client/state`.replace('//api', '/api')
      try {
        const res = await fetch(url, { method: 'GET' })
        authOk = res.status !== 401
      } catch {
        authOk = true
      }
    } else {
      authOk = await verifyToken()
    }
    authChecked = true
    authCheckPromise = null
    return authOk
  })()
  return authCheckPromise
}

router.beforeEach(async (to) => {
  if (!to.matched.some((r) => r.meta.requiresAuth)) {
    if (to.path === '/login') authChecked = false
    return true
  }
  const ok = await ensureAuth()
  if (!ok) return { path: '/login', replace: true }

  if (!useStore.getState().ready) {
    await new Promise<void>((resolve) => {
      if (useStore.getState().ready) return resolve()
      const unsub = useStore.subscribe((s) => {
        if (s.ready) {
          unsub()
          resolve()
        }
      })
      setTimeout(() => { unsub(); resolve() }, 15000)
    })
  }
  return true
})

export default router
