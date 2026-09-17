import { useEffect, useRef } from "react"

import { onVisible } from "../lib/visible.js"
import { prefersReducedMotion } from "../lib/reduced-motion.js"

export default function Reveal({ as: Tag = "div", delay = 0, children, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.classList.add("is-visible")
      return
    }
    return onVisible(el, () => el.classList.add("is-visible"))
  }, [])

  return (
    <Tag ref={ref} data-reveal style={{ "--reveal-delay": `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}
