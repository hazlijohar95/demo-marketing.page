import { createContext, useContext, useEffect, useState } from "react"

export const ThemeContext = createContext("light")

export function useResolvedTheme() {
  return useContext(ThemeContext)
}

function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// SSR-safe system theme hook for Astro islands.
// Returns "light" on the server, then subscribes to OS changes on the client.
export function useSystemTheme() {
  const [system, setSystem] = useState(getSystemTheme)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event) => setSystem(event.matches ? "dark" : "light")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  return system
}
