import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" damit das Build auch auf GitHub Pages in einem Unterpfad läuft
export default defineConfig({
  base: "./",
  plugins: [react()],
});
