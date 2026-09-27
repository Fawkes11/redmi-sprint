import confetti from 'canvas-confetti'
import { effectsEnabled } from './enabled.js'

// Colores de confeti por puesto (tomados de las medallas de oro, plata y bronce)
const PALETTES = [
  ['#FFD54A', '#F5B400', '#FFE9A3', '#EB641C', '#F5A746'], // 1.º: dorados + naranjas de marca
  ['#F2F4F7', '#C9CED6', '#A5ACB8', '#FFFFFF', '#8E96A3'], // 2.º: plateados
  ['#E0995E', '#C2703D', '#A0522D', '#F3C39A', '#8B4A22'], // 3.º: bronces
]

// Lanza confeti desde ambos costados; el 1.º puesto recibe una segunda ráfaga más grande.
// Devuelve una función que limpia el confeti (al salir de la pantalla).
export function celebratePlace(place) {
  const colors = PALETTES[place]
  if (!colors || !effectsEnabled) return () => {}

  const burst = (particleCount, spread) => {
    confetti({ particleCount, spread, angle: 60, origin: { x: 0, y: 0.75 }, colors, startVelocity: 65 })
    confetti({ particleCount, spread, angle: 120, origin: { x: 1, y: 0.75 }, colors, startVelocity: 65 })
  }

  burst(place === 0 ? 120 : 80, 70)
  const second = place === 0 ? setTimeout(() => burst(90, 100), 450) : null

  return () => {
    clearTimeout(second)
    confetti.reset()
  }
}
