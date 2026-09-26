import { useState } from 'react'
import BrandButton from '../components/BrandButton.jsx'
import VerticalLines from '../components/VerticalLines.jsx'
import LiquidGradient from '../effects/LiquidGradient.jsx'
import Shine from '../effects/Shine.jsx'
import Icon from '../components/Icon.jsx'
import arrowBack from '@material-symbols/svg-200/outlined/arrow_back.svg?raw'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
// Figma: capa de 1040×1259 en X 18, Y 1034 (ya rotada). El PNG mide 1080×1351 porque incluye
// el margen de la sombra (20px a los lados y arriba), por eso se ubica en X -2, Y 1014
import phone from '../assets/devices/mobile-3-screen.png'

// 03 — Poner nombre (Figma 539:23). `validate(nombre)` devuelve el mensaje de error o null.
export default function PonerNombre({ onBack, onContinue, validate, phoneRef }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const submit = (event) => {
    event.preventDefault()
    const message = validate(name)
    if (message) return setError(message)
    onContinue(name.trim())
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-brand-gradient-v">
      <LiquidGradient className="absolute inset-0" />
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

      <img draggable={false} src={xiaomiLogo} alt="Xiaomi" className="absolute left-[417px] top-[334px] size-[245.3px] max-w-none" />

      <form onSubmit={submit} className="absolute inset-x-0 top-[768px] flex flex-col items-center">
        <label htmlFor="player-name" className="text-[48px] font-bold leading-none text-paper-white">
          NOMBRE
        </label>
        <div className="relative mt-[25px]">
          <input
            id="player-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby="player-name-error"
            className="h-[120px] w-[622px] rounded-[20px] bg-paper text-center text-[48px] font-bold text-brand-orange-deep outline-none"
          />
          {/* Mensaje de error debajo del campo, sin mover el botón */}
          <p
            id="player-name-error"
            role="alert"
            className="absolute inset-x-0 top-full mt-[14px] text-center text-[32px] font-semibold leading-none text-paper"
          >
            {error}
          </p>
        </div>
        <BrandButton type="submit" className="mt-[82px] relative z-20">
          CONTINUAR
        </BrandButton>
      </form>

      {/* Detalle inferior: círculos blancos superpuestos detrás del móvil */}
      <div className="absolute left-[-389px] top-[1571px] size-[1816px] rounded-full bg-paper shadow-soft" />
      <div className="absolute left-[-184px] top-[1777px] size-[1406px] rounded-full bg-paper shadow-soft" />
      <Shine imgRef={phoneRef} src={phone} className="absolute left-[-2px] top-[1014px]" delay={0.8} />
    </div>
  )
}
