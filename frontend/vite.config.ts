import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: { overlay: false },
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router-dom") || id.includes("@remix-run") || id.includes("/react/")) {
              return "vendor-react";
            }
            if (id.includes("motion") || id.includes("motion-dom")) {
              return "vendor-motion";
            }
            if (id.includes("@tanstack")) {
              return "vendor-query";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts";
            }
            if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("embla-carousel")) {
              return "vendor-radix";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
  },
}));
