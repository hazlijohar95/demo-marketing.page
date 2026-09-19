import { Check, Copy } from "lucide-react"

import { useCopy } from "../lib/clipboard.js"

export default function CodeBlock({ filename, caption, code, langLabel }) {
  const [copied, copy] = useCopy(code)
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
      {/* Snippets scroll sideways rather than wrap, so the scroller needs a
          tab stop to be reachable without a pointer. */}
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </figure>
  )
}
