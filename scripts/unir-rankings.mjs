// Une los rankings copiados del localStorage de varias direcciones o equipos, sin repetir partidas.
//
//   1. Guarde cada copia como un .json en la carpeta datos-ranking/ (p. ej. github.json,
//      msmarketing.json). Sirve lo copiado con «Copy object», con copy(localStorage.getItem(...))
//      o la exportación del panel Application ({"redmi-trivia-ranking-v1": "[...]"}).
//   2. npm run unir-rankings
//   3. Revise el resumen y pegue datos-ranking/unido.json como indica al final.
//
// Las partidas se comparan por su id (se crea una sola vez al jugar): la misma partida copiada
// de dos lugares cuenta una vez. datos-ranking/ tiene datos personales: no va al repositorio.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

const CARPETA = 'datos-ranking'
const SALIDA = 'unido.json'
const CLAVE = 'redmi-trivia-ranking-v1'

const hora = (iso) => new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota' })

// Acepta el arreglo, el texto del localStorage o el objeto { "redmi-trivia-ranking-v1": "[...]" }
function leerPartidas(texto) {
  let datos = JSON.parse(texto.replace(/^﻿/, ''))
  if (typeof datos === 'string') datos = JSON.parse(datos)
  if (datos && !Array.isArray(datos) && CLAVE in datos) datos = datos[CLAVE]
  if (typeof datos === 'string') datos = JSON.parse(datos)
  if (!Array.isArray(datos)) throw new Error('no contiene una lista de partidas')
  return datos
}

const valida = (p) =>
  p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim() !== '' &&
  Number.isInteger(p.score) && typeof p.playedAt === 'string' && !Number.isNaN(Date.parse(p.playedAt))

if (!existsSync(CARPETA)) {
  mkdirSync(CARPETA)
  console.log(`Se creó la carpeta ${CARPETA}/. Guarde ahí un .json por cada copia y vuelva a ejecutar.`)
  process.exit(0)
}
const archivos = readdirSync(CARPETA).filter((f) => f.endsWith('.json') && f !== SALIDA)
if (!archivos.length) {
  console.log(`No hay archivos .json en ${CARPETA}/.`)
  process.exit(0)
}

const porId = new Map() // id => { partida, fuentes }
const invalidas = []
const distintas = [] // mismo id con datos diferentes (no debería pasar)

console.log('\nARCHIVOS')
for (const archivo of archivos) {
  let partidas
  try {
    partidas = leerPartidas(readFileSync(`${CARPETA}/${archivo}`, 'utf8'))
  } catch (error) {
    console.log(`  ✗ ${archivo}: no se pudo leer (${error.message}). ¿Se copió completo?`)
    continue
  }
  let nuevas = 0
  for (const p of partidas) {
    if (!valida(p)) {
      invalidas.push({ archivo, p })
      continue
    }
    const actual = porId.get(p.id)
    if (!actual) {
      porId.set(p.id, { partida: p, fuentes: [archivo] })
      nuevas++
    } else {
      actual.fuentes.push(archivo)
      if (actual.partida.name !== p.name || actual.partida.score !== p.score) distintas.push({ archivo, p, antes: actual })
    }
  }
  const fechas = partidas.filter(valida).map((p) => p.playedAt).sort()
  const rango = fechas.length ? `${hora(fechas[0])} → ${hora(fechas.at(-1))}` : 'sin partidas'
  console.log(`  ${archivo}: ${partidas.length} partidas, ${nuevas} nuevas para la unión · ${rango}`)
}

// Mismo orden que el ranking del juego: mayor puntaje; en empate, la más reciente
const unido = [...porId.values()].map((v) => v.partida).sort((a, b) => b.score - a.score || b.playedAt.localeCompare(a.playedAt))
const enVarios = [...porId.values()].filter((v) => v.fuentes.length > 1).length

console.log('\nRESULTADO')
console.log(`  ${unido.length} partidas únicas`)
console.log(`  ${enVarios} estaban en más de un archivo (se cuentan una vez)`)
if (invalidas.length) console.log(`  ${invalidas.length} sin nombre o incompletas: se dejan fuera (el servidor tampoco las acepta)`)
for (const { archivo, p, antes } of distintas) {
  console.log(`  ⚠ ${p.id} tiene datos distintos en ${antes.fuentes[0]} y ${archivo}: se deja la de ${antes.fuentes[0]}`)
}

// Nombres repetidos: partidas distintas con el mismo nombre (misma persona en dos links, o pruebas)
const porNombre = new Map()
for (const p of unido) {
  const clave = p.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
  porNombre.set(clave, [...(porNombre.get(clave) ?? []), p])
}
const repetidos = [...porNombre.values()].filter((lista) => lista.length > 1)
if (repetidos.length) {
  console.log(`\nNOMBRES REPETIDOS (${repetidos.length}): son partidas distintas; decida en el totem cuál borrar con ✕`)
  for (const lista of repetidos) {
    console.log(`  ${lista[0].name}: ` + lista.map((p) => `${p.score} pts (${hora(p.playedAt)}, ${porId.get(p.id).fuentes.join(' + ')})`).join(' | '))
  }
}

writeFileSync(`${CARPETA}/${SALIDA}`, JSON.stringify(unido))
console.log(`\nGuardado en ${CARPETA}/${SALIDA}.`)
console.log('Para subirlo: en un navegador que NO sea el del totem, abra https://redmi-sprint.msmarketingco.com,')
console.log('pegue en la consola lo siguiente (reemplazando PEGAR_AQUI por el contenido de unido.json)')
console.log('y luego Exportar con la clave del totem. En el totem: administración → Recuperar del servidor.\n')
console.log(`  localStorage.setItem('${CLAVE}', JSON.stringify(PEGAR_AQUI)); JSON.parse(localStorage.getItem('${CLAVE}')).length\n`)
