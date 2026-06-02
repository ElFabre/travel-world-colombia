interface StatCardProps {
  num: string
  label: string
  className?: string
}

/** Estadística — número en Plus Jakarta Sans (700) + label en Cinzel. */
export function StatCard({ num, label, className = '' }: StatCardProps) {
  return (
    <div className={`text-center ${className}`}>
      <p
        className="text-3xl md:text-4xl text-orange"
        style={{ fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700 }}
      >
        {num}
      </p>
      <p
        className="font-cinzel text-[10px] tracking-[0.2em] uppercase mt-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
    </div>
  )
}
