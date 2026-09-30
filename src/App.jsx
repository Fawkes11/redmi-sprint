import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Stage from './components/Stage.jsx'
import Inicio from './screens/Inicio.jsx'
import Tutorial from './screens/Tutorial.jsx'
import PonerNombre from './screens/PonerNombre.jsx'
import Preguntas from './screens/Preguntas.jsx'
import Resultados from './screens/Resultados.jsx'
import useGame from './lib/useGame.js'
import { addToRanking, loadRanking, mergeIntoRanking, nameExists, removeFromRanking } from './lib/ranking.js'
import { nameToQuestions } from './lib/transitions.js'
import { TIME_UP_MS } from './config.js'
import allQuestions from './data/questions.json'

// Solo entran al juego las preguntas con respuesta correcta definida
const questions = allQuestions.filter((question) => question.correct)

// Herramientas de desarrollo locales (src/dev/ no se sube al repositorio): se cargan solo si existen
const devModules = import.meta.env.DEV ? import.meta.glob('./dev/*.{js,jsx}', { eager: true }) : {}
const PendingFigma = devModules['./dev/PendingFigma.jsx']?.default
const devParams = devModules['./dev/preview.js']?.default ?? new URLSearchParams()

const EMPTY_RESULT = { score: 0, answered: 0 }

// Flujo de 5 pantallas manejado por estado interno (sin rutas).
export default function App() {
  const [screen, setScreen] = useState(devParams.get('screen') || 'inicio')
  // En desarrollo, ?screen=preguntas salta la pantalla de nombre: se usa un nombre de prueba para no
  // guardar partidas sin nombre en el ranking
  const [playerName, setPlayerName] = useState(devParams.get('name') || (devParams.get('screen') === 'preguntas' ? 'Prueba' : ''))
  const [ranking, setRanking] = useState(loadRanking)
  const [result, setResult] = useState(EMPTY_RESULT)
  // Transición 03 → 04: la 03 queda montada encima de la 04 mientras dura la animación
  const [transitioning, setTransitioning] = useState(false)
  const nameScreenRef = useRef(null)
  const namePhoneRef = useRef(null)
  const questionsPhoneRef = useRef(null)

  // Capa "¡TIEMPO FINALIZADO!" sobre la pantalla 04 (en desarrollo: ?screen=preguntas&timeup)
  const [timeUp, setTimeUp] = useState(devParams.has('timeup'))

  const game = useGame(questions, (stats, reason) => {
    setRanking((current) => addToRanking(current, { name: playerName, ...stats }))
    setResult(stats)
    if (reason !== 'time') return setScreen('resultados')
    setTimeUp(true)
  })

  useEffect(() => {
    if (!timeUp || devParams.has('timeup')) return
    const timer = setTimeout(() => {
      setTimeUp(false)
      setScreen('resultados')
    }, TIME_UP_MS)
    return () => clearTimeout(timer)
  }, [timeUp])

  // Vista previa en desarrollo: ?screen=preguntas arranca una partida directamente
  useEffect(() => {
    if (screen === 'preguntas' && !game.question) {
      game.prepare()
      game.begin()
    }
  }, [])

  useLayoutEffect(() => {
    if (!transitioning) return
    const timeline = nameToQuestions({
      screenOut: nameScreenRef.current,
      phoneOut: namePhoneRef.current,
      phoneIn: questionsPhoneRef.current,
      onComplete: () => {
        setTransitioning(false)
        game.begin()
      },
    })
    return () => timeline.kill()
  }, [transitioning])

  const validateName = (name) => {
    if (!name.trim()) return 'Por favor ingrese su nombre'
    if (nameExists(ranking, name)) return 'Nombre duplicado, intente con otro'
    return null
  }

  const startGame = (name) => {
    setPlayerName(name)
    game.prepare()
    setTransitioning(true)
    setScreen('preguntas')
  }

  const finish = () => {
    setPlayerName('')
    setResult(EMPTY_RESULT)
    setScreen('inicio')
  }

  return (
    <>
      <Stage>
        {screen === 'inicio' && <Inicio onStart={() => setScreen('tutorial')} onRanking={() => setScreen('ranking')} />}
        {screen === 'tutorial' && <Tutorial onContinue={() => setScreen('nombre')} />}
        {screen === 'preguntas' && game.question && (
          <Preguntas
            number={game.number}
            total={game.total}
            question={game.question}
            selected={game.selected}
            onSelect={game.select}
            timeLeftMs={game.timeLeftMs}
            totalMs={game.totalMs}
            feedback={game.feedback}
            playerName={playerName}
            score={game.stats.score}
            phoneRef={questionsPhoneRef}
            timeUp={timeUp}
          />
        )}
        {(screen === 'nombre' || transitioning) && (
          <div ref={nameScreenRef} className={`absolute inset-0 ${transitioning ? 'pointer-events-none' : ''}`}>
            <PonerNombre
              onBack={() => setScreen('tutorial')}
              onContinue={startGame}
              validate={validateName}
              phoneRef={namePhoneRef}
            />
          </div>
        )}
        {screen === 'ranking' && (
          <Resultados
            view="ranking"
            total={questions.length}
            ranking={ranking}
            onFinish={() => setScreen('inicio')}
            onRemove={(ids) => setRanking((current) => removeFromRanking(current, ids))}
            onMerge={(partidas) => {
              const merged = mergeIntoRanking(ranking, partidas)
              setRanking(merged.ranking)
              return merged.added
            }}
          />
        )}
        {screen === 'resultados' && (
          <Resultados
            playerName={playerName}
            score={result.score}
            answered={result.answered}
            total={questions.length}
            ranking={ranking}
            onFinish={finish}
          />
        )}
      </Stage>
      {PendingFigma && <PendingFigma />}
    </>
  )
}
