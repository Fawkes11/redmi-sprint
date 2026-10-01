import { EXPORT_SERVER } from '../config.js'

// Envía las partidas del totem al servidor, firmadas con la clave de ESTE totem (HMAC-SHA256).
// La clave identifica al totem y no está en el código: se escribe una vez al exportar.
// El servidor suma solo las partidas que no tenía; aquí además se evita enviar si no hay nada
// nuevo desde el último envío.
const KEY_STORAGE = 'redmi-clave-totem'
const LAST_STORAGE = 'redmi-ultimo-export'
const NAME_STORAGE = 'redmi-nombre-totem'

export const normalizeKey = (key) => key.toUpperCase().replace(/[^A-Z0-9]/g, '')
export const getTotemKey = () => localStorage.getItem(KEY_STORAGE)
export const getTotemName = () => localStorage.getItem(NAME_STORAGE)
export const setTotemKey = (key, name) => {
  localStorage.setItem(KEY_STORAGE, normalizeKey(key))
  localStorage.setItem(NAME_STORAGE, name)
}
// Al borrar la clave también se olvida el último envío (pertenecía a ese totem)
export const clearTotemKey = () => {
  localStorage.removeItem(KEY_STORAGE)
  localStorage.removeItem(NAME_STORAGE)
  localStorage.removeItem(LAST_STORAGE)
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

const sign = async (bytes, key) => {
  // Sin https (p. ej. http:// o una IP de la red local) el navegador no permite firmar: no es falta de internet
  if (!crypto.subtle) throw new ExportError('servidor', 'Abra la trivia con https:// para exportar.')
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', cryptoKey, bytes))
}

export const downloadPageUrl = (slug) => `${EXPORT_SERVER}/exportes-admin/?totem=${slug}`

export class ExportError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind // 'clave' | 'pin' | 'red' | 'servidor'
  }
}

// Petición firmada con la clave del totem. Devuelve el JSON si la respuesta es correcta.
async function request(endpoint, key, payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const firma = await sign(bytes, key)
  let response
  try {
    response = await fetch(`${EXPORT_SERVER}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firma': firma },
      body: bytes,
    })
  } catch {
    throw new ExportError('red', 'Sin conexión con el servidor')
  }
  const text = await response.text().catch(() => '')
  let data
  try {
    data = JSON.parse(text)
  } catch {
    // No es la respuesta de la API: una página del firewall del hosting o de la red, o un aviso de PHP.
    // Tampoco se trata un 403 así como clave incorrecta (se borraría la clave guardada).
    const sample = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    throw new ExportError('servidor', `Respuesta inesperada del servidor (${response.status}): «${sample || 'vacía'}». Puede ser un bloqueo de la red o del hosting.`)
  }
  if (response.status === 403) throw new ExportError('clave', 'La clave del totem no es válida')
  if (response.status === 401 || response.status === 429) throw new ExportError('pin', data?.error || 'PIN incorrecto')
  // Error de la API sin mensaje: se muestra el código para diagnosticar
  if (!response.ok || !data?.totem) throw new ExportError('servidor', data?.error || `Error del servidor (${response.status}).`)
  return data
}

const post = (key, partidas) => request('exportar.php', key, { partidas })

// Modo administración: el PIN lo valida el servidor (con bloqueo por intentos) y nunca se guarda.
// Con ids vacío solo comprueba el PIN. Con ids, elimina esas partidas del servidor y las deja
// excluidas para siempre. Requiere que el totem tenga su clave (solo toca SUS partidas).
export async function adminRequest(pin, ids = []) {
  const key = getTotemKey()
  if (!key) throw new ExportError('clave', 'Primero enlace este totem: exporte el ranking una vez con su clave.')
  return request('eliminar.php', key, { pin, ids })
}

// Comprueba a qué totem pertenece una clave SIN enviar partidas (lista vacía: el servidor no guarda
// nada). Sirve para confirmar el totem antes de sumar datos. Resultado: { totem, slug }
export async function identifyTotem(key) {
  const data = await post(normalizeKey(key), [])
  return { totem: data.totem, slug: data.slug }
}

// Trae del servidor todas las partidas de ESTE totem (requiere el PIN). Resultado: array de partidas
export async function recoverRanking(pin) {
  const key = getTotemKey()
  if (!key) throw new ExportError('clave', 'Primero enlace este totem: exporte el ranking una vez con su clave.')
  const data = await request('recuperar.php', key, { pin })
  return data.partidas ?? []
}

// Traslado sin internet (p. ej. una red que bloquea el servidor): archivo con las partidas firmado con
// la clave del totem de destino. Solo lo acepta un totem con esa misma clave, así que también
// comprueba sin servidor que se escribió la clave correcta.
const TRANSFER_TYPE = 'redmi-traslado'
const pick = ({ id, name, score, answered, correct, playedAt }) => ({ id, name, score, answered, correct, playedAt })

export async function transferFile(ranking, key) {
  const partidas = JSON.stringify(ranking.map(pick))
  const firma = await sign(new TextEncoder().encode(partidas), normalizeKey(key))
  return JSON.stringify({ tipo: TRANSFER_TYPE, partidas, firma })
}

// Devuelve las partidas del archivo si está firmado con esta clave
export async function readTransferFile(text, key) {
  let file = null
  try {
    file = JSON.parse(text)
  } catch {
    // no es JSON
  }
  if (file?.tipo !== TRANSFER_TYPE || typeof file.partidas !== 'string') throw new ExportError('archivo', 'Este archivo no es un traslado del ranking.')
  const firma = await sign(new TextEncoder().encode(file.partidas), normalizeKey(key))
  if (firma !== file.firma) throw new ExportError('clave', 'Este archivo se guardó con la clave de otro totem.')
  return JSON.parse(file.partidas)
}

// Resultado: { totem, url, nuevas, total, omitidas, excluidas, sinCambios }
export async function uploadRanking(ranking) {
  const key = getTotemKey()
  if (!key) throw new ExportError('clave', 'Falta la clave del totem')

  // Sin partidas nuevas desde el último envío con esta misma clave: no se envía nada
  const ids = ranking.map((entry) => entry.id)
  const last = JSON.parse(localStorage.getItem(LAST_STORAGE) || 'null')
  if (last?.key === key && ids.every((id) => last.ids.includes(id))) {
    localStorage.setItem(NAME_STORAGE, last.totem)
    return { totem: last.totem, url: downloadPageUrl(last.slug), nuevas: 0, total: last.total, sinCambios: true }
  }

  const partidas = ranking.map(pick)
  let data
  try {
    data = await post(key, partidas)
  } catch (error) {
    if (error.kind === 'clave') clearTotemKey()
    throw error
  }

  localStorage.setItem(LAST_STORAGE, JSON.stringify({ key, ids, slug: data.slug, totem: data.totem, total: data.total }))
  // El nombre lo da el servidor: así también queda en los totems enlazados antes de la confirmación
  localStorage.setItem(NAME_STORAGE, data.totem)
  return {
    totem: data.totem,
    url: downloadPageUrl(data.slug),
    nuevas: data.nuevas,
    total: data.total,
    omitidas: data.omitidas ?? 0, // partidas con datos incompletos (p. ej. sin nombre) que el servidor no guardó
    excluidas: data.excluidas ?? [], // eliminadas en modo administración: el totem también las quita
    sinCambios: data.nuevas === 0,
  }
}
