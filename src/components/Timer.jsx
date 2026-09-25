// Temporizador de la pantalla 04: círculo punteado de 233px + anillo de progreso de 181px.
const OUTER = 233
const OUTER_STROKE = 2
// Punteado: trazos de 6px separados por espacios de 7px (grosor 2px)
const OUTER_DASH = '6 7'
const RING = 13

const format = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function Timer({ timeLeft, total, className = '' }) {
  const progress = total > 0 ? timeLeft / total : 0

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
            mask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING}px)), conic-gradient(#000 ${progress}turn, transparent 0)`,
            maskComposite: 'intersect',
          }}
        />
        <span className="bg-brand-gradient-v bg-clip-text text-[62px] font-bold leading-none text-transparent">
          {format(timeLeft)}
        </span>
      </div>
    </div>
  )
}
