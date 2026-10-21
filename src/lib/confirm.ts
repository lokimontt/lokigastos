import { createContext, useContext, type ReactNode } from 'react'

export type ConfirmOptions = {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Botón de confirmación en rojo (acción destructiva). */
  danger?: boolean
}

export type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false))

/** Devuelve `confirm(opts)` → Promise<boolean>. Reemplaza a window.confirm con un diálogo propio. */
export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext)
}
