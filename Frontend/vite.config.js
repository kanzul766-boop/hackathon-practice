import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || "http://localhost:9000";
  return {
  plugins: [react()],
  server: {
    proxy: {
      "/auth": backend,
      "/doctor": backend,
      "/api": backend,
      "/doctors": backend,
      "/appointments": backend,
      "/admin": backend,
      "/notifications": backend,
      "/post": backend,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("gsap")) return "motion";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "react-vendor";
          return undefined;
        },
      },
    },
  },
  };
});
