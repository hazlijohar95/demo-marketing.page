import { defineConfig } from "astro/config"
import react from "@astrojs/react"

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  integrations: [react()],
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
