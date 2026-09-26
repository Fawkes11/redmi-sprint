// Brillo que recorre una imagen (reflejo sobre el vidrio del móvil). El reflejo se recorta con la
// propia imagen como máscara, así solo se ve sobre el móvil y no sobre su fondo transparente.
export default function Shine({ src, className = '', style, imgRef, delay = 0 }) {
  return (
    <div ref={imgRef} className={`pointer-events-none ${className}`} style={style}>
      <img draggable={false} src={src} alt="" className="block max-w-none" />
      <div
        className="animate-shine absolute inset-0"
        style={{
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  )
}
