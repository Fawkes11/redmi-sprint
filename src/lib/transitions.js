import gsap from 'gsap'

// El PNG del móvil de la pantalla 03 viene recortado al borde del frame: no se mueve hacia adentro
// más allá de su posición ni rota, porque se vería el corte.

// Transición 03 → 04 (plan.md §4): una sola línea de tiempo para que se sienta como un traspaso.
// 1) anticipación: el móvil de la 03 crece un poco con la base fija al borde, como tomando aire;
// 2) cae y sale de cuadro acelerando;
// 3) mientras sale, la pantalla 03 se disuelve y deja ver la 04 debajo;
// 4) el móvil de la 04 (completo, sin recorte) sube inclinado, se pasa un poco y se asienta.
export function nameToQuestions({ screenOut, phoneOut, phoneIn, onComplete }) {
  gsap.set(phoneIn, { y: 1150, rotation: -8 })

  return gsap
    .timeline({ onComplete })
    .to(phoneOut, { scale: 1.05, transformOrigin: '50% 100%', duration: 0.3, ease: 'power2.out' })
    .to(phoneOut, { y: 950, scale: 1, duration: 0.55, ease: 'power3.in' })
    .to(screenOut, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.3')
    .to(phoneIn, { y: 0, rotation: 0, duration: 0.95, ease: 'back.out(1.4)' }, '<0.05')
}

// Entrada desde una esquina con anticipación: asoma girado, retrocede un poco y entra rápido,
// pasándose de su lugar y enderezándose al asentarse. `dx`/`dy`: dirección hacia afuera de la esquina.
function enterFromCorner(timeline, target, dx, dy, at) {
  const out = (distance, rotation) => ({ x: dx * distance, y: dy * distance, rotation })
  // Posiciones explícitas: sin ellas cada .to() se encadenaría al final de toda la línea de tiempo
  return timeline
    .fromTo(target, out(700, dx * 12), { ...out(380, dx * 8), duration: 0.3, ease: 'power2.out' }, at)
    .to(target, { ...out(470, dx * 10), duration: 0.18, ease: 'power1.inOut' }, at + 0.3)
    .to(target, { ...out(0, 0), duration: 0.75, ease: 'back.out(1.6)' }, at + 0.48)
}

// Entrada de la capa "¡TIEMPO FINALIZADO!": el fondo cubre las preguntas, los móviles entran desde
// sus esquinas y la columna de textos gira como un rodillo de tragamonedas: baja, da dos vueltas
// completas y se detiene con el texto sólido centrado. La tira tiene 3 copias de la columna.
export function timeUpEnter(root) {
  const q = gsap.utils.selector(root)

  const timeline = gsap.timeline().from(root, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' })

  // El de abajo arranca un instante después para que no se sientan como un solo movimiento
  enterFromCorner(timeline, q('[data-phone="top"]'), 1, -1, 0.1)
  enterFromCorner(timeline, q('[data-phone="bottom"]'), -1, 1, 0.22)

  timeline.fromTo(
    q('[data-reel-strip]'),
    // Dos vueltas = subir la tira dos columnas y dejarla bajar hasta la primera
    { y: (_, strip) => -2 * strip.lastElementChild.offsetHeight },
    { y: 0, duration: 1.6, ease: 'back.out(1.1)' },
    0.2,
  )

  // Destello y rayos de luz cuando el rodillo se detiene (~1.1 s: fin del frenado antes del rebote)
  return timeline
    .fromTo(q('[data-flash]'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.1, duration: 0.18, ease: 'power2.out' }, 1.1)
    .to(q('[data-flash]'), { opacity: 0, duration: 0.7, ease: 'power2.in' }, 1.28)
    .fromTo(q('[data-rays]'), { opacity: 0, rotation: 0 }, { opacity: 1, rotation: 25, duration: 0.25, ease: 'power2.out' }, 1.1)
    .to(q('[data-rays]'), { opacity: 0, rotation: 60, duration: 1.1, ease: 'power2.out' }, 1.35)
}
