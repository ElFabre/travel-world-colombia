interface BackgroundSliderProps {
  /** URL de la imagen en la capa A. */
  layerA: string
  /** URL de la imagen en la capa B. */
  layerB: string
  /** Si true, la capa A es la visible; si false, la B. */
  showA: boolean
}

/**
 * Dos capas de fondo con crossfade (0.9s) + overlay gradiente cinematográfico.
 * slowZoom (scale 1.08 → 1.00 en 18s) al cargar.
 */
export function BackgroundSlider({ layerA, layerB, showA }: BackgroundSliderProps) {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 animate-slow-zoom bg-cover bg-center"
        style={{
          backgroundImage: `url('${layerA}')`,
          opacity: showA ? 1 : 0,
          transition: 'opacity 0.9s ease',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 animate-slow-zoom bg-cover bg-center"
        style={{
          backgroundImage: `url('${layerB}')`,
          opacity: showA ? 0 : 1,
          transition: 'opacity 0.9s ease',
        }}
      />
      {/* Overlay — doble gradiente (izq→der + abajo→arriba) */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to right, rgba(10,22,40,.95) 36%, rgba(10,22,40,.2) 100%), linear-gradient(to top, rgba(10,22,40,.98) 0%, transparent 52%)',
        }}
      />
    </>
  )
}
