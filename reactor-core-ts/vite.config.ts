import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [react()],
    // CONDITIONAL BASE:
    // If we are building for production (npm run build), use the repo name.
    // If we are developing locally (npm run dev), use the root '/'.
    base: mode === 'production' ? '/pbsc-reactor-core/' : '/',
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})