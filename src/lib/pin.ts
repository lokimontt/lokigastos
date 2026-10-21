import { createContext, useCallback, useContext, useMemo, useState, createElement, type ReactNode } from 'react'

export const PIN_STORAGE_KEY = 'loki_pin'

type PinContextValue = {
  pin: string | null
  setPin: (pin: string) => void
  salir: () => void
}

const PinContext = createContext<PinContextValue>({
  pin: null,
  setPin: () => {},
  salir: () => {},
})

function leerPinGuardado(): string | null {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function PinProvider({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState<string | null>(leerPinGuardado)

  const setPin = useCallback((nuevo: string) => {
    try {
      localStorage.setItem(PIN_STORAGE_KEY, nuevo)
    } catch {
      /* localStorage no disponible: solo en memoria */
    }
    setPinState(nuevo)
  }, [])

  const salir = useCallback(() => {
    try {
      localStorage.removeItem(PIN_STORAGE_KEY)
    } catch {
      /* ignorar */
    }
    setPinState(null)
  }, [])

  const value = useMemo(() => ({ pin, setPin, salir }), [pin, setPin, salir])
  return createElement(PinContext.Provider, { value }, children)
}

export function usePin(): PinContextValue {
  return useContext(PinContext)
}
