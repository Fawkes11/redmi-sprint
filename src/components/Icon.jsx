// Ícono de Material Symbols Outlined (grosor 200), importado con `?raw` para heredar el color del texto.
export default function Icon({ svg, size = 24, className = '' }) {
  const path = svg.match(/ d="([^"]+)"/)[1]
  return (
    <svg viewBox="0 -960 960 960" width={size} height={size} className={className} aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  )
}
