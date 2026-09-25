// Temporizador de la pantalla 04: círculo punteado de 233px + anillo de progreso de 181px.
const SIZE = 181
const STROKE = 14 // grosor del anillo: pendiente de Figma
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const format = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function Timer({ timeLeft, total, className = '' }) {
  const progress = total > 0 ? timeLeft / total : 0

  return (
    <div className={`flex size-[233px] items-center justify-center rounded-full border-2 border-dotted border-brand-orange ${className}`}>
      <div className="relative flex size-[181px] items-center justify-center">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="timer-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" className="[stop-color:var(--color-brand-orange-deep)]" />
              <stop offset="1" className="[stop-color:var(--color-brand-orange-light)]" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#timer-gradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <span className="bg-brand-gradient bg-clip-text text-[64px] font-bold leading-none text-transparent">
          {format(timeLeft)}
        </span>
      </div>
    </div>
  )
}
