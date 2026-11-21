import { reactive } from 'vue'

interface AuthState {
  token: string | null
  username: string | null
  setAuth: (token: string, username: string) => void
  logout: () => void
}

const STORAGE_KEY = 'mepos-auth'

function readPersisted(): { token: string | null; username: string | null } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, username: null }
    const parsed = JSON.parse(raw)
    const state = parsed?.state ?? parsed
    return {
      token: typeof state?.token === 'string' ? state.token : null,
      username: typeof state?.username === 'string' ? state.username : null,
    }
  } catch {
    return { token: null, username: null }
  }
}

function writePersisted(token: string | null, username: string | null) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { token, username } }))
  } catch {}
}

const listeners = new Set<(state: AuthState, prev: AuthState) => void>()

const persisted = readPersisted()

export const authState = reactive<AuthState>({
  token: persisted.token,
  username: persisted.username,
  setAuth(token, username) {
    const prev = { token: authState.token, username: authState.username } as AuthState
    authState.token = token
    authState.username = username
    writePersisted(token, username)
    for (const l of listeners) l(authState, prev)
  },
  logout() {
    const prev = { token: authState.token, username: authState.username } as AuthState
    authState.token = null
    authState.username = null
    writePersisted(null, null)
    for (const l of listeners) l(authState, prev)
  },
})

function getState() {
  return authState
}

export const useAuthStore = Object.assign((() => authState) as (() => AuthState) & {
  getState: () => AuthState
  subscribe: (listener: (state: AuthState, prev: AuthState) => void) => () => void
}, {
  getState,
  subscribe(listener: (state: AuthState, prev: AuthState) => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
})

// Clear any legacy localStorage token (previous persist used localStorage) — force re-login
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('mepos-auth')) localStorage.removeItem('mepos-auth')
  } catch {}
}

export function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function loginRequest(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string; token?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'Login failed' }
    const token = data.token as string
    useAuthStore.getState().setAuth(token, username)
    return { ok: true, token }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function verifyToken(): Promise<boolean> {
  const token = useAuthStore.getState().token
  if (!token) return false
  try {
    const res = await fetch('/api/auth/me', { headers: authHeaders() })
    if (!res.ok) {
      useAuthStore.getState().logout()
      return false
    }
    return true
  } catch {
    return false
  }
}
