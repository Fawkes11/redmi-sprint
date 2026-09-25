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
