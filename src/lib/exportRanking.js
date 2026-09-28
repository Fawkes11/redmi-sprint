// Exporta el ranking histórico del totem a un archivo descargable (queda en "Descargas").
// Formato pendiente de confirmar por el cliente: 'csv' (abre en Excel) o 'json'.
export const EXPORT_FORMAT = 'csv'

const COLUMNS = [
  ['Puesto', (_, i) => i + 1],
  ['Nombre', (e) => e.name],
  ['Puntaje', (e) => e.score],
  ['Respuestas', (e) => e.answered],
  ['Aciertos', (e) => e.correct],
  ['Fecha', (e) => new Date(e.playedAt).toLocaleString('es-CO')],
]

// CSV con punto y coma y BOM UTF-8: así Excel en español lo abre en columnas y con tildes correctas
const toCsv = (ranking) => {
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const rows = ranking.map((entry, i) => COLUMNS.map(([, get]) => cell(get(entry, i))).join(';'))
  return '﻿' + [COLUMNS.map(([title]) => cell(title)).join(';'), ...rows].join('\r\n')
}

const toJson = (ranking) =>
  JSON.stringify(ranking.map((entry, i) => Object.fromEntries(COLUMNS.map(([title, get]) => [title, get(entry, i)]))), null, 2)

export function exportRanking(ranking, format = EXPORT_FORMAT) {
  const content = format === 'json' ? toJson(ranking) : toCsv(ranking)
  const type = format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = `ranking-redmi-${stamp}.${format}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
