import BrandButton from '../components/BrandButton.jsx'
import Icon from '../components/Icon.jsx'
// Ícono `leaderboard` de Material Symbols redibujado con trazo de 40 unidades = 2px a 48px
// (el grosor 200 da 1.5px y el 300, 2.3px)
import leaderboard from '../assets/icons/leaderboard-2px.svg?raw'
import LiquidGradient from '../effects/LiquidGradient.jsx'
import Shine from '../effects/Shine.jsx'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
import redmiNote17 from '../assets/brand/redmi-note-17.svg'
import lines from '../assets/decor/vertical-lines.svg'
import phones from '../assets/devices/mobile-1-screen.png?format=webp&quality=85'

// 01 — Inicio (Figma 512:135)
export default function Inicio({ onStart, onRanking }) {
  return (
    <div className="absolute inset-0 bg-paper">
      {/* Líneas decorativas (detrás de todo): arriba rotadas 180°, abajo sin rotar */}
      <img draggable={false} src={lines} alt="" className="absolute left-[22px] top-[-1299px] max-w-none rotate-180" />
      <img draggable={false} src={lines} alt="" className="absolute left-[23px] top-[830px] max-w-none" />

      {/* Semicírculo con gradiente de marca detrás de los teléfonos */}
      <LiquidGradient fallback="bg-brand-gradient" className="absolute left-[-67px] top-[1544px] size-[1214px] overflow-hidden rounded-full" />
      <Shine src={phones} className="absolute left-[201px] top-[1332px]" />

      <img draggable={false} src={xiaomiLogo} alt="Xiaomi" className="absolute left-[437px] top-[284px] max-w-none" />
      <img
        draggable={false}
        src={redmiNote17}
        alt="REDMI Note 17 Series — Batería Máx. Energía Máx."
        className="absolute left-[153px] top-[603px] max-w-none"
      />

      {/* Acceso al ranking histórico, esquina superior derecha */}
      <button
        type="button"
        onClick={onRanking}
        aria-label="Ver ranking"
        className="absolute right-[48px] top-[48px] flex size-[96px] items-center justify-center rounded-full bg-brand-gradient text-paper-white shadow-soft active:brightness-95"
      >
        <Icon svg={leaderboard} size={48} />
      </button>

      <BrandButton onClick={onStart} className="absolute left-[268px] top-[1102px]">
        INICIAR
      </BrandButton>
    </div>
  )
}
