import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/postcss";
export default defineConfig({
  publicDir: false,
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    {
      name: "arkeid-platform-origin",
      resolveId(id) {
        if (id === "virtual:arkeid-config")
          return { id: "/sdk/config.js", external: true };
      },
    },
  ],
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
});
