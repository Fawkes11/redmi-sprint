// Ranking histórico del totem, guardado en localStorage (sobrevive a recargas y reinicios).
const STORAGE_KEY = 'redmi-trivia-ranking-v1'

const normalize = (name) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')

// Mayor puntaje primero; en empate, la partida más reciente primero
const byRank = (a, b) => b.score - a.score || b.playedAt.localeCompare(a.playedAt)

export function loadRanking() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved.sort(byRank) : []
  } catch {
    return []
  }
}

export function nameExists(ranking, name) {
  const target = normalize(name)
  return ranking.some((entry) => normalize(entry.name) === target)
}

// Quita partidas por id (eliminadas desde el modo administración) y devuelve el ranking actualizado
export function removeFromRanking(ranking, ids) {
  const updated = ranking.filter((entry) => !ids.includes(entry.id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

// Suma partidas recuperadas del servidor que este totem no tenga (por id). Las que ya tiene no se
// tocan. Devuelve { ranking, added }.
export function mergeIntoRanking(ranking, partidas) {
  const known = new Set(ranking.map((entry) => entry.id))
  const incoming = partidas
    .filter((p) => p && typeof p.id === 'string' && !known.has(p.id) && typeof p.name === 'string' && Number.isInteger(p.score))
    .map(({ id, name, score, answered, correct, playedAt }) => ({ id, name, score, answered, correct, playedAt }))
  if (!incoming.length) return { ranking, added: 0 }
  const updated = [...ranking, ...incoming].sort(byRank)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return { ranking: updated, added: incoming.length }
}

// Agrega la partida y devuelve el ranking actualizado y ordenado
export function addToRanking(ranking, { name, score, answered, correct }) {
  const entry = {
    id: crypto.randomUUID(),
    name: name.trim(),
    score,
    answered,
    correct,
    playedAt: new Date().toISOString(),
  }
  const updated = [...ranking, entry].sort(byRank)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
