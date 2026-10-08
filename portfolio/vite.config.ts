import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standalone personal-portfolio app. Kept separate from the RecallAI product
// frontend (../frontend) because it needs its own TS + three.js/R3F/GSAP toolchain.
export default defineConfig({
  plugins: [react()],
});
