import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base relativa: el build en dist/ se abre sin servidor ni rutas absolutas.
// Modo "kiosko" (npm run paquete): todo (JS, CSS, fuentes, imágenes) va dentro de un único
// index.html, para que el totem lo abra como archivo local sin servidor.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'kiosko' ? [viteSingleFile()] : [])],
  build: mode === 'kiosko' ? { outDir: 'dist-kiosko', assetsInlineLimit: Infinity } : {},
  // 5173 lo ocupa el kiosko de Revlon en este equipo
  server: { port: 5180 },
}))
