// SDK language preference (TypeScript vs Python), shared by every adapter.
//
// Two callers grew their own keys for the same choice: the Quickstart page
// (React, `bx-qs-lang`) and the Prose enhancement docs switcher (vanilla DOM,
// `bx-docs-lang`). A persistence fix had to land twice. This module owns the
// canonical values, the keys, and the private-mode-tolerant storage policy;
// the React hook and the vanilla readers/writers below are adapters at its
// seam. Reads fall back through the legacy keys so existing visitors keep
// their choice (lazy migration: the new key is written on next change).
import { useCallback } from "react"

import { readStored, useLocalStorage, writeStored } from "./use-local-storage.js"

// Canonical key. Legacy keys are read-only fallbacks, never written.
export const SDK_LANG_KEY = "bx-sdk-lang"
const LEGACY_QS_KEY = "bx-qs-lang"
const LEGACY_DOCS_KEY = "bx-docs-lang"

export function normalizeSdkLang(value) {
  return value === "py" ? "py" : "ts"
}

// Vanilla adapter: current key first, then the two legacy keys, then "ts".
export function readSdkLang() {
  const raw =
    readStored(SDK_LANG_KEY) ?? readStored(LEGACY_QS_KEY) ?? readStored(LEGACY_DOCS_KEY)
  return normalizeSdkLang(raw)
}

export function writeSdkLang(lang) {
  writeStored(SDK_LANG_KEY, normalizeSdkLang(lang))
}

// React adapter at the same seam. Initial state resolves through the same
// fallback chain (SSR-safe: no window means "ts"); sets normalize.
export function useSdkLanguage() {
  const [lang, setLang] = useLocalStorage(SDK_LANG_KEY, readSdkLang())

  const set = useCallback(
    (next) => {
      setLang((prev) => normalizeSdkLang(typeof next === "function" ? next(prev) : next))
    },
    [setLang],
  )

  return [normalizeSdkLang(lang), set]
}
