type Props = {
  onClick: () => void
  label: string
}

/** Botón flotante "+" (abajo a la derecha, sobre la nav inferior). */
export function Fab({ onClick, label }: Props) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  )
}
