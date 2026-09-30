import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import BrandButton from './BrandButton.jsx'
import { downloadCsv, rankingCsv } from '../lib/exportRanking.js'
import { clearTotemKey, getTotemKey, getTotemName, identifyTotem, setTotemKey, uploadRanking } from '../lib/uploadRanking.js'

const Title = ({ children }) => (
  <p className="bg-brand-gradient bg-clip-text text-[48px] font-bold leading-none text-transparent">{children}</p>
)

// Exportar el ranking: envía las partidas firmadas al servidor (que suma solo las nuevas) y muestra
// un QR a la página de descarga (protegida con PIN). La primera vez pide la clave de este totem y,
// antes de enviar nada, confirma a qué totem pertenece. Sin internet, descarga el CSV aquí.
export default function ExportDialog({ ranking, onExcluded, onClose }) {
  const [state, setState] = useState(getTotemKey() ? 'subiendo' : 'clave')
  const [keyInput, setKeyInput] = useState('')
  const [pending, setPending] = useState(null) // { key, totem } a confirmar
  const [message, setMessage] = useState('')
  const [qr, setQr] = useState(null)
  const [summary, setSummary] = useState('')
  // Respaldo local una sola vez, aunque se reintente varias veces
  const savedLocally = useRef(false)

  const upload = async () => {
    setState('subiendo')
    try {
      const { url, totem, nuevas, total, omitidas = 0, excluidas = [], sinCambios } = await uploadRanking(ranking)
      // Partidas eliminadas en modo administración que este totem aún tenía: se quitan también aquí
      if (excluidas.length) onExcluded?.(excluidas)
      setSummary(
        (sinCambios
          ? `${totem}: sin partidas nuevas, ya estaba actualizado (${total} jugadores).`
          : `${totem}: ${nuevas} ${nuevas === 1 ? 'partida nueva' : 'partidas nuevas'} (${total} jugadores en total).`) +
          (omitidas ? ` ${omitidas} ${omitidas === 1 ? 'partida omitida' : 'partidas omitidas'} por datos incompletos.` : ''),
      )
      setQr(await QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#444444', light: '#FFFFFF' } }))
      setState('listo')
    } catch (error) {
      if (error.kind === 'clave') {
        setMessage(error.message)
        setState('clave')
      } else {
        // Sin internet o error del servidor: el ranking no se pierde, queda descargado en el totem
        if (!savedLocally.current) downloadCsv(rankingCsv(ranking))
        savedLocally.current = true
        setMessage(error.kind === 'red' ? 'Sin conexión a internet.' : error.message)
        setState('local')
      }
    }
  }

  useEffect(() => {
    if (state === 'subiendo') upload()
  }, [])

  // Paso 1: identificar el totem de la clave, sin enviar partidas
  const checkKey = async (event) => {
    event.preventDefault()
    if (keyInput.replace(/[^a-z0-9]/gi, '').length !== 16) return setMessage('La clave tiene 16 caracteres.')
    setMessage('')
    setState('verificando')
    try {
      const { totem } = await identifyTotem(keyInput)
      setPending({ key: keyInput, totem })
      setState('confirmar')
    } catch (error) {
      setMessage(error.kind === 'red' ? 'Sin conexión: no se pudo comprobar la clave.' : error.message)
      setState('clave')
    }
  }

  // Paso 2: confirmado el totem, se guarda la clave y recién ahí se envían las partidas
  const confirmKey = () => {
    setTotemKey(pending.key, pending.totem)
    setPending(null)
    upload()
  }

  const changeKey = () => {
    clearTotemKey()
    setPending(null)
    setKeyInput('')
    setMessage('')
    setState('clave')
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/60" role="dialog" aria-modal="true">
      <div className="flex w-[820px] flex-col items-center rounded-[20px] bg-paper px-[56px] py-[64px] text-center text-ink-soft shadow-deep">
        {state === 'clave' && (
          <form onSubmit={checkKey} className="flex w-full flex-col items-center">
            <Title>CLAVE DEL TOTEM</Title>
            <p className="mt-[24px] text-[28px] leading-snug">Ingrese la clave de este totem, tal como se la entregaron.</p>
            <input
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value.toUpperCase())}
              maxLength={19}
              autoComplete="off"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="mt-[40px] h-[110px] w-full rounded-[20px] bg-paper-white text-center text-[44px] font-bold tracking-[4px] text-brand-orange-deep shadow-answer outline-none placeholder:text-brand-orange-deep/30"
            />
            <p className="mt-[16px] min-h-[36px] text-[28px] font-semibold text-danger-from">{message}</p>
            <BrandButton type="submit" className="mt-[24px]">
              COMPROBAR
            </BrandButton>
          </form>
        )}

        {state === 'verificando' && <p className="text-[40px] font-bold">Comprobando clave…</p>}

        {state === 'confirmar' && (
          <>
            <Title>¿ES ESTE TOTEM?</Title>
            <p className="mt-[32px] text-[28px] leading-snug">Esta clave pertenece a:</p>
            <p className="mt-[12px] text-[56px] font-black leading-tight text-brand-orange-deep">{pending.totem}</p>
            <p className="mt-[24px] text-[28px] leading-snug">Las partidas de este equipo se sumarán a ese totem.</p>
            <BrandButton onClick={confirmKey} className="mt-[40px]">
              SÍ, CONTINUAR
            </BrandButton>
            <BrandButton variant="light" onClick={changeKey} className="mt-[24px] shadow-answer">
              CAMBIAR CLAVE
            </BrandButton>
          </>
        )}

        {state === 'subiendo' && <p className="text-[40px] font-bold">Exportando ranking…</p>}

        {state === 'listo' && (
          <>
            <Title>RANKING EXPORTADO</Title>
            <img draggable={false} src={qr} alt="Código QR para descargar el ranking" className="mt-[40px] size-[480px] rounded-[20px]" />
            <p className="mt-[32px] text-[28px] font-semibold leading-snug">{summary}</p>
            <p className="mt-[12px] text-[28px] leading-snug">Escanee el código para descargarlo. Se pedirá el PIN.</p>
          </>
        )}

        {state === 'local' && (
          <>
            <Title>NO SE PUDO EXPORTAR</Title>
            <p className="mt-[32px] text-[28px] font-semibold leading-snug text-danger-from">{message}</p>
            <p className="mt-[12px] text-[28px] leading-snug">
              Por seguridad, el ranking se descargó en la carpeta Descargas de este equipo.
            </p>
            <BrandButton onClick={upload} className="mt-[40px]">
              VOLVER A INTENTAR
            </BrandButton>
          </>
        )}

        {!['subiendo', 'verificando', 'confirmar'].includes(state) && (
          <BrandButton variant="light" onClick={onClose} className="mt-[40px] shadow-answer">
            CERRAR
          </BrandButton>
        )}

        {/* Totem enlazado y opción para cambiarlo (si se escribió la clave de otro totem por error) */}
        {['listo', 'local'].includes(state) && getTotemName() && (
          <p className="mt-[32px] text-[24px] leading-snug">
            Enlazado como <strong>{getTotemName()}</strong> ·{' '}
            <button type="button" onClick={changeKey} className="font-semibold text-brand-orange-deep underline">
              Cambiar clave
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
