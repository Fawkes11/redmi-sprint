// Botón principal con el gradiente de marca (Figma: 510×123, radio 20, MiSans Bold 48).
export default function BrandButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex h-[123px] w-[510px] items-center justify-center rounded-[20px] bg-brand-gradient text-[48px] font-bold leading-none text-paper-white active:brightness-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
