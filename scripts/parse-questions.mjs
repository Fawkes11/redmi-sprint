// Convierte el Excel del cliente a src/data/questions.json en build time.
// La respuesta correcta viene marcada en el Excel con relleno amarillo (#FFF258).
import ExcelJS from 'exceljs'
import { mkdir, writeFile } from 'node:fs/promises'

const SOURCE = new URL('../Questions REDMI Note 17 Series.xlsx', import.meta.url)
const OUTPUT = new URL('../src/data/questions.json', import.meta.url)
const SHEET = 'Questions RN17 Series'
const CORRECT_FILL = 'FFFFF258'
const OPTION_COLS = { A: 3, B: 4, C: 5, D: 6 }
// Respuestas confirmadas por el cliente para preguntas sin celda resaltada en el Excel.
// Solo se aplican si el Excel no marca ninguna; si lo marca, manda el Excel.
const CONFIRMED_ANSWERS = {
  59: 'D', // IP65 / polvo / salpicaduras
}

const clean = (value) => {
  const text = value?.richText ? value.richText.map((r) => r.text).join('') : value
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(SOURCE)
const sheet = workbook.getWorksheet(SHEET)
if (!sheet) throw new Error(`No existe la hoja "${SHEET}" en el Excel`)

const questions = []
const problems = []

sheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return
  const question = clean(row.getCell(2).value)
  if (!question) return

  const id = Number(clean(row.getCell(1).value)) || questions.length + 1
  const options = Object.entries(OPTION_COLS).map(([key, col]) => ({
    key,
    text: clean(row.getCell(col).value),
  }))
  let marked = Object.entries(OPTION_COLS)
    .filter(([, col]) => row.getCell(col).fill?.fgColor?.argb === CORRECT_FILL)
    .map(([key]) => key)
  if (marked.length === 0 && CONFIRMED_ANSWERS[id]) marked = [CONFIRMED_ANSWERS[id]]

  if (marked.length !== 1) problems.push(`Pregunta ${id}: ${marked.length} respuestas marcadas`)
  if (options.some((o) => !o.text)) problems.push(`Pregunta ${id}: opción vacía`)

  questions.push({ id, question, options, correct: marked.length === 1 ? marked[0] : null })
})

await mkdir(new URL('.', OUTPUT), { recursive: true })
await writeFile(OUTPUT, JSON.stringify(questions, null, 2) + '\n')

const playable = questions.filter((q) => q.correct).length
console.log(`questions.json: ${questions.length} preguntas (${playable} jugables)`)
problems.forEach((p) => console.warn(`  ⚠ ${p} — se excluye del juego hasta corregir el Excel`))
