// Botón principal (Figma: 510×123, radio 20, MiSans Bold 48).
// variant "gradient": fondo con el gradiente de marca y texto blanco.
// variant "light": fondo blanco y texto con el gradiente (FINALIZAR, pantalla 05).
const VARIANTS = {
  gradient: 'bg-brand-gradient text-paper-white',
  light: 'bg-paper-white',
}

export default function BrandButton({ children, variant = 'gradient', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex h-[123px] w-[510px] items-center justify-center rounded-[20px] text-[48px] font-bold leading-none active:brightness-95 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {variant === 'light' ? (
        <span className="bg-brand-gradient bg-clip-text text-transparent">{children}</span>
      ) : (
        children
      )}
    </button>
  )
}
