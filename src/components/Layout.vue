<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark">{{ (store.settings.storeName || 'M')[0] }}</div>
        <div>
          <div class="brand-name">{{ store.settings.storeName || 'MEPoS' }}</div>
          <div class="brand-tag">Admin</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link v-for="item in NAV_MAIN" :key="item.to" :to="item.to" class="nav-item" active-class="active" :end="item.end">
          <component :is="item.icon" :size="18" :stroke-width="2.2" />
          <span>{{ item.label }}</span>
        </router-link>
        <div class="nav-section">Stock</div>
        <router-link v-for="item in NAV_STOCK" :key="item.to" :to="item.to" class="nav-item" active-class="active">
          <component :is="item.icon" :size="18" :stroke-width="2.2" />
          <span>{{ item.label }}</span>
        </router-link>
        <div class="nav-section">Setup</div>
        <router-link v-for="item in NAV_SETUP" :key="item.to" :to="item.to" class="nav-item" active-class="active">
          <component :is="item.icon" :size="18" :stroke-width="2.2" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <ShoppingCart :size="18" />
          <span>Back to POS</span>
        </router-link>
        <button class="nav-item" @click="logout">
          <LogOut :size="18" />
          <span>Log out ({{ auth.username || 'admin' }})</span>
        </button>
        <div class="sync-status" :data-status="syncStatus">
          <span class="dot" />
          <span>{{ syncLabel }}</span>
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
      </header>
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, ShoppingCart, Package, Boxes, Receipt, Users, Settings, Landmark, LogOut } from 'lucide-vue-next'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/authStore'
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '../utils/serverSync'

const store = useStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const NAV_MAIN = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sales', label: 'Sales', icon: Receipt, end: false },
]
const NAV_STOCK = [
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
]
const NAV_SETUP = [
  { to: '/admin/tills', label: 'Tills', icon: Landmark, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
]

const syncStatus = ref<SyncStatus>(getSyncStatus())
const unsub = subscribeSyncStatus((s) => { syncStatus.value = s })
onBeforeUnmount(unsub)

const syncLabel = computed(() => {
  switch (syncStatus.value) {
    case 'syncing': return 'Syncing…'
    case 'synced': return 'Saved to server'
    case 'offline': return 'Offline'
    case 'error': return 'Sync error'
    default: return 'Ready'
  }
})

const pageTitle = computed(() => {
  const p = route.path
  if (p.endsWith('/dashboard')) return 'Dashboard'
  if (p.includes('/products')) return 'Products'
  if (p.includes('/inventory')) return 'Inventory'
  if (p.includes('/sales')) return 'Sales'
  if (p.includes('/customers')) return 'Customers'
  if (p.includes('/tills')) return 'Tills'
  if (p.includes('/settings')) return 'Settings'
  return 'Admin'
})

function logout() {
  useAuthStore.getState().logout()
  router.push('/login')
}
</script>
