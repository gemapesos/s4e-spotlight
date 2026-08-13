import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

const root = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(root, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(root, "options.html"),
      output: {
        entryFileNames: "options.js",
        chunkFileNames: "options-[name].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? ""
          if (name.endsWith(".css")) return "options.css"
          return "assets/[name][extname]"
        },
      },
    },
  },
})
