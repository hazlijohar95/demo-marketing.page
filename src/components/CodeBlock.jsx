import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"

import { copyText } from "../lib/clipboard.js"

export default function CodeBlock({ filename, caption, code, langLabel }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])
  const copy = async () => {
    await copyText(code)
    setCopied(true)
  }
  return (
    <figure data-component="qs-code">
      <figcaption data-slot="qs-code-head">
        <span data-slot="qs-code-file">{filename}</span>
        {caption ? <span data-slot="qs-code-caption">{caption}</span> : null}
        {langLabel ? <span data-slot="qs-code-lang">{langLabel}</span> : null}
        <button
          type="button"
          data-slot="qs-copy"
          onClick={copy}
          aria-live="polite"
          aria-label={copied ? `Copied ${filename}` : `Copy ${filename} to clipboard`}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  )
}
