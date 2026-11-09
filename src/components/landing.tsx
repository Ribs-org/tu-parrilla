import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Plus } from 'lucide-react'
import {
  CLASE_FILA,
  CLASE_FILA_BASE,
  DentroDeLaFila,
  MezclaDelDia,
  ResumenDelDia,
  RotuloCalor,
  globitoDeFila,
} from '@/app/admin/(dash)/schedule/calendar'
import { dibujoDe } from '@/app/admin/(dash)/schedule/dibujo'
import { Redes } from '@/app/admin/(dash)/schedule/redes'
import { estadoDeFila } from '@/app/admin/(dash)/schedule/semana'
import { DesplazarAHoy } from '@/app/admin/(dash)/schedule/desplazar-a-hoy'
import { BOTON_CHICO, BOTON_CHICO_SECUNDARIO, ENLACE_BOTON, ENLACE_BOTON_SECUNDARIO } from '@/components/boton'
import { BotonTema } from '@/components/boton-tema'
import { Corte, CorteDefs, MarcaDeTuParrilla } from '@/components/corte'
import { DeNocheYDeDia, NombreDe } from '@/components/de-noche-y-de-dia'
import { ContadorQueSube } from '@/components/contador-que-sube'
import { Icon } from '@/components/icon'
import { ArmaUnCorte, SeArmaMientrasSube } from '@/components/landing-demos'
import { colorDeRed } from '@/lib/color-de-red'
import { CONTACTO, RESPONSABLE, RUT } from '@/lib/empresa'
import { PROXIMAMENTE, REDES_PROXIMAMENTE, networkLabel } from '@/lib/networks'
import { calorDelDia, formatoDe, type Calor, type Fierro } from '@/lib/parrilla'
import type { NumerosDeLaPortada } from '@/lib/portada-numeros'
import { sinMetricasDerivadas } from '@/lib/social/politica-youtube'
import { NO_PUBLISH_TOKEN } from '@/lib/social/publish/publisher'
import { FOTO, SEMANA, VIDEO, fotos, type CorteDeMuestra, type DiaDeMuestra, type Estado } from '@/components/landing-semana'
import { PiezaDefs } from '@/components/pieza-sushi'
import type { Tema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { SE_ENFRIA, SE_QUEMO, nombreDe } from '@/lib/vocabulario'

/**
 * La cara pública del producto, en el dominio del producto.
 *
 * La dirección visual no se inventa acá: es la del panel —acero frío, y la brasa solo donde
 * hay calor o algo que hacer—, y las piezas también son las del panel. La semana del inicio
 * es la del calendario —sus `.grilla`, sus filas (`DentroDeLaFila`), la mezcla de redes y el
 * resumen de cada día—, las fichas son las del compositor, la subida es su «Así va a quedar» y
 * lo quemado es la fila de «Se quemó».
 * Ninguna es un dibujo que se parece: si el panel cambia, la portada cambia con él. Lo que
 * se toca vive en `landing-demos.tsx`.
 *
 * No hace nada: no hay registro ni formulario. Los únicos enlaces son entrar, lo legal y los
 * perfiles de los creadores que salen en ella (`CREADORES`). Lo único que lee de la base es el
 * contador, una suma sin nombres (`lib/portada-numeros.ts`), y sin él la portada se sirve igual. Y
 * tiene que seguir diciendo qué hace la app y para qué usa los datos de cada red, con la
 * privacidad a la vista: es lo que Google miró para verificar la marca
 * (`docs/google-verificacion-guion.md`).
 *
 * Tiene los dos modos del panel: la noche de entrada y el día con sushi, con el mismo botón. De
 * día la marca es el nigiri a punto (`MarcaDeTuParrilla`), y lo que cuenta el dibujo se dice con sushi
 * (`DeNocheYDeDia`). Ver `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`, tanda 4.
 */

/*
 * Lo que la portada dice distinto de día, donde el dibujo es sushi, va en las dos versiones
 * (`DeNocheYDeDia`), como en el panel: las pantallas que cambian de nombre (La Barra, Los
 * Cuchillos) y lo que cuenta el dibujo. Lo que dice qué hace la app es igual en los dos modos.
 */

/** La semana del inicio en palabras, para el lector de pantalla: el dibujo no se lee. */
function semanaEnPalabras(tema: Tema): string {
  return `Una semana en ${nombreDe('/admin/schedule', tema)}, de ejemplo: el lunes salió un video; el martes no hubo nada; el miércoles, ${tema === 'dia' ? 'la tabla llena' : 'la parrilla llena'} con un carrusel, un video y un texto; hoy jueves salió una foto y está saliendo un video a Instagram, TikTok y YouTube; el viernes acaba de caer un carrusel programado; el sábado está vacío, y el domingo hay un texto programado y una historia de Instagram.`
}

const CLASE_CALOR: Record<Calor, string> = {
  apagada: 'grilla-apagada',
  prendida: 'grilla-prendida',
  llena: 'grilla-llena',
}

/**
 * Lo que un destino necesita para dibujarse como en el panel, sin cuenta de verdad detrás. La
 * cuenta es la red: en la muestra no hay dos de la misma. Una historia lo dice en sus opciones,
 * como las de verdad (`esHistoria`).
 */
function destinoDeMuestra(d: { network: string; status: Estado }, lastError: string | null = null, historia = false) {
  return { ...d, accountId: d.network, handle: null, externalId: null, opciones: historia ? { historia: true } : null, lastError }
}

/** En la muestra ninguna cuenta tiene el fierro frío. */
const SIN_FRIAS: ReadonlySet<string> = new Set()

/** Un corte de la semana con lo que dibuja: el mismo `dibujoDe` y el mismo `estadoDeFila` del calendario. */
function dibujado(corte: CorteDeMuestra) {
  const destinos = corte.destinos.map((d) => destinoDeMuestra(d, null, corte.historia))
  const dibujo = dibujoDe(destinos, corte.media, SIN_FRIAS)
  return { corte, destinos, dibujo, estado: estadoDeFila(dibujo.coccion, dibujo.sellos) }
}

/**
 * Un día de la semana, como en el calendario (`calendar.tsx`): arriba su nombre, su calor, la
 * mezcla de redes y cuánto salió; abajo, la parrilla con una fila de una línea por corte
 * (`DentroDeLaFila`), sin enlace. El texto va en el globito, como allá.
 */
function Dia({ dia }: { dia: DiaDeMuestra }) {
  const cortes = dia.cortes.map(dibujado)
  const calor = calorDelDia(cortes.length)
  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-hoy={dia.hoy ? '' : undefined}>
      <div className="flex flex-col gap-1.5">
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
            <RotuloCalor calor={calor} />
          </span>
        </div>
        <MezclaDelDia items={cortes.map((c) => ({ targets: c.destinos }))} />
        <ResumenDelDia cocciones={cortes.map((c) => c.dibujo.coccion)} />
      </div>
      <div
        className={cn(
          'grilla flex min-h-[4.5rem] flex-col gap-1 p-1.5',
          CLASE_CALOR[calor],
          calor === 'apagada' && 'justify-center',
          dia.hoy && 'ring-1 ring-inset ring-velo/25',
        )}
      >
        {/* Una parrilla fría que todavía sirve invita, como en el panel: con mouse, al pasar. */}
        {cortes.length === 0 && !dia.paso ? (
          <span className="poner-algo inline-flex items-center gap-1 self-center whitespace-nowrap rounded-md border border-dashed border-acero-600 px-2 py-1 text-[0.72rem] text-fg-muted transition-[opacity,color,border-color] duration-150">
            <Plus className="h-3 w-3" aria-hidden />
            Poner algo
          </span>
        ) : null}
        {cortes.map(({ corte, destinos, dibujo, estado }) => (
          <div
            key={corte.hora}
            data-globito={globitoDeFila(corte.hora, corte.texto, destinos)}
            className={cn(CLASE_FILA_BASE, CLASE_FILA[estado], corte.recien && 'recien')}
          >
            <DentroDeLaFila hora={corte.hora} texto={corte.texto} targets={destinos} dibujo={dibujo} estado={estado} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * La semana del inicio, como en el panel: en el teléfono se desliza de lado y abre corrida
 * hasta hoy (`DesplazarAHoy`, el mismo del calendario). Pide los mismos 60rem que el calendario,
 * para que la fila de una red quepa al lado de la hora.
 */
function Semana() {
  // El nombre del dibujo, en las dos versiones: un `aria-label` no lo alcanza el CSS del modo, y
  // `aria-labelledby` lee solo la que se ve.
  const id = 'semana-de-ejemplo'
  return (
    <>
      <span id={id} className="sr-only">
        <DeNocheYDeDia noche={semanaEnPalabras('noche')} dia={semanaEnPalabras('dia')} />
      </span>
      <DesplazarAHoy className="relative -mx-6 overflow-x-auto px-6 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
        <div
          role="img"
          aria-labelledby={id}
          className="grid min-w-[60rem] grid-cols-7 gap-2 lg:min-w-0"
        >
          {SEMANA.map((dia) => (
            <Dia key={dia.dia} dia={dia} />
          ))}
        </div>
      </DesplazarAHoy>
    </>
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
            <Icon name={c.red} className={cn('h-3.5 w-3.5 shrink-0', colorDeRed(c.red))} />
            {networkLabel(c.red)} · {c.usuario}
            {c.fierro === 'enfriandose' ? (
              <span className="text-xs text-caution">
                <DeNocheYDeDia noche={SE_ENFRIA.noche} dia={SE_ENFRIA.dia} />
              </span>
            ) : null}
            {c.fierro === 'frio' ? <span className="text-xs text-fg-faint">reconéctala</span> : null}
          </span>
        ))}
      </div>
      <p className="rounded-lg border border-caution/40 bg-caution/10 px-3 py-2 text-[0.8rem] text-caution">
        El permiso de Facebook · Tu Página vence el martes a las 16:58, antes de que salga esto:
        así no va a salir ahí. Reconéctala en <NombreDe ruta="/admin/accounts" /> antes, o elige un día
        anterior.
      </p>
    </div>
  )
}

/**
 * Una fila de «Se quemó», como en el panel (`schedule/se-quemo.tsx`): el corte con todas sus
 * marcas, la hora y la red que falló, el texto, la frase de qué pasó y los botones debajo.
 */
function SeQuemo() {
  const destinos = [
    destinoDeMuestra({ network: 'instagram', status: 'failed' }, NO_PUBLISH_TOKEN),
    destinoDeMuestra({ network: 'tiktok', status: 'published' }),
  ]
  const dibujo = dibujoDe(destinos, [VIDEO], SIN_FRIAS)
  return (
    <div className="chapa flex w-full max-w-xl items-start gap-3 rounded-xl p-4">
      <Corte {...dibujo} chico className="mt-1.5 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-[0.78rem] text-fg-muted">18:00</span>
          <Redes targets={[destinos[0]!]} />
          <span className="line-clamp-1 min-w-0 basis-full text-[0.85rem] text-fg sm:flex-1 sm:basis-auto">
            Detrás de cámara: cómo grabo un reel
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[0.75rem] text-negative">{NO_PUBLISH_TOKEN}</p>
        {/* El arreglo de esa frase (`arregloDe`, en `schedule/arreglo.ts`), «Reprogramar» y
            «Archivar». Escrito acá y no preguntado: `arreglo.ts` trae los publicadores, y con ellos
            la base. */}
        <p className="mt-1.5 flex flex-wrap items-center gap-2" aria-hidden>
          <span className={BOTON_CHICO}>Reconectar</span>
          <span className={BOTON_CHICO_SECUNDARIO}>Reprogramar</span>
          <span className={BOTON_CHICO_SECUNDARIO}>Archivar</span>
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

/** Las redes de la portada, en el orden en que se nombran. */
const REDES_DE_LA_PORTADA = ['instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'x']

/**
 * «Instagram, Facebook, TikTok y YouTube»: las que publican hoy. Sale de `REDES_PROXIMAMENTE`
 * para que la frase de arriba no prometa una red que Los Fierros todavía no deja conectar.
 */
const QUE_PUBLICAN = new Intl.ListFormat('es', { type: 'conjunction' }).format(
  REDES_DE_LA_PORTADA.filter((red) => !REDES_PROXIMAMENTE.has(red)).map(networkLabel),
)

/**
 * Las redes que se conectan, cada una con su nombre, en su chapa. Las de «Próximamente» van
 * apagadas y lo dicen debajo del nombre: es la misma palabra que ven en Los Fierros.
 */
function LasRedes() {
  return (
    <ul className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
      {REDES_DE_LA_PORTADA.map((red) => {
        const proxima = REDES_PROXIMAMENTE.has(red)
        return (
          <li
            key={red}
            className={cn('chapa flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-sm', proxima ? 'text-fg-muted' : 'text-fg')}
          >
            <Icon name={red} className="h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="block">{networkLabel(red)}</span>
              {proxima ? <span className="block text-[0.7rem] text-fg-faint">{PROXIMAMENTE}</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Los creadores que trabajan con Tu Parrilla y salen en la portada. Cada uno dio su permiso para
 * aparecer, el 2026-11-09: nadie entra a esta lista sin pedírselo, y para sacar a alguien basta con
 * borrarlo de acá y su foto de `public/creadores/`.
 *
 * La foto es la de su perfil, guardada en el sitio en 224 px y no pedida a la red en cada visita:
 * la URL de la red vence en días, y cargarla le avisaría a Meta o a TikTok de cada visitante, que es
 * lo que `/privacidad` dice que la portada no hace. Por lo mismo no van sus publicaciones: pedirían
 * el script de la red, con sus cookies de seguimiento. La de Vicente sale de su página
 * (vicente-pareja.cl), recortada a la cara; la de @chinocomprensible, de su perfil de TikTok.
 */
const CREADORES: ReadonlyArray<{ red: string; usuario: string; enlace: string; foto: string }> = [
  {
    red: 'instagram',
    usuario: 'vicente_pareja_j',
    enlace: 'https://www.instagram.com/vicente_pareja_j/',
    foto: '/creadores/vicente_pareja_j.webp',
  },
  {
    red: 'tiktok',
    usuario: 'chinocomprensible',
    enlace: 'https://www.tiktok.com/@chinocomprensible',
    foto: '/creadores/chinocomprensible.webp',
  },
]

function Creadores() {
  return (
    <ul className="grid w-full gap-3 sm:grid-cols-2">
      {CREADORES.map((c) => (
        <li key={`${c.red}-${c.usuario}`}>
          <a
            href={c.enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="chapa chapa-hover group flex items-center gap-4 rounded-xl px-4 py-3.5"
          >
            {/* La foto, con la red en una chapita en la esquina, como un sello. */}
            <span className="relative shrink-0">
              <Image
                src={c.foto}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-acero-600 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border border-acero-600 bg-acero-900">
                <Icon name={c.red} className={cn('h-3.5 w-3.5', colorDeRed(c.red))} />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base text-fg">@{c.usuario}</span>
              <span className="block text-[0.8rem] text-fg-muted">en {networkLabel(c.red)}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-fg-faint transition-colors group-hover:text-fg" aria-hidden />
            <span className="sr-only">(se abre en otra pestaña)</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * «Instagram, Facebook y TikTok»: las que publican hoy, menos las que no dejan sumar sus cifras
 * (YouTube, `politica-youtube.ts`). Son las que entran al contador.
 */
const LAS_QUE_SUMAN = new Intl.ListFormat('es', { type: 'conjunction' }).format(
  REDES_DE_LA_PORTADA.filter((red) => !REDES_PROXIMAMENTE.has(red) && !sinMetricasDerivadas(red)).map(networkLabel),
)

/** Las vistas y los «me gusta» de todas las cuentas conectadas, sumados, subiendo al aparecer. */
function ElContador({ numeros }: { numeros: NumerosDeLaPortada }) {
  const cifras = [
    { valor: numeros.vistas, nombre: 'vistas' },
    { valor: numeros.meGusta, nombre: 'me gusta' },
  ]
  return (
    <div className="lg:pt-1">
      <p className="font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-fg-faint">
        <DeNocheYDeDia noche="Lo que ya salió de la parrilla" dia="Lo que ya salió de la barra" />
      </p>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2">
        {cifras.map((c) => (
          <li key={c.nombre}>
            <ContadorQueSube
              hasta={c.valor}
              className="block font-titulo text-5xl font-semibold leading-none tracking-[0.01em] text-fg sm:text-6xl lg:text-5xl xl:text-6xl"
            />
            <span className="mt-2 block font-titulo text-[0.8rem] uppercase tracking-[0.18em] text-fg-muted">{c.nombre}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 max-w-[62ch] text-[0.8rem] leading-relaxed text-fg-faint">
        Entre todas las publicaciones de las cuentas de {LAS_QUE_SUMAN} conectadas a Tu Parrilla, como
        las cuenta cada red. Sube cada día, cuando se leen sus números. YouTube no entra: sus reglas no
        dejan sumar sus cifras.
      </p>
    </div>
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
 * `numeros`, el contador (`numerosDeLaPortada`); sin él, la sección de los creadores va sola.
 */
export function Landing({
  tema = 'noche',
  delEnlace = false,
  numeros = null,
}: {
  tema?: Tema
  delEnlace?: boolean
  numeros?: NumerosDeLaPortada | null
}) {
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
            Tu Parrilla publica en {QUE_PUBLICAN} a la hora que elegiste, te avisa antes de que algo
            falle y te dice cuánta gente llegó a tu página por cada publicación. No solo cuántos la
            vieron.
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

        {/* Quiénes ya la usan, y cuánto lleva servido, justo después de ver la semana: es lo que
            responde «¿y esto funciona?» antes de que alguien lo pregunte. */}
        <section className="mt-8 grid gap-10 py-12 sm:mt-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
          <div>
            <Encabezado donde="Con nosotros" titulo="Creadores que trabajan con Tu Parrilla" />
            <p className="mt-4 max-w-[48ch] text-[0.95rem] leading-relaxed text-fg-muted">
              Ya programan con Tu Parrilla. Míralos donde publican:
            </p>
            <div className="mt-6">
              <Creadores />
            </div>
          </div>
          {numeros ? <ElContador numeros={numeros} /> : null}
        </section>

        {/* La leyenda del corte, para tocarla: la sección más ancha, porque es la que enseña. */}
        <section className="py-12 sm:py-16">
          <Encabezado
            donde={<NombreDe ruta="/admin/schedule" />}
            titulo={<DeNocheYDeDia noche="Cada publicación es un corte" dia="Cada publicación es una pieza" />}
          />
          <p className="mt-4 max-w-[62ch] text-[0.95rem] leading-relaxed text-fg-muted">
            <DeNocheYDeDia
              noche="La forma dice qué es: entraña el video, tira de asado el carrusel —un hueso por foto—, bife la foto, chori el texto y choripán al paso la historia. La carne dice cómo va, de cruda a punto. Y lleva una marca por cada red, que se quema cuando esa red lo publica."
              dia="La forma dice qué es: nigiri el video, un roll el carrusel —entero hasta que sale, y después en rodajas, una por foto—, sashimi la foto, temaki el texto y onigiri la historia. El pescado dice cómo va, de crudo a punto bajo el soplete. Y lleva una banda de nori por cada red, que se completa cuando esa red lo publica."
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

        <Rasgo donde={<NombreDe ruta="/admin/accounts" />} titulo="Avisan antes, no después" muestra={<Fierros />}>
          <p>
            <DeNocheYDeDia
              noche="Conectas cada cuenta una vez, y su fierro dice cómo está la conexión: al rojo, viva; en ámbar, se está enfriando; gris, se apagó."
              dia="Conectas cada cuenta una vez, y su cuchillo dice cómo está la conexión: con filo, viva; en ámbar, se está desafilando; gris, sin filo."
            />
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
            <NombreDe ruta="/admin/accounts" />. El detalle está en la{' '}
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
