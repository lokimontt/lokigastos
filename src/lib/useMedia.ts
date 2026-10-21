import { useSyncExternalStore } from 'react'

export const MOBILE_QUERY = '(max-width: 719px)'

/** true cuando la media query coincide. Se actualiza al cambiar el viewport. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** true en pantallas ≤ 719px (listas como tarjetas, nav inferior, bottom sheets). */
export function useIsMobile(): boolean {
  return useMedia(MOBILE_QUERY)
}
