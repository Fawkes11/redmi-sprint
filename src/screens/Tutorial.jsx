import Icon from '../components/Icon.jsx'
import editSquare from '@material-symbols/svg-200/outlined/edit_square.svg?raw'
import visibility from '@material-symbols/svg-200/outlined/visibility.svg?raw'
import touchApp from '@material-symbols/svg-200/outlined/touch_app.svg?raw'
import star from '@material-symbols/svg-200/outlined/star.svg?raw'
import trophy from '@material-symbols/svg-200/outlined/trophy.svg?raw'
import BrandButton from '../components/BrandButton.jsx'
import lines from '../assets/decor/vertical-lines.svg'

// Pasos del tutorial. Copy adaptado a modo individual (pendiente de confirmar en PENDIENTES-FIGMA.md).
const STEPS = [
  { icon: editSquare, title: 'Regístrate', text: 'Ingresa tu nombre' },
  { icon: visibility, title: 'Atento', text: 'Lee la pregunta en pantalla.' },
  { icon: touchApp, title: 'Responde', text: 'Escoge la respuesta correcta.' },
  { icon: star, title: 'Suma puntos', text: 'Cada acierto te acerca a la victoria.' },
  {
    icon: trophy,
    title: 'Gana',
    text: (
      <>
        El jugador con más puntos es <strong className="font-bold">EL MASTER.</strong>
      </>
    ),
  },
]

// 02 — Tutorial de uso (Figma 514:318)
export default function Tutorial({ onContinue }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-paper">
      {/* Círculos superiores: el 2 (con sombra) queda debajo del 1 */}
      <div className="absolute left-[-477px] top-[-1435px] size-[2032px] rounded-full bg-brand-gradient " />
      <div className="absolute left-[-477px] top-[-1797px] size-[2032px] rounded-full bg-brand-gradient shadow-strong" />

      {/* Círculos inferiores detrás del botón: el pequeño encima del grande */}
      <div className="absolute left-[-368px] top-[1191px] size-[1816px] rounded-full bg-paper shadow-strong" />
      <div className="absolute left-[53px] top-[1456px] size-[974px] rounded-full bg-paper shadow-soft" />
      <img src={lines} alt="" className="absolute left-[49px] top-[1293px] w-[980px] max-w-none" />

      <h1 className="absolute inset-x-0 top-[331px] text-center text-[96px] font-bold leading-none text-paper-white">
        ¿CÓMO JUGAR?
      </h1>

      <ol className="absolute left-1/2 top-[765px] flex h-[614px] w-[769px] -translate-x-1/2 flex-col justify-between">
        {STEPS.map((step) => (
          <li key={step.title} className="flex items-center gap-[25px]">
            <span className="flex size-[98px] shrink-0 items-center justify-center rounded-[18px] border-2 border-brand-orange text-brand-orange">
              <Icon svg={step.icon} size={52} />
            </span>
            <div className="text-[30px] leading-tight text-ink-soft">
              <p className="font-bold">{step.title}</p>
              {step.text && <p className="font-light">{step.text}</p>}
            </div>
          </li>
        ))}
      </ol>

      <BrandButton onClick={onContinue} className="absolute left-1/2 top-[1536px] -translate-x-1/2">
        CONTINUAR
      </BrandButton>
    </div>
  )
}
