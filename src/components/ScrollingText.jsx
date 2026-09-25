import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

// Velocidad del recorrido (px por segundo) y pausa antes de empezar
const SPEED = 90
const DELAY = 1

// Texto en una sola línea: si no cabe en su ancho máximo, se desplaza poco a poco
// hasta mostrar el final. Al tocarlo, el recorrido vuelve a empezar.
export default function ScrollingText({ children, className = '' }) {
  const box = useRef(null)
  const text = useRef(null)
  const tween = useRef(null)

  const play = () => {
    tween.current?.kill()
    gsap.set(text.current, { x: 0 })
    const overflow = text.current.scrollWidth - box.current.clientWidth
    if (overflow <= 0) return
    tween.current = gsap.to(text.current, { x: -overflow, duration: overflow / SPEED, delay: DELAY, ease: 'none' })
  }

  useLayoutEffect(() => {
    play()
    // Volver a medir cuando cargue MiSans: con la fuente de respaldo el texto mide distinto
    document.fonts.ready.then(play)
    return () => tween.current?.kill()
  }, [children])

  return (
    <div ref={box} onClick={play} className={`w-fit overflow-hidden ${className}`}>
      <span ref={text} className="inline-block whitespace-nowrap">
        {children}
      </span>
    </div>
  )
}
