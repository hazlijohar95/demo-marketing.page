import cloudflare from "@astrojs/cloudflare"
import react from "@astrojs/react"
import { d1, r2 } from "@emdash-cms/cloudflare"
import { defineConfig } from "astro/config"
import emdash from "emdash/astro"

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // EmDash reads content from D1 at request time, so the blog routes render on
  // the Worker. The landing page opts back out with `prerender = true`.
  output: "server",
  adapter: cloudflare(),
  // Docs pages render Markdown as dark-terminal code blocks. Shiki supplies
  // token colours only; the background, border, and radius stay on the
  // design tokens in styles.css so highlighted code can't fight the system.
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "github-dark-dimmed",
      langs: ["ts", "typescript", "python", "bash", "shell", "json", "http", "text", "plaintext"],
      wrap: false,
    },
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
    }),
  ],
  server: {
    port: 5180,
  },
  vite: {
    // lucide-react + paper shaders benefit from explicit dep handling
    // on Vite 8 / Rolldown (Astro 7 default bundler).
    optimizeDeps: {
      include: ["react", "react-dom", "lucide-react"],
    },
  },
})
