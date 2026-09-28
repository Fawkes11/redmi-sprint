import { EXPORT_SERVER } from '../config.js'

// Envía las partidas del totem al servidor, firmadas con la clave de ESTE totem (HMAC-SHA256).
// La clave identifica al totem y no está en el código: se escribe una vez al exportar.
// El servidor suma solo las partidas que no tenía; aquí además se evita enviar si no hay nada
// nuevo desde el último envío.
const KEY_STORAGE = 'redmi-clave-totem'
const LAST_STORAGE = 'redmi-ultimo-export'

export const normalizeKey = (key) => key.toUpperCase().replace(/[^A-Z0-9]/g, '')
export const getTotemKey = () => localStorage.getItem(KEY_STORAGE)
export const setTotemKey = (key) => localStorage.setItem(KEY_STORAGE, normalizeKey(key))
export const clearTotemKey = () => localStorage.removeItem(KEY_STORAGE)

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

const sign = async (bytes, key) => {
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', cryptoKey, bytes))
}

export const downloadPageUrl = (slug) => `${EXPORT_SERVER}/exportes-admin/?totem=${slug}`

export class ExportError extends Error {
  constructor(kind, message) {
    super(message)
    this.kind = kind // 'clave' | 'red' | 'servidor'
  }
}

// Resultado: { totem, url, nuevas, total, sinCambios }
export async function uploadRanking(ranking) {
  const key = getTotemKey()
  if (!key) throw new ExportError('clave', 'Falta la clave del totem')

  // Sin partidas nuevas desde el último envío con esta misma clave: no se envía nada
  const ids = ranking.map((entry) => entry.id)
  const last = JSON.parse(localStorage.getItem(LAST_STORAGE) || 'null')
  if (last?.key === key && ids.every((id) => last.ids.includes(id))) {
    return { totem: last.totem, url: downloadPageUrl(last.slug), nuevas: 0, total: last.total, sinCambios: true }
  }

  const partidas = ranking.map(({ id, name, score, answered, correct, playedAt }) => ({ id, name, score, answered, correct, playedAt }))
  const bytes = new TextEncoder().encode(JSON.stringify({ partidas }))

  let response
  try {
    response = await fetch(`${EXPORT_SERVER}/api/exportar.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firma': await sign(bytes, key) },
      body: bytes,
    })
  } catch {
    throw new ExportError('red', 'Sin conexión con el servidor')
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 403) {
    clearTotemKey()
    throw new ExportError('clave', 'La clave del totem no es válida')
  }
  if (!response.ok || !data.slug) throw new ExportError('servidor', data.error || 'El servidor rechazó el ranking')

  localStorage.setItem(LAST_STORAGE, JSON.stringify({ key, ids, slug: data.slug, totem: data.totem, total: data.total }))
  return { totem: data.totem, url: downloadPageUrl(data.slug), nuevas: data.nuevas, total: data.total, sinCambios: data.nuevas === 0 }
}
