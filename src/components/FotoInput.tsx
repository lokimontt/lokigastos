import { useRef, type ChangeEvent } from 'react'

type Props = {
  id: string
  foto: { blob: Blob; url: string } | null
  procesando: boolean
  onFile: (file: File) => void
  onClear: () => void
}

/** Botón grande para tomar / elegir foto, con vista previa. */
export function FotoInput({ id, foto, procesando, onFile, onClear }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    // Permite volver a elegir el mismo archivo.
    e.target.value = ''
  }

  return (
    <div className="foto-field">
      <input id={id} ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onChange} className="visually-hidden" tabIndex={-1} />
      {foto ? (
        <div className="foto-preview-box">
          <img className="foto-preview-lg" src={foto.url} alt="Vista previa del comprobante" />
          <div className="foto-preview-actions">
            <span className="muted">{(foto.blob.size / 1024).toFixed(0)} KB</span>
            <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={procesando}>
              Cambiar
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={onClear} disabled={procesando}>
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="foto-btn" onClick={() => fileRef.current?.click()} disabled={procesando} aria-describedby={id + '-hint'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          <span>{procesando ? 'Procesando foto…' : 'Tomar foto / elegir'}</span>
          <small id={id + '-hint'}>Boleta o comprobante (opcional)</small>
        </button>
      )}
    </div>
  )
}
