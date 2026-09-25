import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base relativa: el build en dist/ se abre sin servidor ni rutas absolutas
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // 5173 lo ocupa el kiosko de Revlon en este equipo
  server: { port: 5180 },
})
