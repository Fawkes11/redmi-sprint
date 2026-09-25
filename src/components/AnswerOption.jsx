// Opción de respuesta A/B/C/D (Figma: bloque 740×108, caja de letra 100×100 r20).
export default function AnswerOption({ letter, text, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect} className="relative flex h-[108px] w-[740px] items-center text-left">
      <span
        className={`absolute inset-y-0 left-[50px] right-0 flex items-center rounded-[20px] pl-[65px] pr-[97px] text-[20px] font-normal leading-tight shadow-answer ${
          selected ? 'bg-brand-gradient text-paper-white' : 'bg-paper text-ink-soft'
        }`}
      >
        {text}
      </span>
      <span
        className={`relative flex w-[100px] h-full items-center justify-center rounded-[20px] ${
          selected ? 'bg-paper-white shadow-answer' : 'bg-brand-gradient'
        }`}
      >
        <span
          className={`text-[48px] font-bold leading-none ${
            selected ? 'bg-brand-gradient bg-clip-text text-transparent ' : 'text-paper-white'
          }`}
        >
          {letter}
        </span>
      </span>
    </button>
  )
}
