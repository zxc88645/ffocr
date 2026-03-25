import { defineConfig } from "vite";

export default defineConfig({
  base: "/ffocr/demo/",
  build: {
    outDir: "../../site/demo",
    emptyOutDir: true
  }
});
