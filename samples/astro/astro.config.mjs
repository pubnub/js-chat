import { defineConfig } from "astro/config"
import svelte from "@astrojs/svelte"
import tailwind from "@astrojs/tailwind"

import vue from "@astrojs/vue"

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [svelte(), tailwind(), vue()],
})
