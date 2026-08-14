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
      input: {
        options: resolve(root, "options.html"),
        popup: resolve(root, "popup.html"),
        timeout: resolve(root, "timeout.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? ""
          if (name.endsWith(".css")) return "pages.css"
          return "assets/[name][extname]"
        },
      },
    },
  },
})
