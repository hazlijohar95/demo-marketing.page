// Copy to clipboard. This module owns every copy interaction — the vanilla
// primitive, the shared reset delay, and the React hook — so the prose code
// chrome and the quickstart code blocks can't drift apart again.
import { useCallback, useEffect, useState } from "react"

// How long a copy button shows its "Copied" state before resetting.
// Shared by the vanilla chrome (code-chrome.js) and the React hook below:
// two 1600s written in two files silently become 1600 vs 2000 one day.
export const COPY_RESET_MS = 1600

// Modern clipboard write with legacy fallback isolated in one place.
// Returns true when the text was handed to the OS, false otherwise.
export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const area = document.createElement("textarea")
      area.value = value
      // Keep the fallback off-screen so it never flashes or scrolls.
      area.style.position = "fixed"
      area.style.opacity = "0"
      document.body.appendChild(area)
      area.select()
      // document.execCommand is deprecated but still the only fallback
      // where the async Clipboard API is unavailable (HTTP, old browsers).
      const ok = document.execCommand("copy")
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}

// React adapter at the same seam: copies `value` on call and exposes
// the transient copied flag, resetting on the shared delay.
export function useCopy(value) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), COPY_RESET_MS)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = useCallback(async () => {
    await copyText(value)
    setCopied(true)
  }, [value])

  return [copied, copy]
}
