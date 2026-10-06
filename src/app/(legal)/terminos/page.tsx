import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACTO, RESPONSABLE, RUT } from '@/lib/empresa'

export const metadata: Metadata = {
  title: 'Términos',
  description: 'Condiciones de uso de Tu Parrilla y de este sitio.',
}

const ACTUALIZADO = '6 de octubre de 2026'

export default function TerminosPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-titulo text-3xl font-semibold uppercase tracking-[0.03em]">Términos</h1>
        <p className="mt-2 text-sm text-fg-muted">Actualizado el {ACTUALIZADO}.</p>
      </header>

      <p className="leading-relaxed text-fg-muted">
        Tu Parrilla es un panel privado para que creadores de contenido programen, publiquen y
        midan sus publicaciones en sus propias redes, y este sitio también sirve las páginas
        públicas de enlaces de sus usuarios. Lo opera{' '}
        <span className="text-fg">{RESPONSABLE}</span> (RUT {RUT}). Usarlo implica aceptar lo que
        sigue.
      </p>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Qué ofrece</h2>
        <p className="leading-relaxed text-fg-muted">
          Un panel donde cada usuario conecta sus propias cuentas de redes sociales para ver sus
          métricas, programar publicaciones que salen solas a la hora elegida y responder los
          comentarios que recibe. Y páginas públicas con enlaces, cuyo contenido —textos,
          imágenes y la selección de enlaces— es de cada usuario, que puede cambiarlo o retirarlo
          cuando quiera.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">El acceso al panel</h2>
        <p className="leading-relaxed text-fg-muted">
          El panel no tiene registro público: se entra solo por invitación, con el correo invitado
          y un código de un solo uso que llega a ese correo. El acceso es personal; no lo
          compartas. Intentar entrar sin invitación, o a cuentas de otra persona, no está
          permitido.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Tus cuentas y tu contenido</h2>
        <p className="leading-relaxed text-fg-muted">
          Solo conectes cuentas que sean tuyas o que estés autorizado a administrar. Lo que
          programas, publicas o respondes desde el panel lo publicas tú, en tu nombre: eres
          responsable de ese contenido y de que cumpla los términos y las normas de cada red
          social. El panel publica únicamente lo que tú escribiste y subiste, a la hora que
          elegiste, y puedes desconectar cualquier cuenta cuando quieras.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Las redes sociales</h2>
        <p className="leading-relaxed text-fg-muted">
          Instagram, Facebook, TikTok, YouTube, Threads y X no son de {RESPONSABLE} y se rigen por
          sus propios términos y sus propias políticas de privacidad. Cada una decide qué permite
          publicar y cuándo, y puede limitar o cambiar lo que el panel puede hacer con tu cuenta.
          Lo mismo vale para los enlaces de las páginas públicas: lo que hagas en el sitio al que
          llevan queda entre tú y ese sitio.
        </p>
        <p className="leading-relaxed text-fg-muted">
          Para conectar tu canal de YouTube, el panel usa los Servicios de API de YouTube. Al
          conectarlo aceptas también los{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50">
            Términos de Servicio de YouTube
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Sin garantías</h2>
        <p className="leading-relaxed text-fg-muted">
          El servicio se ofrece tal como está. Puede quedar fuera de servicio, una publicación
          programada puede no salir si la red la rechaza o deja de permitirla, y la información
          puede quedar desactualizada. Cuando una publicación falla, el panel lo muestra y te
          avisa por correo. No se asume responsabilidad por daños derivados de usarlo o de no
          poder usarlo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Datos</h2>
        <p className="leading-relaxed text-fg-muted">
          Qué se guarda, para qué y cómo se borra está descrito en la{' '}
          <Link
            href="/privacidad"
            className="text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50"
          >
            política de privacidad
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Cambios y contacto</h2>
        <p className="leading-relaxed text-fg-muted">
          Estos términos pueden cambiar; la fecha de arriba indica la última versión. Para
          cualquier consulta, escribe a {RESPONSABLE}:{' '}
          <a
            href={`mailto:${CONTACTO}`}
            className="text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50"
          >
            {CONTACTO}
          </a>
          .
        </p>
      </section>
    </article>
  )
}
