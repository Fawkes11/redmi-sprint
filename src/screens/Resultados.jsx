import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import BrandButton from '../components/BrandButton.jsx'
import Icon from '../components/Icon.jsx'
import ScrollingText from '../components/ScrollingText.jsx'
import Shine from '../effects/Shine.jsx'
import { celebratePlace } from '../effects/celebrate.js'
import ExportDialog from '../components/ExportDialog.jsx'
import AdminDialog from '../components/AdminDialog.jsx'
import { recoverRanking } from '../lib/uploadRanking.js'
import arrowDown from '@material-symbols/svg-200/outlined/keyboard_arrow_down.svg?raw'
import arrowUp from '@material-symbols/svg-200/outlined/keyboard_arrow_up.svg?raw'
import download from '@material-symbols/svg-200/outlined/download.svg?raw'
import adminIcon from '@material-symbols/svg-200/outlined/admin_panel_settings.svg?raw'
import closeIcon from '@material-symbols/svg-200/outlined/close.svg?raw'
import xiaomiLogo from '../assets/brand/xiaomi-logo.svg'
// Recorte visible (1080×706) de la imagen de Figma de 1410×706 en X -164, Y 23
import phone from '../assets/devices/mobile-5-screen.png?format=webp&quality=85'
import gold from '../assets/ranking/gold.png?format=webp&quality=85'
import silver from '../assets/ranking/silver.png?format=webp&quality=85'
import bronze from '../assets/ranking/bronze.png?format=webp&quality=85'
import trophy from '../assets/ranking/trophy.png?format=webp&quality=85'

const MEDALS = [gold, silver, bronze]
const ROW_HEIGHT = 66
// Resultados: tabla de Figma (Y 1032, 7 filas). Vista de ranking desde Inicio: sin nombre ni cajas
// de puntaje, la tabla sube y muestra más filas.
const LAYOUTS = {
  results: { top: 1032, rows: 7 },
  ranking: { top: 660, rows: 12 },
}
// Margen a cada lado de la tabla para medallas (izquierda) e insignia MASTER (derecha)
const SIDE_LEFT = 53
const SIDE_RIGHT = 165
// Espacio a la derecha de la insignia para la barra de scroll (14px, ver scrollbar-brand)
const SCROLLBAR_SPACE = 26

const formatScore = (score) => String(score).padStart(6, '0')

// Jugador fuera de las filas visibles: tras este tiempo la tabla se abre y baja hasta su fila
const FOCUS_DELAY_MS = 1_000

// Modo administración: se cierra solo tras este tiempo sin tocar la pantalla
const ADMIN_IDLE_MS = 2 * 60 * 1000

function RankingRow({ entry, index, total, onDelete, focus }) {
  const dark = index % 2 === 0
  return (
    <li
      className={`relative text-[32px] font-bold leading-none ${
        dark ? 'bg-brand-orange-deep/30 text-paper-white' : 'text-brand-orange-deep'
      }`}
      style={{ height: ROW_HEIGHT }}
      ref={focus?.row}
    >
      {/* Fila del jugador: queda con el degradado de marca y destella al llegar (ver Ranking) */}
      {focus && (
        <>
          <span ref={focus.bg} className="absolute inset-0 bg-brand-gradient opacity-0" />
          <span ref={focus.flash} className="absolute inset-0 bg-paper-white opacity-0" />
        </>
      )}
      {/* Centros de columna tomados de Figma, relativos a la tabla */}
      <span className="absolute left-[77px] top-1/2 -translate-x-1/2 -translate-y-1/2 text-[36px]">{index + 1}</span>
      <span className="absolute left-[139px] top-1/2 h-[40px] w-[2px] -translate-y-1/2 bg-brand-orange" />
      {/* `truncate` recorta: el padding vertical da espacio a g, j, p, y (sigue centrado por el translate) */}
      <span className="absolute left-[275px] top-1/2 max-w-[220px] -translate-x-1/2 -translate-y-1/2 truncate py-[0.2em]">
        {entry.name}
      </span>
      <span className="absolute left-[430px] top-1/2 -translate-x-1/2 -translate-y-1/2">
        {entry.answered}/{total}
      </span>
      <span className="absolute left-[570px] top-1/2 -translate-x-1/2 -translate-y-1/2">{formatScore(entry.score)}</span>

      {index < MEDALS.length && (
        <img draggable={false} src={MEDALS[index]} alt="" className="absolute left-[-53px] top-1/2 h-[37.7px] w-[48px] max-w-none -translate-y-1/2" />
      )}
      {/* Modo administración: botón para eliminar en el lateral derecho (en lugar de la insignia) */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(entry)}
          aria-label={`Eliminar ${entry.name}`}
          className="absolute left-[705px] top-1/2 flex size-[54px] -translate-y-1/2 items-center justify-center rounded-full bg-danger-from text-paper-white shadow-answer active:brightness-90"
        >
          <Icon svg={closeIcon} size={36} />
        </button>
      )}
      {index === 0 && !onDelete && (
        <span className="absolute left-[687px] top-0 flex h-[66px] w-[165px] items-center gap-[3px] rounded-r-[10px] bg-ink-soft pl-[9px]">
          <img draggable={false} src={trophy} alt="" className="h-[40px] w-[43px] max-w-none" />
          <span className="bg-brand-gradient-v bg-clip-text text-[24px] font-bold text-transparent">MASTER</span>
        </span>
      )}
    </li>
  )
}

// Tabla "RANKING EN VIVO" (Figma: 687×575 en X 197, Y 1032; cabecera de 113 y filas de 66).
// Expandida, las filas hacen scroll dentro del mismo alto; el contenedor de scroll se extiende
// a los lados para no recortar medallas ni la insignia MASTER.
function Ranking({ entries, total, expanded, top, visibleRows, onDelete, focusIndex = -1 }) {
  const rows = expanded ? entries : entries.slice(0, visibleRows)
  const scrollRef = useRef(null)
  const focus = { row: useRef(null), bg: useRef(null), flash: useRef(null) }

  // Al abrirse la tabla: scroll suave hasta la fila del jugador (centrada), que pasa al degradado de
  // marca con texto blanco y destella tres veces
  useLayoutEffect(() => {
    if (!expanded || focusIndex < 0) return
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .to(scrollRef.current, { scrollTop: (focusIndex - (visibleRows - 1) / 2) * ROW_HEIGHT, duration: 1.2, ease: 'power2.inOut' })
        .to(focus.bg.current, { opacity: 1, duration: 0.4 })
        .to(focus.row.current, { color: '#ffffff', duration: 0.4 }, '<')
        .fromTo(focus.flash.current, { opacity: 0 }, { opacity: 0.6, duration: 0.3, repeat: 5, yoyo: true, ease: 'sine.inOut' })
    })
    return () => ctx.revert()
  }, [expanded, focusIndex])

  return (
    <div className="absolute left-[197px] w-[687px]" style={{ top }}>
      <div className="flex h-[113px] items-center justify-center rounded-t-[20px] bg-brand-gradient text-[32px] font-bold text-paper-white">
        RANKING EN VIVO
      </div>
      <div
        ref={scrollRef}
        className={`scrollbar-brand overflow-x-hidden ${expanded ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
        style={{
          height: ROW_HEIGHT * visibleRows,
          marginLeft: -SIDE_LEFT,
          width: 687 + SIDE_LEFT + SIDE_RIGHT + SCROLLBAR_SPACE,
          paddingLeft: SIDE_LEFT,
        }}
      >
        <ol className="min-h-full w-[687px] rounded-b-[20px] bg-paper-white/70">
          {rows.map((entry, index) => (
            <RankingRow
              key={entry.id}
              entry={entry}
              index={index}
              total={total}
              onDelete={onDelete}
              focus={index === focusIndex ? focus : undefined}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}

// 05 — Resultados (Figma 515:1132). "RESPUESTAS" cuenta todas las respuestas dadas.
// view="ranking": la misma pantalla abierta desde Inicio, solo con el ranking (sin jugador ni confeti),
// con exportar y modo administración (eliminar puntajes, protegido con PIN).
export default function Resultados({ view = 'results', playerName, score, answered, total, ranking, onFinish, onRemove, onMerge }) {
  const [expanded, setExpanded] = useState(false)
  const [exporting, setExporting] = useState(false)
  // PIN validado por el servidor: solo en memoria mientras dura el modo administración
  const [adminPin, setAdminPin] = useState(null)
  const [adminDialog, setAdminDialog] = useState(null) // { mode: 'pin' } | { mode: 'eliminar', entry }
  const [adminNotice, setAdminNotice] = useState('')
  const [activity, setActivity] = useState(0)
  const rankingOnly = view === 'ranking'
  const layout = LAYOUTS[view]
  const canExpand = ranking.length > layout.rows
  // Posición del jugador (los nombres son únicos en el ranking). Si quedó fuera de las filas visibles,
  // la tabla se abre sola y lo lleva hasta su fila.
  const playerIndex = rankingOnly ? -1 : ranking.findIndex((entry) => entry.name === playerName?.trim())
  const focusIndex = playerIndex >= layout.rows ? playerIndex : -1

  // Confeti al entrar, solo si el jugador quedó en el top 3 (los nombres son únicos en el ranking)
  useEffect(() => {
    if (rankingOnly) return
    return celebratePlace(playerIndex)
  }, [])

  useEffect(() => {
    if (focusIndex < 0) return
    const timer = setTimeout(() => setExpanded(true), FOCUS_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const exitAdmin = (notice = '') => {
    setAdminPin(null)
    setAdminDialog(null)
    setAdminNotice(notice)
  }

  // Temporal: suma al ranking local las partidas de este totem guardadas en el servidor (p. ej. las
  // que se jugaron en otra URL y se exportaron desde allí). Las que ya están aquí no se duplican.
  const [recovering, setRecovering] = useState(false)
  const recover = async () => {
    setRecovering(true)
    try {
      const added = onMerge(await recoverRanking(adminPin))
      exitAdmin(added === 1 ? 'Se recuperó 1 partida del servidor.' : added ? `Se recuperaron ${added} partidas del servidor.` : 'No había partidas nuevas en el servidor.')
    } catch (error) {
      exitAdmin(error.kind === 'red' ? 'Sin conexión: no se pudo recuperar.' : error.message)
    } finally {
      setRecovering(false)
    }
  }

  // Se cierra solo tras 2 minutos sin actividad (y al salir de la pantalla, porque se desmonta)
  useEffect(() => {
    if (!adminPin) return
    const timer = setTimeout(() => exitAdmin(), ADMIN_IDLE_MS)
    return () => clearTimeout(timer)
  }, [adminPin, activity])

  return (
    <div className="absolute inset-0 overflow-hidden bg-brand-gradient-v" onPointerDown={adminPin ? () => setActivity((n) => n + 1) : undefined}>
      {/* Círculos superiores: el grande al fondo y el pequeño encima */}
      <div className="absolute left-[-291px] top-[-1174px] size-[1688px] rounded-full bg-ink-soft" />
      <div className="absolute left-[-141px] top-[-1072px] size-[1362px] rounded-full bg-ink-soft shadow-deep" />
      <Shine src={phone} className="absolute left-0 top-[23px]" delay={0.5} />

      <img draggable={false} src={xiaomiLogo} alt="Xiaomi" className="absolute left-[474.15px] top-[323px] size-[131px] max-w-none" />

      <div className="absolute inset-x-0 top-[548px] flex flex-col items-center text-paper-white">
        {rankingOnly ? (
          <>
            <p className="text-[64px] font-bold leading-none">RANKING</p>
            {adminPin ? (
              <p className="mt-[14px] text-[26px] font-semibold leading-none">
                {recovering ? (
                  'Recuperando partidas del servidor…'
                ) : (
                  <>
                    Toque ✕ para eliminar ·{' '}
                    {/* Temporal: trae las partidas de este totem exportadas desde otra URL */}
                    <button type="button" onClick={recover} className="underline">
                      Recuperar del servidor
                    </button>{' '}
                    ·{' '}
                  </>
                )}
                <button type="button" onClick={() => exitAdmin()} className="underline" hidden={recovering}>
                  Salir
                </button>
              </p>
            ) : (
              adminNotice && <p className="mt-[14px] text-[26px] font-semibold leading-none">{adminNotice}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-[64px] font-bold leading-none">RESULTADOS</p>
            {/* Nombres largos: se recorren de izquierda a derecha; tocar para repetir */}
            <ScrollingText className="mt-[14px] max-w-[1000px] text-[128px] font-black leading-none">{playerName}</ScrollingText>
          </>
        )}
      </div>

      {!rankingOnly && [
        { label: 'PUNTAJE', value: formatScore(score), left: 227 },
        { label: 'RESPUESTAS', value: `${answered}/${total}`, left: 545 },
      ].map((stat) => (
        <div key={stat.label} className="absolute top-[809px] flex w-[308px] flex-col items-center" style={{ left: stat.left }}>
          <p className="text-[40px] font-bold leading-none text-paper-white">{stat.label}</p>
          <div className="mt-[11px] flex h-[137px] w-[308px] items-center justify-center rounded-[20px] bg-paper-white/70">
            <span className="bg-brand-gradient-v bg-clip-text text-[64px] font-bold leading-none text-transparent">{stat.value}</span>
          </div>
        </div>
      ))}

      <Ranking
        entries={ranking}
        total={total}
        expanded={expanded}
        top={layout.top}
        visibleRows={layout.rows}
        onDelete={adminPin ? (entry) => setAdminDialog({ mode: 'eliminar', entry }) : undefined}
        focusIndex={focusIndex}
      />

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

      {/* Exportar el ranking (misma forma que el botón de ranking de Inicio, esquina superior derecha) */}
      {rankingOnly && (
        <button
          type="button"
          onClick={() => setExporting(true)}
          aria-label="Exportar ranking"
          className="absolute right-[48px] top-[48px] flex size-[96px] items-center justify-center rounded-full bg-brand-gradient text-paper-white shadow-soft active:brightness-95"
        >
          <Icon svg={download} size={48} />
        </button>
      )}

      {/* Administrar: eliminar puntajes de este totem (esquina superior izquierda, con PIN) */}
      {rankingOnly && (
        <button
          type="button"
          onClick={() => (adminPin ? exitAdmin() : setAdminDialog({ mode: 'pin' }))}
          aria-label={adminPin ? 'Salir de administración' : 'Administrar ranking'}
          className={`absolute left-[48px] top-[48px] flex size-[96px] items-center justify-center rounded-full text-paper-white shadow-soft active:brightness-95 ${
            adminPin ? 'bg-danger-from ring-4 ring-paper-white' : 'bg-brand-gradient'
          }`}
        >
          <Icon svg={adminIcon} size={48} />
        </button>
      )}

      <BrandButton variant="light" onClick={onFinish} className="absolute left-[285px] top-[1725px]">
        {rankingOnly ? 'VOLVER AL INICIO' : 'FINALIZAR'}
      </BrandButton>

      {exporting && <ExportDialog ranking={ranking} onExcluded={onRemove} onImport={onMerge} onClose={() => setExporting(false)} />}
      {adminDialog && (
        <AdminDialog
          mode={adminDialog.mode}
          entry={adminDialog.entry}
          pin={adminPin}
          onUnlock={(pin) => {
            setAdminPin(pin)
            setAdminNotice('')
            setAdminDialog(null)
          }}
          onDeleted={(ids) => {
            onRemove(ids)
            setAdminDialog(null)
          }}
          onPinRejected={(message) => exitAdmin(message)}
          onClose={() => setAdminDialog(null)}
        />
      )}
    </div>
  )
}
