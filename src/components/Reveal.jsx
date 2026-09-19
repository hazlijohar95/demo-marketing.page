import { useEffect } from "react"

import { useInView } from "../lib/environment.js"

// Scroll reveal: adds `.is-visible` once the element scrolls into view.
// Built on the shared in-view hook so the reduced-motion instant path and
// the backgrounded-tab fallback live in exactly one place.
export default function Reveal({ as: Tag = "div", delay = 0, children, ...rest }) {
  const [ref, seen] = useInView(0.12)

  useEffect(() => {
    if (seen) ref.current?.classList.add("is-visible")
  }, [seen])

  return (
    <Tag ref={ref} data-reveal style={{ "--reveal-delay": `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}
