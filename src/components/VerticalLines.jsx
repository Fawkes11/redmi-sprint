// Líneas verticales decorativas construidas en código (Figma: grupo de 11 líneas de 1197px).
// Cada línea = cuña de 16px #FF6900 al 60% con layer blur 18.1 (sin el vector blanco de Figma).
// En CSS, blur() usa la desviación estándar: el blur 18.1 de Figma equivale a blur(9.05px).
const LENGTH = 1197
const WIDTH = 16
// Centros en X del grupo (980px de ancho, líneas cada 98px) y desfase vertical de cada línea
const CENTERS = [0, 98, 196, 294, 392, 490, 588, 686, 784, 882, 980]
const OFFSETS = [0, 180, 320, 470, 630, 760, 630, 470, 320, 180, 0]

// Cuña de 16px que se afina hasta una punta (perfil del vector exportado de Figma)
const WEDGE_DOWN = 'polygon(0 0, 100% 0, 97.5% 5%, 52.5% 95%, 50% 100%, 47.5% 95%, 2.5% 5%)'

// Base ancha arriba y punta abajo (orientación de la pantalla 03)
export default function VerticalLines({ x, y }) {
  const wedge = WEDGE_DOWN
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y }} aria-hidden="true">
      {CENTERS.map((center, i) => (
        <div
          key={center}
          className="absolute"
          style={{ left: center - WIDTH / 2, top: OFFSETS[i], width: WIDTH, height: LENGTH }}
        >
          <div className="absolute inset-0 blur-[9.05px]">
            <div className="size-full bg-brand-orange/60" style={{ clipPath: wedge }} />
          </div>
        </div>
      ))}
    </div>
  )
}
