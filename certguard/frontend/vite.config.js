import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/certguard-search/',   // Must match the GitHub repo name
  build: {
    outDir: 'dist',
  },
})
