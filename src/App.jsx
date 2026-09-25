import { useState } from 'react'
import Stage from './components/Stage.jsx'
import Inicio from './screens/Inicio.jsx'
import Tutorial from './screens/Tutorial.jsx'
import PonerNombre from './screens/PonerNombre.jsx'
import Preguntas from './screens/Preguntas.jsx'
import Resultados from './screens/Resultados.jsx'
import questions from './data/questions.json'

// Flujo de 5 pantallas manejado por estado interno (sin rutas).
const SCREENS = ['inicio', 'tutorial', 'nombre', 'preguntas', 'resultados']

// Herramientas de desarrollo locales (src/dev/ no se sube al repositorio): se cargan solo si existen
const devModules = import.meta.env.DEV ? import.meta.glob('./dev/*.{js,jsx}', { eager: true }) : {}
const PendingFigma = devModules['./dev/PendingFigma.jsx']?.default
const devParams = devModules['./dev/preview.js']?.default ?? new URLSearchParams()
const initialScreen = devParams.get('screen') || 'inicio'

// Ranking de ejemplo hasta conectar la persistencia (Fase 3); más de 7 para mostrar "Mostrar más"
const PREVIEW_RANKING = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Nombre ${i + 1}`, correct: 5, score: 0 }))

export default function App() {
  const [screen, setScreen] = useState(initialScreen)
  const [playerName, setPlayerName] = useState('')
  // Vista previa de la pantalla 04 (Fase 2); la lógica de juego llega en la Fase 3
  const [previewSelected, setPreviewSelected] = useState(devParams.get('selected'))
  const go = (id) => setScreen(id)
  const next = () => setScreen(SCREENS[(SCREENS.indexOf(screen) + 1) % SCREENS.length])

  return (
    <>
      <Stage>
        {screen === 'inicio' && <Inicio onStart={next} />}
        {screen === 'tutorial' && <Tutorial onContinue={next} />}
        {screen === 'nombre' && (
          <PonerNombre
            onBack={() => go('tutorial')}
            onContinue={(name) => {
              setPlayerName(name)
              go('preguntas')
            }}
          />
        )}
        {screen === 'preguntas' && (
          <Preguntas
            number={1}
            total={questions.length}
            question={questions[Number(devParams.get('q') ?? 0)]}
            selected={previewSelected}
            onSelect={setPreviewSelected}
            timeLeft={Number(devParams.get('time') ?? 90)}
            totalTime={90}
            feedback={devParams.get('feedback')}
            playerName={playerName || devParams.get('name') || 'AAA'}
            score={0}
          />
        )}
        {screen === 'resultados' && (
          <Resultados
            playerName={playerName || devParams.get('name') || 'Nombre 1'}
            score={0}
            correct={5}
            total={questions.length}
            ranking={PREVIEW_RANKING}
            onFinish={() => go('inicio')}
            initialExpanded={devParams.has('expanded')}
          />
        )}
      </Stage>
      {PendingFigma && <PendingFigma />}
    </>
  )
}
