import { defineLiveCollection } from "astro:content"
import { emdashLoader } from "emdash/runtime"

// Every EmDash content type arrives through this one live collection.
// Query it with getEmDashCollection("posts") / getEmDashEntry("posts", slug).
export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
}
