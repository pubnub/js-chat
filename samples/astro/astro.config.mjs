import { defineConfig } from "astro/config"
import svelte from "@astrojs/svelte"
import tailwind from "@astrojs/tailwind"
import vue from "@astrojs/vue"
import react from "@astrojs/react"

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [svelte(), tailwind(), vue(), react()],
})
