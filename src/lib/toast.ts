import { createContext, useContext } from 'react'

export type ToastFn = (msg: string, tipo?: 'ok' | 'error') => void

export const ToastContext = createContext<ToastFn>(() => {})

export function useToast(): ToastFn {
  return useContext(ToastContext)
}
