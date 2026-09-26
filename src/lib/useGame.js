import { useCallback, useEffect, useRef, useState } from 'react'
import { BASE_POINTS, FEEDBACK_MS, GAME_DURATION_MS, MAX_SPEED_BONUS } from '../config.js'

const TICK_MS = 100

const shuffle = (list) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const EMPTY_STATS = { score: 0, answered: 0, correct: 0 }

// Lógica de la pantalla 04: preguntas en orden aleatorio, reloj global y puntaje.
// La partida termina al agotarse el tiempo (aunque sea a mitad de una pregunta) o las preguntas.
export default function useGame(questions, onFinish) {
  const [deck, setDeck] = useState([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [stats, setStats] = useState(EMPTY_STATS)
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_MS)

  const statsRef = useRef(EMPTY_STATS)
  const startedAt = useRef(0)
  const running = useRef(false)
  const timers = useRef({ tick: null, feedback: null })
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  const stopTimers = () => {
    clearInterval(timers.current.tick)
    clearTimeout(timers.current.feedback)
  }

  const remaining = () => Math.max(0, GAME_DURATION_MS - (performance.now() - startedAt.current))

  // reason: 'time' si se agotó el reloj, 'completed' si respondió todas las preguntas
  const finish = useCallback((reason) => {
    if (!running.current) return
    running.current = false
    stopTimers()
    onFinishRef.current(statsRef.current, reason)
  }, [])

  // Prepara una partida nueva (preguntas mezcladas, reloj lleno) sin arrancar el reloj
  const prepare = useCallback(() => {
    stopTimers()
    running.current = false
    statsRef.current = EMPTY_STATS
    setDeck(shuffle(questions))
    setIndex(0)
    setSelected(null)
    setFeedback(null)
    setStats(EMPTY_STATS)
    setTimeLeftMs(GAME_DURATION_MS)
  }, [questions])

  // Arranca el reloj (tras la animación de entrada a la pantalla 04)
  const begin = useCallback(() => {
    startedAt.current = performance.now()
    running.current = true
    timers.current.tick = setInterval(() => {
      const left = remaining()
      setTimeLeftMs(left)
      if (left === 0) finish('time')
    }, TICK_MS)
  }, [finish])

  const select = (key) => {
    if (!running.current || feedback) return
    const isCorrect = key === deck[index].correct
    const bonus = Math.round((remaining() / GAME_DURATION_MS) * MAX_SPEED_BONUS)
    const current = statsRef.current
    statsRef.current = {
      score: current.score + (isCorrect ? BASE_POINTS + bonus : 0),
      answered: current.answered + 1,
      correct: current.correct + (isCorrect ? 1 : 0),
    }
    setStats(statsRef.current)
    setSelected(key)
    setFeedback(isCorrect ? 'correct' : 'wrong')

    timers.current.feedback = setTimeout(() => {
      if (index + 1 >= deck.length) return finish('completed')
      setIndex(index + 1)
      setSelected(null)
      setFeedback(null)
    }, FEEDBACK_MS)
  }

  useEffect(() => stopTimers, [])

  return {
    question: deck[index],
    number: index + 1,
    total: questions.length,
    selected,
    feedback,
    stats,
    timeLeftMs,
    totalMs: GAME_DURATION_MS,
    prepare,
    begin,
    select,
  }
}
