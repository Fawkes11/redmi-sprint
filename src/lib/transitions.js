import gsap from 'gsap'

// Transición 03 → 04 (plan.md §4): una sola línea de tiempo para que se sienta como un traspaso.
// 1) el móvil de la 03 baja y sale de cuadro, acelerando;
// 2) mientras sale, la pantalla 03 se disuelve y deja ver la 04 debajo;
// 3) el móvil de la 04 sube desde abajo y frena al llegar a su posición final.
export function nameToQuestions({ screenOut, phoneOut, phoneIn, onComplete }) {
  gsap.set(phoneIn, { y: 1150 })

  return gsap
    .timeline({ onComplete })
    .to(phoneOut, { y: 900, duration: 0.7, ease: 'power2.in' })
    .to(screenOut, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, '-=0.3')
    .to(phoneIn, { y: 0, duration: 0.9, ease: 'power3.out' }, '<0.1')
}
