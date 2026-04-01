import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: [
      "./vitest.setup.ts"
    ],
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx"
    ]
  }
});
