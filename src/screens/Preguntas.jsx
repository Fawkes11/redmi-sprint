import AnswerOption from '../components/AnswerOption.jsx'
import FitText from '../components/FitText.jsx'
import Timer from '../components/Timer.jsx'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
import lines from '../assets/decor/vertical-lines-2.svg'
// Asset ya inclinado 5.38° y recortado por el borde derecho del frame: no se rota de nuevo
import phone from '../assets/devices/mobile-4-screen.png'

const FEEDBACK = {
  correct: { lines: ['¡BUEN', 'TRABAJO!'], text: 'bg-brand-gradient' },
  wrong: { lines: ['¡NO TE', 'RINDAS!'], text: 'bg-danger-gradient' },
}

const formatScore = (score) => String(score).padStart(6, '0')

// Pregunta: borde inferior fijo donde lo tiene Figma (Y 835, sobre el móvil) y crece hacia arriba
// hasta Y 710 (debajo del temporizador). Solo si aun así no cabe, reduce el tamaño desde 36px.
const QUESTION_BOTTOM = 835
const QUESTION_MAX_HEIGHT = QUESTION_BOTTOM - 710
const questionFits = (el) => el.scrollHeight <= QUESTION_MAX_HEIGHT

// Nombre en la tarjeta de puntaje: 96px, se reduce para que quepan nombres de 8–9 letras
// dentro del círculo naranja; más largos se recortan con "…" al llegar al mínimo.
const NAME_MAX_WIDTH = 400
const nameFits = (el) => el.scrollWidth <= el.clientWidth

// 04 — Inicio de preguntas (Figma 514:323). Solo presentación: la lógica vive en App (Fase 3).
export default function Preguntas({
  number,
  total,
  question,
  selected,
  onSelect,
  timeLeft,
  totalTime,
  feedback,
  playerName,
  score,
}) {
  const result = feedback && FEEDBACK[feedback]

  return (
    <div className="absolute inset-0 overflow-hidden bg-paper">
      {/* Mismo grupo de líneas que la pantalla 03, desplazado: punta central en Y 599 */}
      <img src={lines} alt="" className="absolute left-[25px] top-[-419px] max-w-none" />

      {/* Círculos detrás del resultado (debajo de las respuestas) */}
      <div className="absolute left-[53px] top-[1456px] size-[974px] rounded-full bg-paper shadow-soft-sm" />
      <div className="absolute left-[141px] top-[1609px] size-[798px] rounded-full bg-brand-gradient" />

      <img src={xiaomiLogo} alt="Xiaomi" className="absolute left-1/2 top-[64px] size-[122.65px] max-w-none -translate-x-1/2" />

      <div className="absolute left-1/2 top-[281px] flex h-[103px] w-[468px] -translate-x-1/2 items-center justify-center rounded-full bg-brand-gradient text-[48px] font-bold leading-none text-paper-white">
        Pregunta {number}/{total}
      </div>

      <Timer timeLeft={timeLeft} total={totalTime} className="absolute left-1/2 top-[456px] -translate-x-1/2" />

      <FitText
        max={36}
        min={20}
        fits={questionFits}
        className="absolute left-[72px] block w-[936px] text-center font-semibold leading-none text-ink-soft"
        style={{ bottom: 1920 - QUESTION_BOTTOM }}
      >
        {question.question}
      </FitText>

      <div className="absolute left-[72px] top-[958px] flex flex-col gap-[50px]">
        {question.options.map((option) => (
          <AnswerOption
            key={option.key}
            letter={option.key}
            text={option.text}
            selected={selected === option.key}
            onSelect={() => onSelect(option.key)}
          />
        ))}
      </div>

      {/* Móvil encima de las respuestas y de los círculos */}
      <img src={phone} alt="" className="pointer-events-none absolute left-[682px] top-[793px] max-w-none" />

      {result && (
        <div className="absolute left-[319px] top-[1569px] flex h-[143px] w-[442px] items-center justify-center rounded-full bg-ink-soft">
          <p className={`${result.text} bg-clip-text text-center text-[48px] font-black leading-none text-transparent`}>
            {result.lines[0]}
            <br />
            {result.lines[1]}
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 top-[1745px] flex h-[109.5px] items-center justify-center gap-[24px] text-paper-white">
        <FitText
          max={96}
          min={48}
          fits={nameFits}
          className="block truncate font-bold leading-none"
          style={{ maxWidth: NAME_MAX_WIDTH }}
        >
          {playerName}
        </FitText>
        <span className="h-[109px] w-[4px] bg-paper-white" />
        <span className="flex flex-col">
          <span className="text-[36px] font-light leading-none">TU PUNTAJE</span>
          <span className="text-[64px] font-bold leading-none">{formatScore(score)}</span>
        </span>
      </div>
    </div>
  )
}
