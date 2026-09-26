import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import VerticalLines from './VerticalLines.jsx'
import { timeUpEnter } from '../lib/transitions.js'
import phoneTop from '../assets/devices/mobile-7-screen-4a.png'
import phoneBottom from '../assets/devices/mobile-6-screen-4a.png'

// Columna de 5 bloques de dos líneas (MiSans Heavy 128, interlineado 97.7%) cada 360px desde Y 115;
// el del centro es el sólido y el resto solo contorno
const COLUMN_TOP = 115
const BLOCK_PITCH = 360
const BLOCKS = ['outline', 'outline', 'solid', 'outline', 'outline']
const OUTLINE = { color: 'transparent', WebkitTextStroke: '1px #fff' }

function Block({ style }) {
  return (
    <p className="flex flex-col items-center text-[128px] font-black leading-[0.977] text-paper-white" style={style}>
      <span>¡TIEMPO</span>
      <span>FINALIZADO!</span>
    </p>
  )
}

// Capa "¡TIEMPO FINALIZADO!" sobre la pantalla 04 cuando se agota el reloj (Figma: 05 - Tiempo finalizado)
export default function TimeUpOverlay() {
  const root = useRef(null)

  // gsap.context + revert: al desmontar (o en el doble montaje de StrictMode) se restauran los
  // estilos iniciales; con kill() el `from` quedaría congelado en su estado de partida
  useLayoutEffect(() => {
    const context = gsap.context(() => timeUpEnter(root.current), root)
    return () => context.revert()
  }, [])

  return (
    <div ref={root} className="absolute inset-0 z-10 overflow-hidden bg-brand-gradient-v" role="alert">
      <VerticalLines x={50} y={-939} />

      {/* Rodillo: la columna completa se repite 3 veces; la animación la baja dos columnas (dos vueltas)
          y se detiene con el texto sólido en el centro */}
      <div data-reel-strip className="absolute inset-x-0" style={{ top: COLUMN_TOP }}>
        {[0, 1, 2].map((copy) => (
          <div key={copy} aria-hidden={copy > 0}>
            {BLOCKS.map((kind, i) => (
              <div key={i} style={{ height: BLOCK_PITCH }}>
                <Block style={kind === 'outline' ? OUTLINE : null} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <img draggable={false} data-phone="top" src={phoneTop} alt="" className="absolute left-[499px] top-[-245px] max-w-none" />
      <img draggable={false} data-phone="bottom" src={phoneBottom} alt="" className="absolute left-[-253px] top-[1130px] max-w-none" />
    </div>
  )
}
