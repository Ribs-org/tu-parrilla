'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { TIPOS_DE_ARCHIVO, nombreDeVersion, type ComentarioParaLaApi, type PiezaParaLaApi } from '@/lib/pase/reglas'
import { cn } from '@/lib/utils'

// Subir al Pase, de quien edita: una pieza nueva o la versión siguiente de una, con su archivo (que va
// directo al almacén con un enlace firmado) o con una URL pública. Una versión puede ser una de varias
// variantes (A, B…) para comparar, y dice qué críticas arregla.

const CAMPO =
  'w-full rounded-lg border border-acero-700 bg-acero-800 px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-faint focus:border-brasa'

/**
 * Sube el archivo con el `PUT` firmado, contando el avance. Solo con el `Content-Type` firmado, como la
 * subida del panel (`src/lib/subida-directa.ts`): otra cabecera haría que el navegador pregunte antes al
 * CORS del almacén, que no la deja pasar.
 */
function subirAlAlmacen(subir: string, archivo: File, contentType: string, onAvance: (fraccion: number) => void): Promise<boolean> {
  return new Promise((resolver) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', subir)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onAvance(e.loaded / e.total)
    }
    xhr.onload = () => resolver(xhr.status >= 200 && xhr.status < 300)
    xhr.onerror = () => resolver(false)
    xhr.send(archivo)
  })
}

export function SubirAlPase({
  codigo,
  base,
  abiertas,
  ocupadas = [],
  onListo,
  onCerrar,
}: {
  codigo: string
  /** La pieza que esta versión corrige; null es una pieza nueva. */
  base: PiezaParaLaApi | null
  /** Las críticas abiertas de ese creativo, en todas sus versiones: las que esta puede arreglar. */
  abiertas: ComentarioParaLaApi[]
  /** Las variantes que ya tiene la versión siguiente (null es «la única»): no se repiten. */
  ocupadas?: Array<string | null>
  onListo: (piezaId: string) => void
  onCerrar: () => void
}) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState(base?.titulo ?? '')
  const libres = ['A', 'B', 'C', 'D', 'E'].filter((v) => !ocupadas.includes(v))
  // Si la versión siguiente ya existe, esta es una variante más para comparar: la primera letra libre.
  const [variante, setVariante] = useState(ocupadas.length > 0 ? (libres[0] ?? '') : '')
  const [notas, setNotas] = useState('')
  const [resuelve, setResuelve] = useState<Set<string>>(new Set())
  const [avance, setAvance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const siguiente = base ? `v${base.version + 1}${variante ? ` ${variante}` : ''}` : 'v1'

  async function enviar() {
    setError(null)
    let destino = url.trim()
    if (archivo) {
      const contentType = archivo.type || 'application/octet-stream'
      if (!TIPOS_DE_ARCHIVO[contentType]) return setError('Ese archivo no se puede revisar acá: sube MP4, MOV o WebM, o JPG, PNG, WebP o GIF.')
      setAvance(0)
      const pedido = await fetch(`/api/pase/${codigo}/subidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: contentType, bytes: archivo.size }),
      })
      const firma = (await pedido.json().catch(() => ({}))) as { subir?: string; url?: string; contentType?: string; error?: string }
      if (!pedido.ok || !firma.subir || !firma.url) {
        setAvance(null)
        return setError(firma.error ?? 'No se pudo preparar la subida. Inténtalo de nuevo.')
      }
      const ok = await subirAlAlmacen(firma.subir, archivo, firma.contentType ?? contentType, setAvance)
      if (!ok) {
        setAvance(null)
        return setError('La subida se cortó. Revisa tu conexión e inténtalo de nuevo.')
      }
      destino = firma.url
    }
    if (!destino) return setError('Elige un archivo o pega una URL.')
    setAvance((a) => a ?? 1)
    const r = await fetch(`/api/pase/${codigo}/piezas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: destino,
        titulo: titulo.trim() || undefined,
        responde_a: base?.id,
        variante: variante || undefined,
        notas: notas.trim() || undefined,
        resuelve: [...resuelve],
      }),
    })
    const cuerpo = (await r.json().catch(() => ({}))) as { id?: string; error?: string }
    setAvance(null)
    if (!r.ok || !cuerpo.id) return setError(cuerpo.error ?? 'No se pudo guardar la pieza.')
    onListo(cuerpo.id)
  }

  const subiendo = avance !== null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={base ? 'Subir la versión siguiente' : 'Subir una pieza nueva'}>
      <div className="chapa max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-titulo text-[0.7rem] uppercase tracking-[0.22em] text-fg-faint">{base ? `«${base.titulo}» ${nombreDeVersion(base)}` : 'El Pase'}</p>
            <h2 className="mt-1 font-titulo text-xl font-semibold uppercase tracking-[0.04em]">{base ? `Subir la ${siguiente}` : 'Subir una pieza nueva'}</h2>
          </div>
          <button type="button" onClick={onCerrar} disabled={subiendo} aria-label="Cerrar" className="text-fg-faint hover:text-fg">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <label
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center text-sm transition-colors',
            archivo ? 'border-brasa bg-brasa/10 text-fg' : 'border-acero-600 text-fg-muted hover:text-fg',
          )}
        >
          <Upload className="h-5 w-5" aria-hidden />
          {archivo ? `${archivo.name} · ${(archivo.size / 1024 / 1024).toFixed(1)} MB` : 'Elige el video o la imagen'}
          <span className="text-[0.7rem] text-fg-faint">MP4, MOV o WebM hasta 500 MB; JPG, PNG, WebP o GIF hasta 50 MB</span>
          <input type="file" accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} disabled={subiendo} />
        </label>
        {!archivo ? (
          <label className="block space-y-1 text-[0.8rem] text-fg-muted">
            <span>O una URL pública (se copia)</span>
            <input className={CAMPO} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" disabled={subiendo} />
          </label>
        ) : null}

        <label className="block space-y-1 text-[0.8rem] text-fg-muted">
          <span>Título</span>
          <input className={CAMPO} value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} placeholder="Por ejemplo, La visa secreta" disabled={subiendo} />
        </label>

        {base ? (
          <>
            <label className="block space-y-1 text-[0.8rem] text-fg-muted">
              <span>¿Es una de varias para comparar?</span>
              <select className={cn(CAMPO, '[color-scheme:dark]')} value={variante} onChange={(e) => setVariante(e.target.value)} disabled={subiendo}>
                {ocupadas.length === 0 ? <option value="">No, es la única {`v${base.version + 1}`}</option> : null}
                {libres.map((v) => (
                  <option key={v} value={v}>
                    Sí, la variante {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-[0.8rem] text-fg-muted">
              <span>Qué cambiaste</span>
              <textarea className={cn(CAMPO, 'min-h-16')} value={notas} maxLength={2000} onChange={(e) => setNotas(e.target.value)} placeholder="Por ejemplo: subí el ritmo del principio y moví los subtítulos" disabled={subiendo} />
            </label>
            {abiertas.length > 0 ? (
              <fieldset className="space-y-1.5">
                <legend className="text-[0.8rem] text-fg-muted">Esta versión arregla:</legend>
                {abiertas.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-acero-700 px-2.5 py-2 text-[0.8rem] text-fg">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[var(--color-brasa)]"
                      checked={resuelve.has(c.id)}
                      disabled={subiendo}
                      onChange={(e) => {
                        const nuevo = new Set(resuelve)
                        if (e.target.checked) nuevo.add(c.id)
                        else nuevo.delete(c.id)
                        setResuelve(nuevo)
                      }}
                    />
                    <span>
                      <span className="font-mono text-fg-faint">{c.cuando ?? 'Toda la pieza'}</span> {c.texto}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : null}
          </>
        ) : null}

        {subiendo ? (
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-acero-700">
              <div className="h-full bg-brasa transition-[width]" style={{ width: `${Math.round((avance ?? 0) * 100)}%` }} />
            </div>
            <p className="text-[0.75rem] text-fg-faint">{(avance ?? 0) < 1 ? `Subiendo… ${Math.round((avance ?? 0) * 100)} %` : 'Guardando…'}</p>
          </div>
        ) : null}
        {error ? <p className="text-[0.8rem] text-negative">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} disabled={subiendo} className="rounded-lg border border-acero-700 px-3.5 py-2 text-sm text-fg-muted hover:text-fg">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={subiendo || (!archivo && !url.trim()) || (!base && !titulo.trim())}
            className="rounded-lg bg-brasa px-3.5 py-2 text-sm font-medium text-acero-950 transition-[filter] hover:brightness-110 disabled:opacity-50"
          >
            {base ? `Subir la ${siguiente}` : 'Subir la pieza'}
          </button>
        </div>
      </div>
    </div>
  )
}
