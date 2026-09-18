// Generated cover art for a post, derived only from its slug and topic.
//
// Two rules make the covers feel designed rather than random:
//   1. The topic sets the ink and the order of preferred shapes, so every
//      Infrastructure post shares a visual family and the blog reads as
//      sections rather than as noise.
//   2. The slug picks the variation inside that family, so two posts in one
//      section don't get the same picture — and a given post's cover never
//      changes between the index tile and the article hero.
//
// One shader (Dithering) for all of them on purpose: a 1-bit ordered dither is
// two colours and a shape, which keeps the covers inside the site's
// mono/hairline vocabulary instead of importing a gradient look from elsewhere.

// FNV-1a. Small, stable across runs, and good enough to spread short slugs.
function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const pick = (list, seed) => list[seed % list.length]

// Three inks. --bx-success is deliberately absent: green means "isolated" in
// the status row, and reusing it as decoration would stop it meaning that.
//
// EMBER is the covers' own accent and the one colour here that isn't a site
// token — the UI accent stays blue (--bx-accent), so links and focus rings
// don't compete with the art. Its contrast is matched to the blue it replaced,
// 4.96 on the light surface and 5.54 on the dark against blue's 4.97 / 5.45, so
// the swap doesn't change how heavy a cover reads. Dither dots are sparse, so
// perceived contrast sits below the ratio; don't lighten these further.
const EMBER = { light: "#c2410c", dark: "#f97316" }
const TEXT = { light: "#161616", dark: "#d4d4d4" }
const MUTED = { light: "#5c5c5c", dark: "#a3a3a3" }

// Topics are a short curated list, so the ink is assigned rather than hashed:
// hashing the ten names happened to give two greys and no accent across the
// live posts, which made the topic families indistinguishable. Assigning also
// means neighbouring topics can be checked by eye here.
//
// `shapes` is relevance-first — a sphere for a machine, a swirl for an agent
// working, waves for signal, cells for isolation — and holds all five usable
// shapes rather than two or three. With a short list two posts in one topic
// frequently draw the same shape, and two identical spheres side by side on the
// index read as a bug. post-cover.test.mjs pins the live slugs against that.
//
// Of the shader's seven shapes only these five work at cover size: `simplex`
// renders mostly empty and `warp` swings between blank and good depending on
// the frame, which would hand some posts an empty cover.
const TOPICS = {
  agents: { ink: EMBER, shapes: ["swirl", "sphere", "ripple", "wave", "dots"] },
  sandboxes: { ink: EMBER, shapes: ["sphere", "dots", "swirl", "ripple", "wave"] },
  "vm sandboxes": { ink: EMBER, shapes: ["sphere", "swirl", "dots", "ripple", "wave"] },
  infrastructure: { ink: TEXT, shapes: ["dots", "ripple", "wave", "sphere", "swirl"] },
  kubernetes: { ink: TEXT, shapes: ["dots", "swirl", "ripple", "sphere", "wave"] },
  virtualization: { ink: TEXT, shapes: ["sphere", "swirl", "wave", "dots", "ripple"] },
  linux: { ink: MUTED, shapes: ["wave", "ripple", "dots", "swirl", "sphere"] },
  kernel: { ink: MUTED, shapes: ["wave", "ripple", "swirl", "dots", "sphere"] },
  networking: { ink: MUTED, shapes: ["ripple", "wave", "dots", "swirl", "sphere"] },
  security: { ink: TEXT, shapes: ["dots", "sphere", "wave", "ripple", "swirl"] },
}

// A tag the CMS grows later still gets a stable cover without a code change.
const INKS = [EMBER, TEXT, MUTED]
const ALL_SHAPES = ["wave", "ripple", "sphere", "swirl", "dots"]

// The tile surface. The cover has to sit on --bx-layer exactly, or it reads as
// a pasted-in rectangle rather than as part of the card.
const SURFACE = { light: "#fafafa", dark: "#242424" }

// Coarser dots on a small tile would look like a mistake, so dot size travels
// with the slot rather than with the post.
const SIZE = { hero: 2.4, lead: 2.2, tile: 1.8 }

// The shader's `scale` is relative to the canvas, so a value that frames the
// figure nicely in a 300px tile lets it flood a 1100px hero. Drawing into a
// fixed world box makes the composition size-independent.
//
// The world is 16:9 and every plate is 16:9, so `contain` and `cover` agree and
// nothing crops. That match matters: when the lead plate stretched to 1.29
// aspect, cover sliced the sphere clean in half.
const WORLD = { worldWidth: 900, worldHeight: 506, fit: "contain" }

/**
 * Shader props for one post's cover.
 * @param slug  post id — picks the variation
 * @param topic first tag — picks the family; null falls back to the slug
 * @param slot  "hero" | "lead" | "tile" — dot size only
 * @param theme "light" | "dark"
 */
export function postCover(slug, topic, slot = "tile", theme = "light") {
  const key = (topic ?? "").trim().toLowerCase()
  const seed = hash(`${slug}`)
  const family = TOPICS[key] ?? {
    ink: pick(INKS, hash(key || `${slug}`)),
    shapes: ALL_SHAPES,
  }

  return {
    ...WORLD,
    shape: pick(family.shapes, seed >>> 3),
    // 4x4 and 8x8 are the ordered matrices that still read as a print halftone
    // at this size; `random` is noise, not a pattern.
    type: pick(["4x4", "8x8"], seed >>> 7),
    colorBack: SURFACE[theme] ?? SURFACE.light,
    colorFront: family.ink[theme] ?? family.ink.light,
    size: SIZE[slot] ?? SIZE.tile,
    // 0.5-0.8. `scale` multiplies on top of the world box, so anything near 1
    // crops the figure to a wall of ink; below 0.5 it shrinks to a speck.
    scale: Math.round((0.5 + ((seed >>> 11) % 7) * 0.05) * 100) / 100,
    rotation: (seed >>> 15) % 360,
    // Small on purpose: this nudges the composition off-centre rather than
    // repositioning it, so the figure can't drift out of frame.
    offsetX: (((seed >>> 19) % 9) - 4) / 40,
    offsetY: (((seed >>> 23) % 9) - 4) / 40,
    // The one that matters most: `frame` moves the shader's own time, which is
    // what makes two posts on the same shape look like different pictures.
    frame: (seed % 9000) * 24,
  }
}
