import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^node:fs\/promises$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^fs\/promises$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:fs$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^fs$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:path$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^path$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:os$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^os$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:crypto$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^crypto$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:readline$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^readline$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:timers\/promises$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^timers\/promises$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:buffer$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^buffer$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^stream$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:stream$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^util$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:util$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^events$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
      { find: /^node:events$/, replacement: path.resolve(__dirname, "./src/mocks/node-mock.js") },
    ],
  },
})
