import { useState } from 'react'
import BrandButton from './BrandButton.jsx'
import { adminRequest } from '../lib/uploadRanking.js'

const formatScore = (score) => String(score).padStart(6, '0')

const Title = ({ children }) => (
  <p className="bg-brand-gradient bg-clip-text text-[48px] font-bold leading-none text-transparent">{children}</p>
)

const errorText = (error) =>
  error.kind === 'red' ? 'Sin conexión: se necesita internet para administrar el ranking.' : error.message

// Ventanas del modo administración del ranking (en el totem):
// - mode "pin": pide el PIN de 6 dígitos; lo valida el servidor (con bloqueo por intentos).
// - mode "eliminar": confirma y elimina una partida del servidor (queda excluida para siempre).
// El PIN solo vive en memoria mientras dura el modo administración; nunca se guarda.
export default function AdminDialog({ mode, pin, entry, onUnlock, onDeleted, onPinRejected, onClose }) {
  const [pinInput, setPinInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const unlock = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(pinInput)) return setMessage('El PIN tiene 6 dígitos.')
    setBusy(true)
    setMessage('')
    try {
      await adminRequest(pinInput)
      onUnlock(pinInput)
    } catch (error) {
      setMessage(errorText(error))
      setPinInput('')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setMessage('')
    try {
      await adminRequest(pin, [entry.id])
      onDeleted([entry.id])
    } catch (error) {
      // PIN rechazado (p. ej. bloqueo por intentos): se sale del modo administración
      if (error.kind === 'pin') return onPinRejected(error.message)
      setMessage(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/60" role="dialog" aria-modal="true">
      <div className="flex w-[820px] flex-col items-center rounded-[20px] bg-paper px-[56px] py-[64px] text-center text-ink-soft shadow-deep">
        {mode === 'pin' && (
          <form onSubmit={unlock} className="flex w-full flex-col items-center">
            <Title>ADMINISTRAR RANKING</Title>
            <p className="mt-[24px] text-[28px] leading-snug">Ingrese el PIN para eliminar puntajes de este totem.</p>
            <input
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              type="password"
              autoComplete="off"
              aria-label="PIN"
              className="mt-[40px] h-[110px] w-[420px] rounded-[20px] bg-paper-white text-center text-[56px] font-bold tracking-[16px] text-brand-orange-deep shadow-answer outline-none"
            />
            <p className="mt-[16px] min-h-[36px] text-[28px] font-semibold text-danger-from">{message}</p>
            <BrandButton type="submit" disabled={busy} className="mt-[24px]">
              {busy ? 'COMPROBANDO…' : 'ENTRAR'}
            </BrandButton>
          </form>
        )}

        {mode === 'eliminar' && (
          <>
            <Title>¿ELIMINAR PUNTAJE?</Title>
            <p className="mt-[32px] text-[56px] font-black leading-tight text-brand-orange-deep">{entry.name}</p>
            <p className="mt-[8px] text-[32px] font-bold">{formatScore(entry.score)} puntos</p>
            <p className="mt-[24px] text-[28px] leading-snug">
              Se borrará de este totem y del servidor, y no volverá a aparecer.
            </p>
            <p className="mt-[16px] min-h-[36px] text-[28px] font-semibold text-danger-from">{message}</p>
            <BrandButton onClick={remove} disabled={busy} className="mt-[24px]">
              {busy ? 'ELIMINANDO…' : 'ELIMINAR'}
            </BrandButton>
          </>
        )}

        <BrandButton variant="light" onClick={onClose} disabled={busy} className="mt-[24px] shadow-answer">
          CANCELAR
        </BrandButton>
      </div>
    </div>
  )
}
