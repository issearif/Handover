import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite config for GitHub Pages deployment (frontend only)
export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist-github',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  base: './', // For GitHub Pages compatibility
})