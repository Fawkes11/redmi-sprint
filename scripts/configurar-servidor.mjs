// Genera el config.php del servidor (va en cPanel FUERA de la carpeta pública del subdominio).
//
//   Crear:            npm run configurar-servidor -- 482913 "Totem Andino" "Totem Unicentro 1"
//   Agregar totems:   npm run configurar-servidor -- --agregar "Totem Santafe"
//
// - PIN de descarga (6 dígitos): solo se guarda su hash (bcrypt).
// - Cada totem recibe su propia clave de 16 caracteres, asociada a su nombre. Esa clave es su
//   identidad: no cambia mientras no se regenere, y se escribe una vez en el totem al exportar.
// - "--agregar" conserva las claves existentes y el PIN; solo suma los totems nuevos.
// El archivo queda en redmi-config/config.php (ignorado por git). No lo compartas.
import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const RUTA = 'redmi-config/config.php'
// Sin caracteres confundibles (0/O, 1/I/L) para escribirla fácil en el teclado táctil
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const nuevaClave = () => Array.from({ length: 16 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')
const conGuiones = (clave) => clave.match(/.{4}/g).join('-')
// Misma regla que redmi_slug() en PHP: la carpeta de cada totem sale de su nombre
const slug = (nombre) =>
  nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'totem'

const salir = (mensaje) => {
  console.error(mensaje)
  process.exit(1)
}

const args = process.argv.slice(2)
let pinHash
let totems = {} // clave => nombre

if (args[0] === '--agregar') {
  if (!existsSync(RUTA)) salir(`No existe ${RUTA}. Primero créalo con el PIN y los totems.`)
  const actual = readFileSync(RUTA, 'utf8')
  pinHash = actual.match(/'pin_hash' => '([^']+)'/)?.[1]
  for (const [, clave, nombre] of actual.matchAll(/'([A-Z0-9]{16})' => '((?:[^'\\]|\\.)*)'/g)) totems[clave] = nombre.replace(/\\'/g, "'")
  args.shift()
} else {
  const pin = args.shift() ?? ''
  if (!/^\d{6}$/.test(pin)) salir('Uso: npm run configurar-servidor -- <PIN de 6 dígitos> "Nombre totem 1" "Nombre totem 2" ...')
  // PHP usa el prefijo $2y$ para el mismo algoritmo bcrypt
  pinHash = bcrypt.hashSync(pin, 12).replace(/^\$2[ab]\$/, '$2y$')
}

if (!args.length) salir('Indica al menos un nombre de totem, por ejemplo "Totem Andino".')
const usados = new Set(Object.values(totems).map(slug))
const creados = []
for (const nombre of args) {
  const limpio = nombre.trim()
  if (!limpio || limpio.length > 60) salir(`Nombre inválido: "${nombre}"`)
  if (usados.has(slug(limpio))) salir(`Ya existe un totem con un nombre equivalente a "${limpio}".`)
  usados.add(slug(limpio))
  const clave = nuevaClave()
  totems[clave] = limpio
  creados.push([limpio, clave])
}

const esc = (texto) => texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const lineas = Object.entries(totems).map(([clave, nombre]) => `        '${clave}' => '${esc(nombre)}',`)
const php = `<?php
// Configuración privada de la trivia REDMI. Generado con: npm run configurar-servidor
// Ubicación: /home/<usuario>/redmi-config/config.php (fuera de la carpeta pública del subdominio)
return [
    'pin_hash' => '${pinHash}',
    // Clave de cada totem => nombre con el que aparece en la página de descarga
    'totems' => [
${lineas.join('\n')}
    ],
];
`
mkdirSync('redmi-config', { recursive: true })
writeFileSync(RUTA, php)

console.log(`Listo: ${RUTA}  (súbelo a cPanel, fuera de la carpeta pública)`)
console.log('Claves de los totems nuevos (se escriben una vez en cada totem al exportar):')
for (const [nombre, clave] of creados) console.log(`  ${nombre.padEnd(24)} ${conGuiones(clave)}`)
