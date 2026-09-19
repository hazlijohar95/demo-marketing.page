// Manual theme override (light / dark / system), shared by every adapter.
//
// The design system is system-themed by default (tokens.css media query).
// This module owns the override: canonical key, normalization, DOM apply,
// and React hook. Canvas islands (DotField, SandboxField, PostCover) read
// the resolved theme so shaders stay in sync with a manual choice.
import { useCallback, useEffect, useState } from "react"

import { useMediaQuery } from "./environment.js"
import { readStored, writeStored } from "./use-local-storage.js"

export const THEME_KEY = "bx-theme"

export function normalizeTheme(value) {
  return value === "light" || value === "dark" ? value : "system"
}

export function readTheme() {
  if (typeof window === "undefined") return "system"
  return normalizeTheme(readStored(THEME_KEY, "system"))
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return
  const normalized = normalizeTheme(theme)
  if (normalized === "system") {
    document.documentElement.removeAttribute("data-theme")
  } else {
    document.documentElement.setAttribute("data-theme", normalized)
  }
}

export function writeTheme(theme) {
  const normalized = normalizeTheme(theme)
  // Snap, don't smear: the themed-surface transitions would otherwise fire
  // together across the whole page. Suppress them across the swap and restore
  // after paint. Only the manual toggle snaps — OS-driven switches keep the
  // CSS crossfade in tokens.css.
  if (typeof document !== "undefined") {
    const style = document.createElement("style")
    style.appendChild(document.createTextNode("*,*::before,*::after{transition:none !important}"))
    document.head.append(style)
    writeStored(THEME_KEY, normalized)
    applyTheme(normalized)
    // Read for its side effect: forces a synchronous flush so the new colors
    // commit while the override still applies.
    void document.body?.offsetHeight
    requestAnimationFrame(() => {
      requestAnimationFrame(() => style.remove())
    })
  } else {
    writeStored(THEME_KEY, normalized)
    applyTheme(normalized)
  }
}

// Resolved theme for paint decisions: manual choice wins, otherwise OS.
export function useResolvedTheme() {
  const [override, setOverride] = useState(() => readTheme())
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)", false)

  useEffect(() => {
    setOverride(readTheme())
    const onStorage = (event) => {
      if (event.key === THEME_KEY) setOverride(normalizeTheme(event.newValue))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const set = useCallback((next) => {
    const normalized = normalizeTheme(typeof next === "function" ? next(readTheme()) : next)
    writeTheme(normalized)
    setOverride(normalized)
  }, [])

  const resolved = override === "system" ? (systemDark ? "dark" : "light") : override
  return [resolved, override, set]
}
