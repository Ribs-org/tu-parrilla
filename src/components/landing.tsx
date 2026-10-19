import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CLASE_BORDE, CLASE_ESTADO, ROTULO_CALOR } from '@/app/admin/(dash)/schedule/calendar'
import { bordeDe, estadoCorto } from '@/app/admin/(dash)/schedule/dibujo'
import { DesplazarAHoy } from '@/app/admin/(dash)/schedule/desplazar-a-hoy'
import { Redes } from '@/app/admin/(dash)/schedule/redes'
import { BOTON_CHICO, BOTON_CHICO_SECUNDARIO, ENLACE_BOTON, ENLACE_BOTON_SECUNDARIO } from '@/components/boton'
import { BotonTema } from '@/components/boton-tema'
import { Corte, CorteDefs, MarcaDeTuParrilla } from '@/components/corte'
import { Icon } from '@/components/icon'
import { ArmaUnCorte, SeArmaMientrasSube } from '@/components/landing-demos'
import { CONTACTO, RESPONSABLE, RUT } from '@/lib/empresa'
import { networkLabel } from '@/lib/networks'
import { calorDelDia, carneDe, coccionDe, formatoDe, selloDe, type Calor, type Fierro } from '@/lib/parrilla'
import { NO_PUBLISH_TOKEN } from '@/lib/social/publish/publisher'
import { FOTO, SEMANA, VIDEO, fotos, type CorteDeMuestra, type DiaDeMuestra, type Estado } from '@/components/landing-semana'
import { PiezaDefs } from '@/components/pieza-sushi'
import type { Tema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { SE_QUEMO, nombreDe } from '@/lib/vocabulario'

/**
 * La cara pública del producto, en el dominio del producto.
 *
 * La dirección visual no se inventa acá: es la del panel —acero frío, y la brasa solo donde
 * hay calor o algo que hacer—, y las piezas también son las del panel. La semana del inicio
 * son las mismas `.grilla` del calendario con los mismos cortes (`Corte`), las fichas son las
 * del compositor, la subida es su «Así va a quedar» y lo quemado es la fila de «Se quemó».
 * Ninguna es un dibujo que se parece: si el panel cambia, la portada cambia con él. Lo que
 * se toca vive en `landing-demos.tsx`.
 *
 * No hace nada: no hay registro ni formulario. Los únicos enlaces son entrar y lo legal. Y
 * tiene que seguir diciendo qué hace la app y para qué usa los datos de cada red, con la
 * privacidad a la vista: es lo que Google miró para verificar la marca
 * (`docs/google-verificacion-guion.md`).
 *
 * Tiene los dos modos del panel: la noche de entrada y el día con sushi, con el mismo botón. De
 * día la marca es el nigiri a punto (`MarcaDeTuParrilla`), y lo que cuenta el dibujo se dice con sushi
 * (`DeNocheYDeDia`). Ver `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`, tanda 4.
 */

/**
 * Lo que la portada dice distinto de día, donde el dibujo es sushi: van las dos versiones y el
 * modo esconde una (`.solo-noche`, `.solo-dia`), como los dos dibujos del corte, así cambia con
 * el botón sin recargar. Adentro del panel las palabras no cambian de día, salvo «Se quemó»; la
 * portada sí tiene voz de día, porque no es una pantalla que guíe la wiki. Lo que dice qué hace
 * la app no va acá: es igual en los dos modos.
 */
function DeNocheYDeDia({ noche, dia }: { noche: React.ReactNode; dia: React.ReactNode }) {
  return (
    <>
      <span className="solo-noche">{noche}</span>
      <span className="solo-dia">{dia}</span>
    </>
  )
}

const CLASE_CALOR: Record<Calor, string> = {
  apagada: 'grilla-apagada',
  prendida: 'grilla-prendida',
  llena: 'grilla-llena',
}

/** Lo que un destino necesita para dibujarse como en el panel, sin cuenta de verdad detrás. */
function destinoDeMuestra(d: { network: string; status: Estado }, lastError: string | null = null) {
  return { ...d, handle: null, externalId: null, opciones: null, lastError }
}

/** La tarjeta de un corte, como en la semana del calendario (`calendar.tsx`), sin enlace. */
function Tarjeta({ corte }: { corte: CorteDeMuestra }) {
  const destinos = corte.destinos.map((d) => destinoDeMuestra(d))
  const estados = destinos.map((d) => d.status)
  const sellos = destinos.map((d) => selloDe(d))
  const coccion = coccionDe(estados)
  const estado = estadoCorto(coccion, sellos)
  return (
    <div
      className={cn(
        'rounded-md border bg-acero-900 p-1.5',
        CLASE_BORDE[bordeDe(coccion, sellos)],
        corte.recien && 'recien',
      )}
    >
      <Corte
        {...formatoDe(corte.media)}
        carne={carneDe(estados)}
        coccion={coccion}
        sellos={sellos}
        className={cn(sellos.includes('saliendo') && 'mt-2.5')}
      />
      <p className="mt-1.5 font-titulo text-[0.6rem] tracking-[0.12em] text-fg">
        {corte.hora}
        {estado ? <span className={CLASE_ESTADO[coccion]}> · {estado}</span> : null}
      </p>
      <span className="mt-1 block">
        <Redes targets={destinos} sellos={sellos} />
      </span>
      <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-fg">{corte.texto}</p>
    </div>
  )
}

function Dia({ dia }: { dia: DiaDeMuestra }) {
  const calor = calorDelDia(dia.cortes.length)
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2" data-hoy={dia.hoy ? '' : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn('font-titulo text-[0.65rem] uppercase tracking-[0.14em]', dia.hoy ? 'text-fg' : 'text-fg-faint')}
        >
          {dia.hoy ? `hoy · ${dia.dia}` : dia.dia}
        </span>
        <span
          className={cn(
            'truncate font-titulo text-[0.55rem] uppercase tracking-[0.12em]',
            calor === 'llena' ? 'text-brasa' : 'text-fg-muted',
          )}
        >
          {ROTULO_CALOR[calor]}
        </span>
      </div>
      <div
        className={cn(
          'grilla flex min-h-0 flex-1 flex-col gap-2 p-2',
          CLASE_CALOR[calor],
          calor === 'apagada' && 'justify-center',
          dia.hoy && 'ring-1 ring-inset ring-velo/25',
        )}
      >
        {/* Una parrilla fría que todavía sirve invita, como en el panel: con mouse, al pasar. */}
        {dia.cortes.length === 0 && !dia.paso ? (
          <span className="poner-algo inline-flex items-center gap-1 self-center whitespace-nowrap rounded-md border border-dashed border-acero-600 px-2 py-1 text-[0.72rem] text-fg-muted transition-[opacity,color,border-color] duration-150">
            <Plus className="h-3 w-3" aria-hidden />
            Poner algo
          </span>
        ) : null}
        {dia.cortes.map((corte) => (
          <Tarjeta key={corte.hora} corte={corte} />
        ))}
      </div>
    </div>
  )
}

/**
 * La semana del inicio, como en el panel: en el teléfono se desliza de lado y abre corrida
 * hasta hoy (`DesplazarAHoy`, el mismo del calendario). De alto fijo, y lo que no cabe se
 * desvanece abajo: el miércoles va lleno, y estirada a su alto la semana tapaba la pantalla.
 */
function Semana() {
  return (
    <DesplazarAHoy className="relative -mx-6 overflow-x-auto px-6 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
      <div
        role="img"
        aria-label="Una semana en La Parrilla, de ejemplo: el lunes salió un video; el martes no hubo nada; el miércoles, la parrilla llena con un carrusel, un video y un texto; hoy jueves salió una foto y está saliendo un video a Instagram, TikTok y YouTube; el viernes acaba de caer un carrusel programado; el sábado está vacío, y el domingo hay un texto programado."
        className="grid h-[25rem] min-w-[52rem] grid-cols-7 gap-2 overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent)] lg:h-[27rem] lg:min-w-0"
      >
        {SEMANA.map((dia) => (
          <Dia key={dia.dia} dia={dia} />
        ))}
      </div>
    </DesplazarAHoy>
  )
}

/**
 * El título de una sección, con la pantalla del panel donde vive eso encima: quien entra
 * después ya conoce los nombres.
 */
function Encabezado({ donde, titulo }: { donde: React.ReactNode; titulo: React.ReactNode }) {
  return (
    <>
      <p className="font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-fg-faint">{donde}</p>
      <h2 className="mt-2 text-balance font-titulo text-2xl font-semibold uppercase leading-tight tracking-[0.04em] sm:text-[1.75rem]">
        {titulo}
      </h2>
    </>
  )
}

/**
 * Una sección: el texto manda, y la pieza del panel de al lado lo muestra. Sin raya entre
 * una y otra: el aire y el título ya las separan, y ocho rayas seguidas hacían de la página
 * una ficha técnica.
 */
function Rasgo({
  donde,
  titulo,
  children,
  muestra,
}: {
  donde: React.ReactNode
  titulo: React.ReactNode
  children: React.ReactNode
  muestra: React.ReactNode
}) {
  return (
    <section className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <Encabezado donde={donde} titulo={titulo} />
        <div className="mt-4 max-w-[44ch] space-y-3 text-[0.95rem] leading-relaxed text-fg-muted">{children}</div>
      </div>
      <div className="flex min-w-0 items-center lg:justify-center">{muestra}</div>
    </section>
  )
}

const CLASE_FIERRO: Record<Fierro, string> = {
  'al-rojo': 'fierro-al-rojo',
  enfriandose: 'fierro-enfriandose',
  frio: 'fierro-frio',
}

/** Las fichas de cuentas del compositor, con su fierro, y el aviso de lo que vence antes. */
function Fierros() {
  const cuentas: ReadonlyArray<{ red: string; usuario: string; fierro: Fierro; marcada?: true }> = [
    { red: 'instagram', usuario: '@tu.cuenta', fierro: 'al-rojo', marcada: true },
    { red: 'facebook', usuario: 'Tu Página', fierro: 'enfriandose', marcada: true },
    { red: 'tiktok', usuario: '@tu.cuenta', fierro: 'al-rojo' },
    { red: 'youtube', usuario: 'Tu Canal', fierro: 'frio' },
  ]
  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex flex-wrap gap-2">
        {cuentas.map((c) => (
          <span
            key={c.red}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
              c.marcada ? 'border-brasa bg-brasa/10 text-fg' : 'border-acero-600 text-fg-muted',
              c.fierro === 'frio' && 'opacity-50',
            )}
          >
            <span className={cn('fierro w-3.5 shrink-0', CLASE_FIERRO[c.fierro])} aria-hidden />
            <Icon name={c.red} className="h-3.5 w-3.5 shrink-0" />
            {networkLabel(c.red)} · {c.usuario}
            {c.fierro === 'enfriandose' ? <span className="text-xs text-caution">se enfría</span> : null}
            {c.fierro === 'frio' ? <span className="text-xs text-fg-faint">reconéctala</span> : null}
          </span>
        ))}
      </div>
      <p className="rounded-lg border border-caution/40 bg-caution/10 px-3 py-2 text-[0.8rem] text-caution">
        El permiso de Facebook · Tu Página vence el martes a las 16:58, antes de que salga esto:
        así no va a salir ahí. Reconéctala en {nombreDe('/admin/accounts')} antes, o elige un día
        anterior.
      </p>
    </div>
  )
}

/** Una fila de «Se quemó»: el corte con su halo, la frase de qué pasó y el arreglo al lado. */
function SeQuemo() {
  const destinos = [
    destinoDeMuestra({ network: 'instagram', status: 'failed' }, NO_PUBLISH_TOKEN),
    destinoDeMuestra({ network: 'tiktok', status: 'published' }),
  ]
  const estados = destinos.map((d) => d.status)
  const sellos = destinos.map((d) => selloDe(d))
  const coccion = coccionDe(estados)
  return (
    <div className="chapa flex w-full max-w-xl items-start gap-4 rounded-xl p-4">
      {/* El margen deja asomar la banderita. */}
      <Corte formato="entrana" carne={carneDe(estados)} coccion={coccion} sellos={sellos} chico className="mt-3 w-20 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-fg">
          Detrás de cámara: cómo grabo un reel
          <span className="text-negative"> · {estadoCorto(coccion, sellos)}</span>
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] text-fg">
          <Icon name="instagram" className="h-3.5 w-3.5 shrink-0" />
          Instagram · Falló
        </p>
        <p className="mt-0.5 text-[0.8rem] text-negative">{NO_PUBLISH_TOKEN}</p>
        {/* El arreglo de esa frase en «Se quemó» (`arregloDe`, en `schedule/arreglo.ts`). Escrito
            acá y no preguntado: `arreglo.ts` trae los publicadores, y con ellos la base. */}
        <p className="mt-2 flex flex-wrap gap-2" aria-hidden>
          <span className={BOTON_CHICO}>Reconectar</span>
          <span className={BOTON_CHICO_SECUNDARIO}>Reprogramar</span>
        </p>
      </div>
    </div>
  )
}

/** Lo que trajo cada corte: las vistas que cuenta la red, y al lado las visitas a tu página. */
function QueTrajo() {
  const filas: ReadonlyArray<{ texto: string; red: string; media: ReadonlyArray<{ mediaType: 'video' | 'image' }>; vistas: string; visitas: string }> = [
    { texto: 'Mi semana en ocho fotos', red: 'instagram', media: fotos(8), vistas: '3.410', visitas: '12' },
    { texto: 'Detrás de cámara: cómo grabo un reel', red: 'tiktok', media: [VIDEO], vistas: '1.092', visitas: '41' },
    { texto: 'El setup nuevo, de cerca', red: 'instagram', media: [FOTO], vistas: '860', visitas: '57' },
  ]
  return (
    <ul className="chapa w-full max-w-xl divide-y divide-acero-700 rounded-xl">
      {filas.map((f) => (
        <li key={f.texto} className="flex items-center gap-3 px-4 py-3">
          <Corte {...formatoDe(f.media)} carne="punto" coccion="punto" sellos={['servido']} chico className="w-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-fg">{f.texto}</p>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-[0.68rem] text-fg-faint">
              <Icon name={f.red} className="h-3 w-3 shrink-0" />
              {networkLabel(f.red)}
            </p>
          </div>
          <p className="shrink-0 text-right font-mono text-[0.78rem] leading-relaxed">
            <span className="block text-fg-muted">{f.vistas} vistas</span>
            <span className="block text-brasa">{f.visitas} visitas</span>
          </p>
        </li>
      ))}
    </ul>
  )
}

/** Un comentario en La Mesa, con la respuesta ya escrita esperando. */
function LaMesa() {
  return (
    <div className="w-full max-w-xl space-y-3">
      <div className="flex items-start gap-3">
        <Corte formato="entrana" carne="punto" coccion="punto" sellos={['servido']} chico className="w-12 shrink-0" />
        <div className="min-w-0">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-fg-faint">Instagram · @tu.cuenta</p>
          <p className="truncate text-sm text-fg-muted">Detrás de cámara: cómo grabo un reel</p>
        </div>
      </div>
      <div className="chapa rounded-xl p-4">
        <p className="text-[0.78rem] text-fg-faint">
          <span className="text-fg">@cami.codes</span> · hace 10 horas
        </p>
        <p className="mt-1 text-sm">¿Qué micrófono usas? Se escucha increíble.</p>
        <p className="mt-3 rounded-lg border border-acero-700 bg-acero-800 px-3 py-2 text-sm text-fg">
          ¡Gracias! Es un Shure MV7, conectado por USB. Lo dejo en la descripción.
        </p>
        <p className="mt-3 flex gap-2" aria-hidden>
          <span className={BOTON_CHICO}>Enviar</span>
          <span className={BOTON_CHICO_SECUNDARIO}>Descartar</span>
        </p>
      </div>
    </div>
  )
}

/** Tu página de enlaces, en chico. La de verdad lleva tus colores; esta, los del panel. */
function TuPagina() {
  return (
    <div className="w-full max-w-[17rem] rounded-2xl border border-acero-700 bg-acero-900 px-5 py-6 text-center">
      <span className="mx-auto block h-14 w-14 rounded-full bg-[linear-gradient(160deg,#e8621f,#2a2e33)]" aria-hidden />
      <p className="mt-3 text-sm font-medium text-fg">Tu Nombre</p>
      <ul className="mt-4 space-y-2 text-sm text-fg-muted">
        {['Mi último video', 'El curso', 'Escríbeme'].map((enlace) => (
          <li key={enlace} className="rounded-lg border border-acero-700 px-3 py-2">
            {enlace}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[0.72rem] text-fg-faint">
        tu-parrilla.cl/<span className="text-fg">tu-nombre</span>
      </p>
    </div>
  )
}

/** Las redes que se conectan, cada una con su nombre, en su chapa. */
function LasRedes() {
  return (
    <ul className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
      {['instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'x'].map((red) => (
        <li key={red} className="chapa flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-sm text-fg">
          <Icon name={red} className="h-4 w-4 shrink-0" />
          {networkLabel(red)}
        </li>
      ))}
    </ul>
  )
}

/** El cierre: una parrilla llena, con tres cortes a punto. Es un dibujo y nada más. */
function ParrillaLlena() {
  return (
    <div className="grilla grilla-llena relative aspect-[16/10] w-full" aria-hidden>
      <Corte
        formato="entrana"
        carne="punto"
        coccion="punto"
        sellos={['servido', 'servido', 'servido']}
        className="absolute left-[6%] top-[12%] w-[46%]"
      />
      <Corte
        formato="tira"
        huesos={4}
        carne="punto"
        coccion="punto"
        sellos={['servido', 'servido']}
        className="absolute right-[6%] top-[36%] w-[38%]"
      />
      <Corte
        formato="bife"
        carne="punto"
        coccion="punto"
        sellos={['servido', 'servido']}
        className="absolute bottom-[9%] left-[18%] w-[32%]"
      />
    </div>
  )
}

/**
 * `tema` es el modo con que se abre: el de la dirección (`?modo=dia`) o el del equipo
 * (`temaDeLaPortada`). `delEnlace`, si vino de la dirección: el botón lo anota en el equipo.
 */
export function Landing({ tema = 'noche', delEnlace = false }: { tema?: Tema; delEnlace?: boolean }) {
  return (
    <main className="acerado min-h-dvh bg-acero-950 px-6 py-8 sm:py-10" data-tema={tema}>
      <CorteDefs />
      <PiezaDefs />
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          {/* La marca: el bife a punto de noche, el mismo del ícono de la app; de día, el nigiri. */}
          <p className="flex items-center gap-3">
            <MarcaDeTuParrilla className="w-10" />
            <span className="font-titulo text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-fg">Tu Parrilla</span>
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <BotonTema inicial={tema} anotar={delEnlace} />
            <Link href="/ingresar" className={ENLACE_BOTON_SECUNDARIO}>
              Entrar
            </Link>
          </div>
        </header>

        <div className="mt-16 sm:mt-24">
          <h1 className="text-balance font-titulo text-[2.6rem] font-semibold uppercase leading-[1.02] tracking-[0.015em] sm:text-6xl lg:text-7xl">
            {/* Una frase por renglón, también en el teléfono: fluyendo, «Mira» quedaba colgando
                al final del primero. */}
            <span className="block">Programa la semana.</span>{' '}
            <span className="block">
              Mira qué trajo cada <DeNocheYDeDia noche="corte" dia="pieza" />.
            </span>
          </h1>

          <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-fg-muted sm:mt-8 sm:text-lg">
            Tu Parrilla publica en Instagram, Facebook, TikTok, YouTube, Threads y X a la hora que
            elegiste, te avisa antes de que algo falle y te dice cuánta gente llegó a tu página por
            cada publicación. No solo cuántos la vieron.
          </p>
        </div>

        <div className="mt-12 sm:mt-14">
          <Semana />
          <p className="mt-3 text-[0.75rem] text-fg-faint">
            <DeNocheYDeDia
              noche="Cada publicación es un corte, sobre el día en que sale. El fuego del día dice cuánto tiene encima."
              dia="Cada publicación es una pieza, sobre el día en que sale. El color del día dice cuánto tiene encima."
            />
          </p>
        </div>

        {/* La leyenda del corte, para tocarla: la sección más ancha, porque es la que enseña. */}
        <section className="mt-8 py-12 sm:mt-12 sm:py-16">
          <Encabezado
            donde={nombreDe('/admin/schedule')}
            titulo={<DeNocheYDeDia noche="Cada publicación es un corte" dia="Cada publicación es una pieza" />}
          />
          <p className="mt-4 max-w-[62ch] text-[0.95rem] leading-relaxed text-fg-muted">
            <DeNocheYDeDia
              noche="La forma dice qué es: entraña el video, tira de asado el carrusel —un hueso por foto—, bife la foto y chori el texto. La carne dice cómo va, de cruda a punto. Y lleva una marca por cada red, que se quema cuando esa red lo publica."
              dia="La forma dice qué es: nigiri el video, un roll el carrusel —entero hasta que sale, y después en rodajas, una por foto—, sashimi la foto y temaki el texto. El pescado dice cómo va, de crudo a punto bajo el soplete. Y lleva una banda de nori por cada red, que se completa cuando esa red lo publica."
            />{' '}
            Se lee de un vistazo, sin abrir nada. Pruébalo:
          </p>
          <div className="mt-10">
            <ArmaUnCorte />
          </div>
        </section>

        <Rasgo donde="Nueva publicación" titulo="Se arma mientras sube" muestra={<SeArmaMientrasSube />}>
          <p>
            <DeNocheYDeDia
              noche="Los archivos llegan como carne cruda, y el corte se completa a medida que suben. Si uno no llega, se quema y espera su «Reintentar»:"
              dia="Los archivos llegan como pescado crudo, y la pieza se completa a medida que suben. Si uno no llega, se echa a perder y espera su «Reintentar»:"
            />{' '}
            nada se programa a medias.
          </p>
        </Rasgo>

        <Rasgo donde={nombreDe('/admin/accounts')} titulo="Avisan antes, no después" muestra={<Fierros />}>
          <p>
            Conectas cada cuenta una vez, y su fierro dice cómo está la conexión: al rojo, viva; en
            ámbar, se está enfriando; gris, se apagó.
          </p>
          <p>
            Si el permiso de una cuenta vence antes de que salga lo que programaste, te lo dice ahí
            mismo, no cuando ya falló.
          </p>
        </Rasgo>

        <Rasgo
          donde={<DeNocheYDeDia noche={SE_QUEMO.noche} dia={SE_QUEMO.dia} />}
          titulo={<DeNocheYDeDia noche="Lo que se quema, se ve" dia="Lo que se echa a perder, se ve" />}
          muestra={<SeQuemo />}
        >
          <p>
            Si una red no lo publica,{' '}
            <DeNocheYDeDia noche="el corte se quema" dia="la pieza se echa a perder" /> —halo rojo y
            banderita— y te dice en una frase qué pasó, con el arreglo al lado: reconectar la
            cuenta, cambiar el archivo o darle otra hora.
          </p>
        </Rasgo>

        <Rasgo
          donde={nombreDe('/admin/analytics')}
          titulo={<DeNocheYDeDia noche="Qué trajo cada corte" dia="Qué trajo cada pieza" />}
          muestra={<QueTrajo />}
        >
          <p>
            Un programador de posts te dice cuántos lo vieron. Tu Parrilla pone al lado cuánta gente
            llegó a tu página por cada publicación, y ahí se ve cuál de tus{' '}
            <DeNocheYDeDia noche="cortes" dia="piezas" /> trabajó: no siempre es el más visto.
          </p>
        </Rasgo>

        <Rasgo donde={nombreDe('/admin/comments')} titulo="Cada comentario, con su respuesta ya escrita" muestra={<LaMesa />}>
          <p>
            Los comentarios de Instagram, Facebook y YouTube llegan a un solo lugar, con una
            respuesta ya escrita en tu tono. La lees, la cambias si quieres, y sale desde tu cuenta.
          </p>
        </Rasgo>

        <Rasgo donde={nombreDe('/admin/profiles')} titulo="Tu página" muestra={<TuPagina />}>
          <p>
            Todos tus enlaces en una dirección, con tu cara y tus colores. Es la página que mides, y
            la que pones en cada perfil. Si tienes dominio propio, va ahí.
          </p>
        </Rasgo>

        <Rasgo donde="Tus cuentas" titulo="Qué se conecta, y para qué" muestra={<LasRedes />}>
          <p>
            Cada cuenta se conecta con el permiso de su red, y solo se toca lo tuyo: Tu Parrilla
            publica lo que programas, lee los números de tus publicaciones y sus comentarios para
            que los respondas.
          </p>
          <p>
            Con tu canal de YouTube, sube los videos que programas y lee sus contadores y sus
            comentarios, tal como los entrega YouTube. Desconectas cuando quieras desde{' '}
            {nombreDe('/admin/accounts')}. El detalle está en la{' '}
            <Link href="/privacidad" className="text-fg underline decoration-velo/20 underline-offset-4 transition-colors hover:decoration-velo/50">
              política de privacidad
            </Link>
            .
          </p>
        </Rasgo>

        {/* El cierre: la semana servida, y la única puerta que hay. */}
        <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <div>
            <h2 className="font-titulo text-[2rem] font-semibold uppercase leading-[1.05] tracking-[0.02em] sm:text-5xl">
              <span className="block">Tu Parrilla</span> <span className="block">es por invitación.</span>
            </h2>
            <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-fg-muted sm:text-lg">
              No hay registro abierto. Si ya te invitaron, entra con tu correo.
            </p>
            <Link href="/ingresar" className={cn(ENLACE_BOTON, 'mt-8')}>
              Entrar con tu correo
            </Link>
          </div>
          <ParrillaLlena />
        </section>

        <footer className="flex flex-col gap-3 border-t border-acero-700 pt-8 pb-4 text-sm text-fg-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            Un servicio de {RESPONSABLE} (RUT {RUT}), Chile ·{' '}
            <a href={`mailto:${CONTACTO}`} className="hover:text-fg">
              {CONTACTO}
            </a>
          </p>
          <p className="flex gap-5">
            <Link href="/terminos" className="hover:text-fg">Términos</Link>
            <Link href="/privacidad" className="hover:text-fg">Privacidad</Link>
          </p>
        </footer>
      </div>
    </main>
  )
}

const TITULO = 'Tu Parrilla'
const DESCRIPCION =
  'Programa la semana en tus redes y mira cuánta gente llegó a tu página por cada publicación.'

/**
 * La metadata de la landing, compartida por sus dos direcciones. `tema` elige la imagen para
 * compartir: con `?modo=dia` en la dirección, la de día (`/api/og/dia`). Las dos direcciones,
 * con o sin modo, son la misma página: la canónica es la raíz.
 *
 * La misma página se sirve en la raíz del dominio del producto y en `/landing`, y las dos
 * tienen que compartirse igual. Vive acá, al lado de la página, para que no se
 * desincronicen: son lo mismo y se editan juntas.
 *
 * La imagen se pide con URL absoluta porque las etiquetas de compartir no admiten rutas
 * relativas —quien las lee es un servidor ajeno, que no sabe de qué sitio vinieron—, y el
 * host sale de la petición para que funcione igual en producción y en un preview.
 */
export function metadataLanding(host: string | null, tema: Tema = 'noche'): Metadata {
  const imagen = host ? `https://${host}/api/og${tema === 'dia' ? '/dia' : ''}` : undefined
  return {
    title: TITULO,
    description: DESCRIPCION,
    alternates: host ? { canonical: `https://${host}/` } : undefined,
    openGraph: { title: TITULO, description: DESCRIPCION, images: imagen, type: 'website' },
    twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: imagen },
  }
}
