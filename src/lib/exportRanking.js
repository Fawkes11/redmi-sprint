// Ranking histórico del totem en CSV: para subirlo al servidor (ver uploadRanking.js) o, si no
// hay internet, descargarlo en el propio totem (carpeta "Descargas").
const COLUMNS = [
  ['Puesto', (_, i) => i + 1],
  ['Nombre', (e) => e.name],
  ['Puntaje', (e) => e.score],
  ['Respuestas', (e) => e.answered],
  ['Aciertos', (e) => e.correct],
  ['Fecha', (e) => new Date(e.playedAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })],
]

// Un nombre como "=HYPERLINK(...)" se ejecutaría como fórmula al abrir el CSV en Excel:
// se neutraliza anteponiendo un apóstrofo, que Excel no muestra.
const neutralize = (value) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value)

// CSV con punto y coma y BOM UTF-8: Excel en español lo abre en columnas y con tildes correctas.
// Solo depende del ranking (no de la hora de exportación): el mismo ranking da el mismo archivo.
export function rankingCsv(ranking) {
  const cell = (value) => `"${neutralize(String(value ?? '')).replace(/"/g, '""')}"`
  const rows = ranking.map((entry, i) => COLUMNS.map(([, get]) => cell(get(entry, i))).join(';'))
  return '﻿' + [COLUMNS.map(([title]) => cell(title)).join(';'), ...rows].join('\r\n')
}

// Descarga en la carpeta "Descargas" con fecha y hora de Colombia en el nombre:
// ranking-redmi-2026-09-28-15-54.csv. Devuelve el nombre del archivo.
function download(content, suffix, type) {
  const stamp = new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).slice(0, 16).replace(/[ :]/g, '-')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = `ranking-redmi-${stamp}${suffix}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  return link.download
}

export const downloadCsv = (csv) => download(csv, '.csv', 'text/csv;charset=utf-8')

// Archivo de traslado (ver transferFile en uploadRanking.js)
export const downloadTransfer = (json) => download(json, '-traslado.json', 'application/json')
