import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Se publican dos páginas: la app (index.html) y la demo para clientes (demo.html → /demo)
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: 'index.html', demo: 'demo.html' } } },
})
