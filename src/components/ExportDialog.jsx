import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import BrandButton from './BrandButton.jsx'
import { downloadCsv, rankingCsv } from '../lib/exportRanking.js'
import { getTotemKey, setTotemKey, uploadRanking } from '../lib/uploadRanking.js'

// Exportar el ranking: envía las partidas firmadas al servidor (que suma solo las nuevas) y muestra
// un QR a la página de descarga (protegida con PIN). La primera vez pide la clave de este totem.
// Sin internet, descarga el CSV aquí.
export default function ExportDialog({ ranking, onClose }) {
  const [state, setState] = useState(getTotemKey() ? 'subiendo' : 'clave')
  const [keyInput, setKeyInput] = useState('')
  const [message, setMessage] = useState('')
  const [qr, setQr] = useState(null)
  const [summary, setSummary] = useState('')

  const upload = async () => {
    setState('subiendo')
    try {
      const { url, totem, nuevas, total, sinCambios } = await uploadRanking(ranking)
      setSummary(
        sinCambios
          ? `${totem}: sin partidas nuevas, ya estaba actualizado (${total} jugadores).`
          : `${totem}: ${nuevas} ${nuevas === 1 ? 'partida nueva' : 'partidas nuevas'} (${total} jugadores en total).`,
      )
      setQr(await QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#444444', light: '#FFFFFF' } }))
      setState('listo')
    } catch (error) {
      if (error.kind === 'clave') {
        setMessage(error.message)
        setState('clave')
      } else {
        // Sin internet o error del servidor: el ranking no se pierde, queda descargado en el totem
        downloadCsv(rankingCsv(ranking))
        setMessage(error.kind === 'red' ? 'Sin conexión a internet.' : error.message)
        setState('local')
      }
    }
  }

  useEffect(() => {
    if (state === 'subiendo') upload()
  }, [])

  const saveKey = (event) => {
    event.preventDefault()
    if (keyInput.replace(/[^a-z0-9]/gi, '').length !== 16) return setMessage('La clave tiene 16 caracteres.')
    setTotemKey(keyInput)
    setMessage('')
    upload()
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/60" role="dialog" aria-modal="true">
      <div className="flex w-[820px] flex-col items-center rounded-[20px] bg-paper px-[56px] py-[64px] text-center text-ink-soft shadow-deep">
        {state === 'clave' && (
          <form onSubmit={saveKey} className="flex w-full flex-col items-center">
            <p className="bg-brand-gradient bg-clip-text text-[48px] font-bold leading-none text-transparent">CLAVE DEL TOTEM</p>
            <p className="mt-[24px] text-[28px] leading-snug">Solo la primera vez. Ingrésela tal como se la entregaron.</p>
            <input
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value.toUpperCase())}
              maxLength={19}
              autoComplete="off"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="mt-[40px] h-[110px] w-full rounded-[20px] bg-paper-white text-center text-[44px] font-bold tracking-[4px] text-brand-orange-deep shadow-answer outline-none placeholder:text-brand-orange-deep/30"
            />
            <p className="mt-[16px] h-[36px] text-[28px] font-semibold text-danger-from">{message}</p>
            <BrandButton type="submit" className="mt-[24px]">
              GUARDAR
            </BrandButton>
          </form>
        )}

        {state === 'subiendo' && <p className="text-[40px] font-bold">Exportando ranking…</p>}

        {state === 'listo' && (
          <>
            <p className="bg-brand-gradient bg-clip-text text-[48px] font-bold leading-none text-transparent">RANKING EXPORTADO</p>
            <img draggable={false} src={qr} alt="Código QR para descargar el ranking" className="mt-[40px] size-[480px] rounded-[20px]" />
            <p className="mt-[32px] text-[28px] font-semibold leading-snug">{summary}</p>
            <p className="mt-[12px] text-[28px] leading-snug">Escanee el código para descargarlo. Se pedirá el PIN.</p>
          </>
        )}

        {state === 'local' && (
          <>
            <p className="bg-brand-gradient bg-clip-text text-[48px] font-bold leading-none text-transparent">GUARDADO EN EL TOTEM</p>
            <p className="mt-[32px] text-[28px] leading-snug">
              {message} El ranking se descargó en la carpeta Descargas de este equipo.
            </p>
          </>
        )}

        {state !== 'subiendo' && (
          <BrandButton variant="light" onClick={onClose} className="mt-[40px] shadow-answer">
            CERRAR
          </BrandButton>
        )}
      </div>
    </div>
  )
}
