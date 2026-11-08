import type { Metadata } from 'next'
import Link from 'next/link'

import { CONTACTO, RESPONSABLE } from '@/lib/empresa'

export const metadata: Metadata = {
  title: 'Borrar tu cuenta y tus datos',
  description: 'Cómo pedir que Tu Parrilla borre tu cuenta y tus datos, qué se borra y qué se guarda.',
}

const ACTUALIZADO = '8 de noviembre de 2026'
const ASUNTO = 'Borrar mi cuenta de Tu Parrilla'

const enlace = 'text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50'
const titulo = 'font-titulo text-lg font-semibold uppercase tracking-[0.03em]'

/**
 * La página que Google Play enlaza en la ficha de la app («Delete data URL»): nombra la app,
 * pone los pasos arriba y dice qué se borra, qué se guarda y por cuánto. El borrado lo hace hoy
 * el equipo a mano: no hay todavía un botón que borre una cuenta que ya entró (ver
 * `docs/pendientes.md`). Si eso cambia, esta página cambia con él.
 */
export default function BorrarMisDatosPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-titulo text-3xl font-semibold uppercase tracking-[0.03em]">
          Borrar tu cuenta y tus datos
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Tu Parrilla (la app «Parrilla» de Google Play y el panel web), de {RESPONSABLE}.
          Actualizado el {ACTUALIZADO}.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className={titulo}>Cómo pedirlo</h2>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-fg-muted">
          <li>
            Escribe a{' '}
            <a href={`mailto:${CONTACTO}?subject=${encodeURIComponent(ASUNTO)}`} className={enlace}>
              {CONTACTO}
            </a>{' '}
            <span className="text-fg">desde el correo con el que entras a Tu Parrilla</span>, con el
            asunto «{ASUNTO}». No hace falta explicar nada más.
          </li>
          <li>
            Te contestamos a ese mismo correo para confirmar que eres tú. Si escribes desde otro
            correo, te pedimos que lo confirmes desde el de tu cuenta.
          </li>
          <li>
            Borramos tu cuenta y tus datos dentro de los 30 días siguientes, y te avisamos por correo
            cuando esté hecho.
          </li>
        </ol>
        <p className="leading-relaxed text-fg-muted">
          <span className="text-fg">También puedes borrar solo una parte</span>, sin cerrar la
          cuenta: escribe igual, con el asunto «Borrar parte de mis datos de Tu Parrilla», y di qué
          quieres borrar —por ejemplo, las fotos y videos que subiste, los comentarios guardados o lo
          que escribiste en el libro de sugerencias—. Se borra en el mismo plazo, y te avisamos.
        </p>
        <p className="leading-relaxed text-fg-muted">
          Si solo quieres que Tu Parrilla deje de leer una red, no hace falta borrar la cuenta: en el
          panel, en Los Fierros, desconéctala. Eso borra sus credenciales y deja de leerla (lo que se
          guarda en ese caso está en la{' '}
          <Link href="/privacidad" className={enlace}>
            política de privacidad
          </Link>
          ).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className={titulo}>Qué se borra</h2>
        <p className="leading-relaxed text-fg-muted">Todo lo que Tu Parrilla tiene asociado a tu cuenta:</p>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-fg-muted">
          <li>tu correo, tu nombre, tus sesiones abiertas y tus llaves de la API;</li>
          <li>las redes que conectaste y sus credenciales;</li>
          <li>
            lo programado, los borradores, el registro de lo publicado y los números de tus cuentas y
            publicaciones;
          </li>
          <li>los comentarios guardados, sus borradores de respuesta y tus reglas de palabra clave;</li>
          <li>tu página pública y lo que se midió de sus visitas;</li>
          <li>
            las fotos y videos que subiste, lo guardado en la cámara de frío de La Cocina, tus
            comandas y lo que el chef cocinó para ti;
          </li>
          <li>los avisos registrados de tu teléfono;</li>
          <li>
            lo que escribiste en el libro de sugerencias y las respuestas del equipo, también los
            pedidos que eso abrió en GitHub.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={titulo}>Qué se guarda, y por cuánto</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-fg-muted">
          <li>
            <span className="text-fg">Los respaldos cifrados de la base</span>: la copia diaria se
            guarda 90 días y después se borra sola. Mientras dure, tus datos pueden seguir en las
            copias de antes del borrado; no se usan para nada salvo restaurar el servicio.
          </li>
          <li>
            <span className="text-fg">Lo que ya salió en tus redes</span> —tus publicaciones y las
            respuestas a comentarios— sigue en Instagram, Facebook, TikTok, YouTube o Threads: es tuyo
            y vive allá. Bórralo desde cada red si quieres que desaparezca.
          </li>
        </ul>
        <p className="leading-relaxed text-fg-muted">Nada más se conserva.</p>
      </section>

      <section className="space-y-3" lang="en">
        <h2 className={titulo}>In English</h2>
        <p className="leading-relaxed text-fg-muted">
          To delete your Tu Parrilla account (the «Parrilla» app on Google Play) and its data, email{' '}
          <a href={`mailto:${CONTACTO}?subject=${encodeURIComponent(ASUNTO)}`} className={enlace}>
            {CONTACTO}
          </a>{' '}
          from the email address you sign in with, with the subject «{ASUNTO}». We confirm by
          replying to that address and delete everything linked to your account (profile, connected
          accounts and their credentials, scheduled and published post records, metrics, comments,
          uploaded media, La Cocina material, API keys, phone notification tokens and suggestion-book
          messages) within 30 days, then email you when it is done. Encrypted database backups are
          kept for 90 days and then deleted automatically. Content already published on your social
          networks stays there and can be deleted from each network. You can also ask us to delete only part of your data (for example, uploaded photos
          and videos, stored comments or suggestion-book messages) without deleting your account.
        </p>
      </section>
    </article>
  )
}
