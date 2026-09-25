import BrandButton from '../components/BrandButton.jsx'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
import redmiNote17 from '../assets/brand/redmi-note-17.svg'
import lines from '../assets/decor/vertical-lines.svg'
import phones from '../assets/devices/mobile-1-screen.png'

// 01 — Inicio (Figma 512:135)
export default function Inicio({ onStart }) {
  return (
    <div className="absolute inset-0 bg-paper">
      {/* Líneas decorativas (detrás de todo): arriba rotadas 180°, abajo sin rotar */}
      <img draggable={false} src={lines} alt="" className="absolute left-[22px] top-[-1299px] max-w-none rotate-180" />
      <img draggable={false} src={lines} alt="" className="absolute left-[23px] top-[830px] max-w-none" />

      {/* Semicírculo con gradiente de marca detrás de los teléfonos */}
      <div className="absolute left-[-67px] top-[1544px] size-[1214px] rounded-full bg-brand-gradient" />
      <img draggable={false} src={phones} alt="" className="absolute left-[201px] top-[1332px] max-w-none" />

      <img draggable={false} src={xiaomiLogo} alt="Xiaomi" className="absolute left-[437px] top-[284px] max-w-none" />
      <img
        draggable={false}
        src={redmiNote17}
        alt="REDMI Note 17 Series — Batería Máx. Energía Máx."
        className="absolute left-[153px] top-[603px] max-w-none"
      />

      <BrandButton onClick={onStart} className="absolute left-[268px] top-[1102px]">
        INICIAR
      </BrandButton>
    </div>
  )
}
