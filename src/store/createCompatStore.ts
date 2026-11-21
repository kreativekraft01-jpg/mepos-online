import { reactive } from 'vue'

type Listener<T> = (state: T, prev: T) => void

export interface CompatStore<T> {
  (): T
  getState: () => T
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
  subscribe: (listener: Listener<T>) => () => void
}

/**
 * Minimal framework store with a Zustand-like imperative API and Vue reactivity.
 * - `getState/setState/subscribe` keep existing logic, sync, and tests working.
 * - State is a Vue `reactive` object so Vue components update when it changes.
 * - `setState` mutates the same reactive object (shallow merge) to preserve identity.
 */
export function createCompatStore<T extends object>(
  initializer: (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T,
    api: { getState: () => T; setState: CompatStore<T>['setState']; subscribe: CompatStore<T>['subscribe'] }
  ) => T
): CompatStore<T> {
  const listeners = new Set<Listener<T>>()
  let state = reactive({}) as T

  const getState = () => state

  const setState: CompatStore<T>['setState'] = (partial) => {
    const prev = { ...state } as T
    const next = typeof partial === 'function' ? (partial as (s: T) => Partial<T>)(state) : partial
    if (!next) return
    Object.assign(state as object, next as object)
    for (const listener of listeners) listener(state, prev)
  }

  const subscribe: CompatStore<T>['subscribe'] = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const api = { getState, setState, subscribe }
  const initial = initializer(setState, getState, api)
  Object.assign(state as object, initial as object)

  const useStore = (() => state) as CompatStore<T>
  useStore.getState = getState
  useStore.setState = setState
  useStore.subscribe = subscribe
  return useStore
}
