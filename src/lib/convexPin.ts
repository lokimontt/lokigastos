import { useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server'
import { usePin } from './pin'

type SinPin<A> = Omit<A, 'pin'>

/**
 * useQuery que inyecta `pin` automáticamente. Si no hay PIN guardado o args === 'skip',
 * la query no se ejecuta (retorna undefined).
 */
export function usePinQuery<Q extends FunctionReference<'query'>>(
  ref: Q,
  args?: SinPin<FunctionArgs<Q>> | 'skip',
): FunctionReturnType<Q> | undefined {
  const { pin } = usePin()
  const finalArgs = pin === null || args === 'skip' ? 'skip' : { ...(args ?? {}), pin }
  // El cast es necesario porque Omit<> pierde la relación con FunctionArgs<Q>.
  return useQuery(ref, finalArgs as FunctionArgs<Q> | 'skip')
}

/** useMutation que inyecta `pin` automáticamente en cada llamada. */
export function usePinMutation<M extends FunctionReference<'mutation'>>(
  ref: M,
): (args?: SinPin<FunctionArgs<M>>) => Promise<FunctionReturnType<M>> {
  const { pin } = usePin()
  const mutate = useMutation(ref)
  return useCallback(
    (args?: SinPin<FunctionArgs<M>>) => mutate({ ...(args ?? {}), pin: pin ?? '' } as FunctionArgs<M>),
    [mutate, pin],
  )
}
