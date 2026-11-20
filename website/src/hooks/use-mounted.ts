"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/** True only in the browser, after hydration. Used before reading the saved cart. */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
