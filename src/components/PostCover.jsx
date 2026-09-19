import { Dithering } from "@paper-design/shaders-react"

import { useInView, useSystemTheme } from "../lib/environment.js"
import { postCover } from "../lib/post-cover.js"

// Generated cover art for a post — see lib/post-cover.js for how a slug and a
// topic become a picture.
//
// speed={0} means the shader draws one frame and stops: no rAF loop, no
// recurring cost from four covers sitting on one page. `frame` is what varies
// the image, so nothing is lost by not animating. Mount is deferred until the
// card is in view so the WebGL contexts aren't all created on load, and the
// CSS dot plate underneath stays visible wherever WebGL isn't available.
export default function PostCover({ slug, topic, slot = "tile" }) {
  const theme = useSystemTheme()
  const [ref, show] = useInView(0.05)

  const cover = postCover(slug, topic, slot, theme)

  return (
    <span ref={ref} data-slot="tile-plate" data-cover={slot} aria-hidden="true">
      {show ? <Dithering key={theme} width="100%" height="100%" speed={0} {...cover} /> : null}
    </span>
  )
}
