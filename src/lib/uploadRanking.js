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
  let response
  try {
    response = await fetch(`${EXPORT_SERVER}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Firma': await sign(bytes, key) },
      body: bytes,
    })
  } catch {
    throw new ExportError('red', 'Sin conexión con el servidor')
  }
  const data = await response.json().catch(() => ({}))
  if (response.status === 403) throw new ExportError('clave', 'La clave del totem no es válida')
  if (response.status === 401 || response.status === 429) throw new ExportError('pin', data.error || 'PIN incorrecto')
  // Sin JSON (p. ej. un error 500 de PHP o del hosting): se muestra el código para diagnosticar
  if (!response.ok || !data.totem) throw new ExportError('servidor', data.error || `Error del servidor (${response.status}).`)
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

  const partidas = ranking.map(({ id, name, score, answered, correct, playedAt }) => ({ id, name, score, answered, correct, playedAt }))
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
