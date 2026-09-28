// Parámetros del juego (tiempos en milisegundos)
export const GAME_DURATION_MS = 90_000 // 1:30 para toda la partida
export const FEEDBACK_MS = 1_500 // "¡BUEN TRABAJO!" / "¡NO TE RINDAS!"; el reloj sigue corriendo
export const TIME_UP_MS = 4_000 // capa "¡TIEMPO FINALIZADO!" (animación incluida) antes de Resultados

// Puntaje: acierto = base + bono proporcional al tiempo restante; error = 0
export const BASE_POINTS = 100
export const MAX_SPEED_BONUS = 50
