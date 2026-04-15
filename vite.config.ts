import { defineConfig } from "vitest/config";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import type { Connect } from "vite";

async function corsProxyHandler(
  req: Connect.IncomingMessage,
  res: import("node:http").ServerResponse,
  next: Connect.NextFunction,
) {
  const target = new URLSearchParams((req.url ?? "").slice(1)).get("url");
  if (!target) {
    res.statusCode = 400;
    res.end("missing url param");
    return;
  }
  try {
    const upstream = await fetch(target);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ?? "application/octet-stream",
    );
    const buf = await upstream.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    next(err);
  }
}

const corsProxyPlugin = {
  name: "cors-proxy",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use("/img-proxy", corsProxyHandler);
  },
  configurePreviewServer(server: import("vite").PreviewServer) {
    server.middlewares.use("/img-proxy", corsProxyHandler);
  },
};

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    corsProxyPlugin,
  ],
  test: {
    environment: "node",
  },
});
