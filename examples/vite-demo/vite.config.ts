import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import fs from "node:fs";

function serveSiteAssets(): Plugin {
  const siteDir = path.resolve(__dirname, "../../site");
  return {
    name: "serve-site-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/ffocr/models/")) return next();
        const filePath = path.join(siteDir, req.url.replace(/^\/ffocr/, ""));
        if (!fs.existsSync(filePath)) return next();
        const stat = fs.statSync(filePath);
        res.setHeader("Content-Length", stat.size);
        res.setHeader("Access-Control-Allow-Origin", "*");
        fs.createReadStream(filePath).pipe(res);
      });
    }
  };
}

export default defineConfig({
  base: "/ffocr/demo/",
  build: {
    outDir: "../../site/demo",
    emptyOutDir: true
  },
  plugins: [serveSiteAssets()]
});
