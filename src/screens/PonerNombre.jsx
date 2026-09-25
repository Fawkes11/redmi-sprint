import { useState } from 'react'
import BrandButton from '../components/BrandButton.jsx'
import VerticalLines from '../components/VerticalLines.jsx'
import Icon from '../components/Icon.jsx'
import arrowBack from '@material-symbols/svg-200/outlined/arrow_back.svg?raw'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
// Recorte visible (1080×645) de la imagen de Figma de 1245×1075 en X -150, Y 1275
import phone from '../assets/devices/mobile-3-screen.png'

// 03 — Poner nombre (Figma 539:23)
export default function PonerNombre({ onBack, onContinue }) {
  const [name, setName] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onContinue(trimmed)
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-brand-gradient-v">
      {/* Líneas verticales (grupo de 980×1957 en X 50, Y -939), detrás de todo */}
      <VerticalLines x={50} y={-939} />

      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="absolute left-[38px] top-[33px] text-paper-white"
      >
        <Icon svg={arrowBack} size={125} />
      </button>

      <img src={xiaomiLogo} alt="Xiaomi" className="absolute left-[417px] top-[334px] size-[245.3px] max-w-none" />

      <form onSubmit={submit} className="absolute inset-x-0 top-[768px] flex flex-col items-center">
        <label htmlFor="player-name" className="text-[48px] font-bold leading-none text-paper-white">
          NOMBRE
        </label>
        <input
          id="player-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          className="mt-[25px] h-[120px] w-[622px] rounded-[20px] bg-paper text-center text-[48px] font-bold text-brand-orange-deep outline-none"
        />
        <BrandButton type="submit" className="mt-[82px]">
          CONTINUAR
        </BrandButton>
      </form>

      {/* Detalle inferior: círculos blancos superpuestos detrás del móvil */}
      <div className="absolute left-[-389px] top-[1571px] size-[1816px] rounded-full bg-paper shadow-soft" />
      <div className="absolute left-[-184px] top-[1777px] size-[1406px] rounded-full bg-paper shadow-soft" />
      <img src={phone} alt="" className="absolute left-0 top-[1275px] max-w-none" />
    </div>
  )
}
