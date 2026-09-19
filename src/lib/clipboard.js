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
