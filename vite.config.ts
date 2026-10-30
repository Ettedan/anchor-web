import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base './' makes the build work when served from a sub-path (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
})
