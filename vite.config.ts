import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    // Only apply noExternal for production builds to prevent HMR issues in development
    noExternal: process.env.NODE_ENV === 'production' ? [/@syncfusion/] : []
  }
});
