import { useLayoutEffect, useRef, useState } from 'react'

// Texto que reduce su tamaño (de `max` a `min`, en px) solo si no cabe según `fits(elemento)`.
export default function FitText({ children, max, min, fits, className = '', style }) {
  const ref = useRef(null)
  const [fontSize, setFontSize] = useState(max)

  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current
      if (!el) return
      let size = max
      el.style.fontSize = `${size}px`
      while (!fits(el) && size > min) {
        size -= 1
        el.style.fontSize = `${size}px`
      }
      setFontSize(size)
    }
    fit()
    // Volver a medir cuando cargue MiSans: con la fuente de respaldo el texto mide distinto
    document.fonts.ready.then(fit)
  }, [children, max, min, fits])

  return (
    <span ref={ref} className={className} style={{ ...style, fontSize }}>
      {children}
    </span>
  )
}
