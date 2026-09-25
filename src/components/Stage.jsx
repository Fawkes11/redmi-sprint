import { useEffect, useState } from 'react'

// Lienzo fijo de 1080×1920 (tamaño de los frames de Figma) escalado al viewport del totem.
const WIDTH = 1080
const HEIGHT = 1920

const fitScale = () => Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)

export default function Stage({ children }) {
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div style={{ width: WIDTH * scale, height: HEIGHT * scale }}>
        <div
          className="relative h-[1920px] w-[1080px] origin-top-left overflow-hidden bg-paper font-misans"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
