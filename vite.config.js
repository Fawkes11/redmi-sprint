import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { imagetools } from 'vite-imagetools'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base relativa: el build funciona en cualquier carpeta o subdominio.
// - Web (npm run build): imágenes en WebP y service worker que guarda toda la app en el totem
//   tras la primera carga, para que siga abriendo aunque se caiga internet.
// - Modo "kiosko" (npm run paquete): todo dentro de un único index.html para abrirlo como archivo
//   local; ahí no hay service worker (no funciona en file://).

// Las herramientas de desarrollo (src/dev/: cuadro de pendientes, parámetros de vista previa) se
// importan con import.meta.glob, que Vite resuelve al compilar aunque solo se usen en desarrollo.
// En los builds de producción se reemplazan por un módulo vacío para que no queden en el bundle.
const EMPTY_DEV_MODULE = '\0dev-tools-vacio'
const stripDevTools = {
  name: 'strip-dev-tools',
  apply: 'build',
  enforce: 'pre',
  resolveId(source) {
    const path = source.replace(/\\/g, '/')
    if (path.includes('/src/dev/') || path.startsWith('./dev/')) return EMPTY_DEV_MODULE
  },
  load(id) {
    if (id === EMPTY_DEV_MODULE) return 'export default undefined'
  },
}

export default defineConfig(({ mode }) => {
  const kiosko = mode === 'kiosko'

  return {
    base: './',
    // public/ trae los PHP del servidor: van en el build web (cPanel), no en el paquete local
    publicDir: kiosko ? false : 'public',
    plugins: [
      stripDevTools,
      react(),
      tailwindcss(),
      // Convierte los PNG importados con ?format=webp al compilar; los originales no se tocan.
      // En el paquete kiosko se incrustan (inline) para que todo quede dentro del index.html.
      imagetools({ defaultDirectives: () => new URLSearchParams(kiosko ? 'inline' : '') }),
      kiosko
        ? viteSingleFile()
        : VitePWA({
            // Sin recarga forzada: la versión nueva se activa la próxima vez que se abra la app,
            // nunca en medio de una partida
            registerType: 'autoUpdate',
            injectRegister: 'script-defer',
            manifest: false,
            workbox: {
              globPatterns: ['**/*.{html,js,css,webp,svg,woff2,png}'],
              maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              clientsClaim: true,
              skipWaiting: true,
              // ?efectos=no (y cualquier parámetro) debe abrir el mismo index.html guardado
              ignoreURLParametersMatching: [/.*/],
              // App de una sola página: sin fallback de navegación, así el SW de main (raíz de Pages)
              // no responde con su index.html a la vista previa en /efectos/
              navigateFallback: null,
            },
          }),
    ],
    build: kiosko ? { outDir: 'dist-kiosko', assetsInlineLimit: Infinity } : {},
    // 5173 lo ocupa el kiosko de Revlon en este equipo
    server: { port: 5180 },
  }
})
