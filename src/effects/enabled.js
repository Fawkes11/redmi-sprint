// Interruptor de efectos especiales (shader, brillo, destello y confeti).
// Activados por defecto; se apagan abriendo la app con ?efectos=no (lo usa el .bat "sin efectos"
// para totems que no los corran con fluidez). El resto de la app no cambia.
export const effectsEnabled = new URLSearchParams(location.search).get('efectos') !== 'no'
