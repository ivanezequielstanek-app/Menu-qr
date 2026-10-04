// Genera una demo de un solo archivo (sin Supabase) para mostrar los diseños
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-demo', rollupOptions: { input: 'demo.html' } },
})
