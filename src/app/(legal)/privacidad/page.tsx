import type { Metadata } from 'next'

import { nombreDe } from '@/lib/vocabulario'
import { CONTACTO, RESPONSABLE, RUT } from '@/lib/empresa'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Qué datos guarda este sitio y qué no.',
}

const ACTUALIZADO = '5 de octubre de 2026'

export default function PrivacidadPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-titulo text-3xl font-semibold uppercase tracking-[0.03em]">Privacidad</h1>
        <p className="mt-2 text-sm text-fg-muted">Actualizado el {ACTUALIZADO}.</p>
      </header>

      <p className="leading-relaxed text-fg-muted">
        Tu Parrilla es un panel privado, por invitación, para que creadores de contenido
        programen, publiquen y midan sus publicaciones en sus propias redes. Lo opera{' '}
        <span className="text-fg">{RESPONSABLE}</span> (RUT {RUT}), responsable de los datos que
        se describen aquí.
      </p>

      <p className="leading-relaxed text-fg-muted">
        Las páginas públicas del sitio miden su propio tráfico para saber qué contenido
        funciona, y nada más. No usan cookies de seguimiento, no hay analítica de terceros, y no
        se vende ni se comparte ningún dato con nadie.
      </p>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">
          Qué se guarda de cada visita
        </h2>
        <ul className="space-y-2 leading-relaxed text-fg-muted">
          <li>
            <span className="text-fg">Un identificador derivado</span>, no tu dirección IP. Se
            calcula un hash SHA-256 sobre la IP, el user agent, una clave secreta del servidor y
            la fecha del día. La IP nunca se guarda, y como la fecha entra en el cálculo, mañana
            el mismo visitante produce un identificador distinto.
          </li>
          <li>
            <span className="text-fg">Ubicación aproximada</span>: país, región, ciudad, zona
            horaria y coordenadas a nivel de ciudad, tal como las entrega el proveedor de
            hosting a partir de la IP.
          </li>
          <li>
            <span className="text-fg">Tipo de dispositivo, sistema operativo y navegador</span>,
            derivados del user agent.
          </li>
          <li>
            <span className="text-fg">De dónde vienes</span>: la página de origen (referrer) y la
            red social deducida de ella.
          </li>
          <li>
            <span className="text-fg">Las etiquetas del enlace</span>: el parámetro{' '}
            <code className="font-mono text-[0.85em] text-fg-muted">?s=</code> y los{' '}
            <code className="font-mono text-[0.85em] text-fg-muted">utm_*</code>, si el enlace que
            seguiste los traía.
          </li>
          <li>
            <span className="text-fg">El idioma preferido</span> de tu navegador.
          </li>
          <li>
            <span className="text-fg">Qué enlaces se hacen clic</span>: cuál, en qué posición de la
            página, y cuántos milisegundos pasaron desde que cargó.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Sin cookies</h2>
        <p className="leading-relaxed text-fg-muted">
          No se instala ninguna cookie para medir tráfico. La única cookie que este sitio puede
          poner es la sesión del panel, y solo aparece si inicias sesión en él.
        </p>
        <p className="leading-relaxed text-fg-muted">
          Esto tiene una consecuencia que conviene decir en voz alta: como el identificador
          cambia cada día, no es posible seguir a nadie a lo largo del tiempo. «Visitantes
          únicos» es siempre una cifra diaria. Es el precio deliberado de no usar cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">
          Cuentas de redes sociales conectadas
        </h2>
        <p className="leading-relaxed text-fg-muted">
          Al panel solo se entra por invitación: cada persona invitada ingresa con su correo y
          un código de un solo uso que le llega por correo, y puede conectar{' '}
          <span className="text-fg">sus propias cuentas</span> de Instagram, Facebook, TikTok,
          YouTube, Threads y X para leer las métricas de sus publicaciones, publicar en ellas y
          responder sus comentarios. Cada usuario ve solo las cuentas que él conectó. La de
          Instagram se conecta{' '}
          <span className="text-fg">mediante un inicio de sesión de Facebook</span>: eso lee la
          lista de páginas de Facebook de quien conecta, y solo para encontrar cuál de ellas
          tiene asociada la cuenta de Instagram. De esa lista no se guarda nada —ni nombres de
          páginas, ni sus datos, ni nada de la cuenta de Facebook— salvo el identificador y el
          nombre de usuario de la cuenta de Instagram que quedó conectada. Con una cuenta
          conectada:
        </p>
        <ul className="space-y-2 leading-relaxed text-fg-muted">
          <li>
            Los tokens de acceso se guardan <span className="text-fg">cifrados</span> (AES-256-GCM),
            y se usan para dos cosas: pedir las métricas de esas publicaciones y{' '}
            <span className="text-fg">publicar en esas mismas cuentas</span> lo que su dueño
            haya programado desde el panel o desde la aplicación del teléfono. La publicación
            ocurre <span className="text-fg">a la hora que él eligió</span>, sin que haga falta
            que esté presente, y solo con el contenido que él mismo escribió y subió.
          </li>
          <li>
            Se guardan los datos públicos de esas publicaciones: identificador, enlace,
            descripción, miniatura y fecha, junto con sus contadores públicos de
            reproducciones, «me gusta», comentarios, veces compartido, guardados y alcance.
          </li>
          <li>
            <span className="text-fg">Los comentarios que otras personas dejan</span> en esas
            publicaciones: el texto, el nombre de usuario y el identificador de quien comentó, y
            la fecha. Se guardan para mostrarlos en la cola de comentarios del panel y para
            mandar la respuesta que decida el dueño de la cuenta, o la respuesta automática de
            una regla de palabra clave que él mismo configuró.
          </li>
          <li>
            Para proponer un borrador de respuesta, el texto del comentario, el nombre de quien
            lo dejó y el texto de la publicación se envían a un modelo de lenguaje a través de la
            pasarela de IA de Vercel. No se le envían métricas, otros comentarios ni ningún otro
            dato. Ningún borrador se publica sin que el dueño de la cuenta lo mande.
          </li>
          <li>
            <span className="text-fg">Solo de las cuentas que cada usuario conectó.</span> No se
            leen seguidores, mensajes privados ni datos de cuentas que nadie conectó.
          </li>
        </ul>
        <p className="leading-relaxed text-fg-muted">
          Desconectar una cuenta desde el panel borra sus credenciales. El historial de métricas
          ya recogido se conserva.
        </p>
        <p className="leading-relaxed text-fg-muted">
          El uso que hace este sitio de la información que recibe de las APIs de Google se ajusta
          a la{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50"
          >
            Google API Services User Data Policy
          </a>
          , incluidos los requisitos de <span className="text-fg">Limited Use</span>. De YouTube
          se guardan el identificador, el título, la miniatura y los contadores de{' '}
          <span className="text-fg">tus propios videos</span>, y los comentarios de esos videos.
          Se refrescan a diario, y se borran al desconectar la cuenta —las credenciales— o si lo
          pides. Puedes revocarlo desde {nombreDe('/admin/accounts')} o desde{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50"
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">
          La aplicación del teléfono
        </h2>
        <p className="leading-relaxed text-fg-muted">
          Existe una aplicación para Android, «Vicente · Números», que es el mismo panel en el
          teléfono. No es pública: se distribuye a una lista cerrada de probadores y hace falta
          una cuenta para usarla.
        </p>
        <ul className="space-y-2 leading-relaxed text-fg-muted">
          <li>
            <span className="text-fg">No recoge datos de terceros.</span> Lo único que maneja es
            lo que el dueño de la cuenta escribe o elige: el texto de una publicación, las fotos
            o videos que le adjunta, y la fecha en que quiere que salga.
          </li>
          <li>
            <span className="text-fg">Pide acceso a fotos y videos</span> por una sola razón:
            para que puedas elegir los archivos que vas a publicar. No los recorre, no los
            indexa y no sube ninguno que no hayas seleccionado.
          </li>
          <li>
            <span className="text-fg">La sesión vive en el almacenamiento seguro del teléfono</span>
            , el que el sistema operativo cifra. Cerrar sesión la borra.
          </li>
          <li>
            <span className="text-fg">No hay analítica ni publicidad dentro de la aplicación</span>
            , y nada de lo que escribes o eliges en ella se comparte con nadie.
          </li>
          <li>
            <span className="text-fg">Habla con dos servidores, y con ninguno más.</span> El de
            este sitio, al que manda lo que publicas y del que lee tus números. Y el de Expo, el
            servicio con el que está construida: cada vez que se abre, la aplicación le pregunta
            si hay una versión nueva de sí misma, y así se actualiza sin pasar por la tienda. En
            esa pregunta Expo ve la dirección IP del teléfono, su sistema operativo y qué versión
            de la aplicación tiene instalada. No recibe nada de tu contenido ni de tu sesión.
          </li>
          <li>
            <span className="text-fg">Todo viaja cifrado</span>, por HTTPS.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Dónde vive todo</h2>
        <p className="leading-relaxed text-fg-muted">
          El sitio está alojado en Vercel y los datos en una base de datos Postgres gestionada por
          Supabase. Los archivos que cada usuario sube —fotos, videos y los documentos que
          adjunta a una regla de comentarios— se almacenan en Cloudflare R2. Los códigos de
          ingreso y los avisos se mandan por correo con Resend, que recibe la dirección de
          destino, y los borradores de respuesta los redacta un modelo de lenguaje a través de
          la pasarela de IA de Vercel, con lo descrito arriba. Ninguno de esos proveedores
          recibe los datos para usarlos por su cuenta: los procesan por encargo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Contacto</h2>
        <p className="leading-relaxed text-fg-muted">
          El responsable de estos datos es {RESPONSABLE} (RUT {RUT}). Si quieres saber qué hay
          asociado a ti, o pedir que se borre, escribe a{' '}
          <a
            href={`mailto:${CONTACTO}`}
            className="text-fg underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-white/50"
          >
            {CONTACTO}
          </a>
          . Si solo visitaste las páginas públicas, ten en cuenta que, por el diseño descrito
          arriba, lo más probable es que no exista forma de vincular ningún registro contigo: de
          las visitas no se guardan identificadores estables.
        </p>
        <p className="leading-relaxed text-fg-muted">
          Si conectaste Instagram o Facebook, hay dos caminos desde Facebook, y no son lo mismo.{' '}
          <span className="text-fg">Quitar esta app</span> —en Configuración → Apps y sitios web—{' '}
          <span className="text-fg">desconecta</span> esas dos cuentas: se borran los permisos
          guardados, y las métricas que ya se recogieron se quedan.{' '}
          <span className="text-fg">Pedir el borrado</span> —en esa misma pantalla, entrando a
          «Ver y editar» y usando «Enviar solicitud»— sí borra todo lo que vino de Instagram y
          Facebook, y con ello cualquier corte programado que se quede sin ningún destino, texto y
          media incluidos; Facebook te devuelve un código con una dirección de este sitio que
          confirma cuándo ocurrió y cuántas cuentas se borraron.
        </p>
      </section>
    </article>
  )
}
