// Temporizador de la pantalla 04: círculo punteado de 233px + anillo de progreso de 181px.
const OUTER = 233
const OUTER_STROKE = 2
// Punteado: trazos de 6px separados por espacios de 7px (grosor 2px)
const OUTER_DASH = '6 7'
const RING = 13

const format = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

// timeLeftMs / totalMs en milisegundos: el anillo avanza de forma continua y el texto muestra segundos
export default function Timer({ timeLeftMs, totalMs, className = '' }) {
  const progress = totalMs > 0 ? timeLeftMs / totalMs : 0

  return (
    <div className={`relative flex size-[233px] items-center justify-center ${className}`}>
      <svg viewBox={`0 0 ${OUTER} ${OUTER}`} className="absolute inset-0 text-brand-orange" aria-hidden="true">
        <circle
          cx={OUTER / 2}
          cy={OUTER / 2}
          r={(OUTER - OUTER_STROKE) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={OUTER_STROKE}
          strokeDasharray={OUTER_DASH}
        />
      </svg>

      <div className="relative flex size-[181px] items-center justify-center">
        {/* Anillo de 13px con gradiente angular; la máscara cónica recorta el tiempo restante */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, var(--color-brand-orange-deep), var(--color-brand-orange-light), var(--color-brand-orange-deep))',
            // mask-image (no el atajo `mask`): al actualizarse cada tick, `mask` reiniciaría mask-composite.
            // Los gradientes no tienen antialiasing: cada borde se difumina ~1px (y 0.6° en el extremo
            // del progreso) para que el aro no se vea pixelado.
            maskImage: `radial-gradient(farthest-side, transparent calc(100% - ${RING + 1}px), #000 calc(100% - ${RING}px), #000 calc(100% - 1px), transparent 100%), conic-gradient(#000 ${progress}turn, transparent calc(${progress}turn + 0.6deg))`,
            maskComposite: 'intersect',
          }}
        />
        <span className="bg-brand-gradient-v bg-clip-text text-[62px] font-bold leading-none text-transparent">
          {format(Math.ceil(timeLeftMs / 1000))}
        </span>
      </div>
    </div>
  )
}
