import { useState } from 'react'
import BrandButton from '../components/BrandButton.jsx'
import Icon from '../components/Icon.jsx'
import ScrollingText from '../components/ScrollingText.jsx'
import arrowDown from '@material-symbols/svg-200/outlined/keyboard_arrow_down.svg?raw'
import arrowUp from '@material-symbols/svg-200/outlined/keyboard_arrow_up.svg?raw'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
// Recorte visible (1080×706) de la imagen de Figma de 1410×706 en X -164, Y 23
import phone from '../assets/devices/mobile-5-screen.png'
import gold from '../assets/ranking/gold.png'
import silver from '../assets/ranking/silver.png'
import bronze from '../assets/ranking/bronze.png'
import trophy from '../assets/ranking/trophy.png'

const MEDALS = [gold, silver, bronze]
const ROW_HEIGHT = 66
const VISIBLE_ROWS = 7
// Margen a cada lado de la tabla para medallas (izquierda) e insignia MASTER (derecha)
const SIDE_LEFT = 53
const SIDE_RIGHT = 165
// Espacio a la derecha de la insignia para la barra de scroll (14px, ver scrollbar-brand)
const SCROLLBAR_SPACE = 26

const formatScore = (score) => String(score).padStart(6, '0')

function RankingRow({ entry, index, total }) {
  const dark = index % 2 === 0
  return (
    <li
      className={`relative text-[32px] font-bold leading-none ${
        dark ? 'bg-brand-orange-deep/30 text-paper-white' : 'text-brand-orange-deep'
      }`}
      style={{ height: ROW_HEIGHT }}
    >
      {/* Centros de columna tomados de Figma, relativos a la tabla */}
      <span className="absolute left-[77px] top-1/2 -translate-x-1/2 -translate-y-1/2 text-[36px]">{index + 1}</span>
      <span className="absolute left-[139px] top-1/2 h-[40px] w-[2px] -translate-y-1/2 bg-brand-orange" />
      <span className="absolute left-[275px] top-1/2 max-w-[250px] -translate-x-1/2 -translate-y-1/2 truncate">{entry.name}</span>
      <span className="absolute left-[430px] top-1/2 -translate-x-1/2 -translate-y-1/2">
        {entry.correct}/{total}
      </span>
      <span className="absolute left-[570px] top-1/2 -translate-x-1/2 -translate-y-1/2">{formatScore(entry.score)}</span>

      {index < MEDALS.length && (
        <img src={MEDALS[index]} alt="" className="absolute left-[-53px] top-1/2 h-[37.7px] w-[48px] max-w-none -translate-y-1/2" />
      )}
      {index === 0 && (
        <span className="absolute left-[687px] top-0 flex h-[66px] w-[165px] items-center gap-[3px] rounded-r-[10px] bg-ink-soft pl-[9px]">
          <img src={trophy} alt="" className="h-[40px] w-[43px] max-w-none" />
          <span className="bg-brand-gradient-v bg-clip-text text-[24px] font-bold text-transparent">MASTER</span>
        </span>
      )}
    </li>
  )
}

// Tabla "RANKING EN VIVO" (Figma: 687×575 en X 197, Y 1032; cabecera de 113 y filas de 66).
// Expandida, las filas hacen scroll dentro del mismo alto; el contenedor de scroll se extiende
// a los lados para no recortar medallas ni la insignia MASTER.
function Ranking({ entries, total, expanded }) {
  const rows = expanded ? entries : entries.slice(0, VISIBLE_ROWS)
  return (
    <div className="absolute left-[197px] top-[1032px] w-[687px]">
      <div className="flex h-[113px] items-center justify-center rounded-t-[20px] bg-brand-gradient text-[32px] font-bold text-paper-white">
        RANKING EN VIVO
      </div>
      <div
        className={`scrollbar-brand overflow-x-hidden ${expanded ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
        style={{
          height: ROW_HEIGHT * VISIBLE_ROWS,
          marginLeft: -SIDE_LEFT,
          width: 687 + SIDE_LEFT + SIDE_RIGHT + SCROLLBAR_SPACE,
          paddingLeft: SIDE_LEFT,
        }}
      >
        <ol className="min-h-full w-[687px] rounded-b-[20px] bg-paper-white/70">
          {rows.map((entry, index) => (
            <RankingRow key={entry.id} entry={entry} index={index} total={total} />
          ))}
        </ol>
      </div>
    </div>
  )
}

// 05 — Resultados (Figma 515:1132). Solo presentación: los datos llegan desde App (Fase 3).
export default function Resultados({ playerName, score, correct, total, ranking, onFinish, initialExpanded = false }) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const canExpand = ranking.length > VISIBLE_ROWS

  return (
    <div className="absolute inset-0 overflow-hidden bg-brand-gradient-v">
      {/* Círculos superiores: el grande al fondo y el pequeño encima */}
      <div className="absolute left-[-291px] top-[-1174px] size-[1688px] rounded-full bg-ink-soft" />
      <div className="absolute left-[-141px] top-[-1072px] size-[1362px] rounded-full bg-ink-soft shadow-deep" />
      <img src={phone} alt="" className="absolute left-0 top-[23px] max-w-none" />

      <img src={xiaomiLogo} alt="Xiaomi" className="absolute left-[474.15px] top-[323px] size-[131px] max-w-none" />

      <div className="absolute inset-x-0 top-[548px] flex flex-col items-center text-paper-white">
        <p className="text-[64px] font-bold leading-none">RESULTADOS</p>
        {/* Nombres largos: se recorren de izquierda a derecha; tocar para repetir */}
        <ScrollingText className="mt-[14px] max-w-[1000px] text-[128px] font-black leading-none">{playerName}</ScrollingText>
      </div>

      {[
        { label: 'PUNTAJE', value: formatScore(score), left: 227 },
        { label: 'RESPUESTAS', value: `${correct}/${total}`, left: 545 },
      ].map((stat) => (
        <div key={stat.label} className="absolute top-[809px] flex w-[308px] flex-col items-center" style={{ left: stat.left }}>
          <p className="text-[40px] font-bold leading-none text-paper-white">{stat.label}</p>
          <div className="mt-[11px] flex h-[137px] w-[308px] items-center justify-center rounded-[20px] bg-paper-white/70">
            <span className="bg-brand-gradient-v bg-clip-text text-[64px] font-bold leading-none text-transparent">{stat.value}</span>
          </div>
        </div>
      ))}

      <Ranking entries={ranking} total={total} expanded={expanded} />

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="absolute inset-x-0 top-[1642px] mx-auto flex h-[48px] w-fit items-center text-[36px] font-semibold text-paper-white"
        >
          {expanded ? 'Mostrar menos' : 'Mostrar más'}
          <Icon svg={expanded ? arrowUp : arrowDown} size={48} />
        </button>
      )}

      <BrandButton variant="light" onClick={onFinish} className="absolute left-[285px] top-[1725px]">
        FINALIZAR
      </BrandButton>
    </div>
  )
}
