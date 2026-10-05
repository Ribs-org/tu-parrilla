# Pendientes

El backlog: todo lo que se decidió **posponer** —bugs vistos y no arreglados, features por
hacer, trámites en espera, cosas por revisar— para que no dependa de la memoria de nadie ni
de una sesión que ya se cerró. Cuando alguien pregunte «¿qué tenemos pendiente?», la
respuesta empieza aquí.

Cómo se usa:

- **Una entrada por cosa**, en la sección que le toca, con la fecha en que se anotó, qué es,
  por qué importa y dónde está el detalle. Corta: el detalle largo vive en el documento que
  ya lo cuenta (`deuda-tecnica.md`, un guion, el levantamiento), y aquí solo el enlace.
- **Lo que depende de una acción del dueño** —un panel externo, un formulario, un pago— va
  marcado **[dueño]**, porque ningún commit lo cierra.
- **Al terminar algo, se borra de aquí** en el mismo commit que lo termina. Este archivo no
  es un historial: lo hecho está en git.
- **Deuda técnica no se duplica.** Lo que se dejó a medias a propósito, con su porqué y su
  costo, vive en `docs/deuda-tecnica.md`; aquí basta una línea que apunte ahí si hay que
  priorizarlo.

---

## Bugs

- **El cron de publicación termina en 504 en cada corrida** (2026-10-04). Los logs de
  Vercel muestran `/api/cron/publish-social` cortado por `maxDuration` (240 s) en todas las
  corridas. No es el modelo de los borradores —cada uno tiene un tope de 20 s—; la causa no
  está aislada. Publicar corre primero y sale igual; lo que se arriesga es el sondeo de
  comentarios y el barrido de huérfanos. Empezar midiendo cuánto tarda cada fase
  (`publishDue`, `sondearComentarios`, `barrerHuerfanos`) en `src/app/api/cron/publish-social/route.ts`.
- **El motivo de un intento fallido que se va a reintentar no se ve en ningún lado**
  (2026-10-04). Un destino que falla y vuelve a `scheduled` guarda `lastError`, pero el panel
  solo lo muestra cuando el destino ya quedó en `failed` (`page.tsx`, `queue.tsx`). En la
  toma del video de TikTok eso escondió durante diez minutos el motivo real, y al final lo
  tapó otro. Mostrarlo en la tarjeta del calendario («reintentando: …»).
- **La Parrilla abierta pide decenas de páginas `/admin/schedule/<id>` cada pocos
  segundos** (2026-10-04). En los logs de Vercel, unas 60 peticiones por tanda, una por cada
  corte del calendario: parece el prefetch de los `Link` combinado con un refresco
  periódico. No rompe nada, pero gasta invocaciones y entierra los logs útiles.

## Configuración pendiente del dueño

- **[dueño] Borrar `COMENTARIOS_MODELO` en Vercel** (2026-10-04). Apunta a
  `inclusionai/ling-3.0-flash-fin-free`, que la pasarela ya no tiene: cada borrador de
  respuesta falla con `GatewayModelNotFoundError`. Sin la variable se usa el modelo por
  defecto (ver README, «Responder comentarios»). No requiere desplegar.

## Trámites con las plataformas

Plan completo y tiempos en `docs/levantamiento-terceros.md`; un guion por plataforma.

- **TikTok — auditoría de Direct Post: enviada el 2026-10-04, esperando respuesta.** Mientras
  no se apruebe, solo publican cuentas privadas en «Solo yo» y hay un cupo de 5 usuarios por
  día. Al aprobarse: lo que dice «Después de aprobar» en `docs/tiktok-revision-guion.md`, y
  la cuenta `vicente.pareja` puede volver a ser pública.
- **[dueño] Meta (Instagram y Facebook) — salir de modo desarrollo.** Primero la
  verificación de negocio (lo más lento), después el App Review por permiso con video.
  Guion y textos: `docs/meta-revision-guion.md`. La puerta para el revisor
  (`REVISION_CORREO`/`REVISION_CODIGO`) ya existe en el código.
- **[dueño] Google — verificación del OAuth y auditoría de cuota de YouTube**, en paralelo.
  Sin la primera, solo 100 test users y tokens de 7 días; sin la segunda, 10.000 unidades al
  día para todos y videos siempre privados. Guion: `docs/google-verificacion-guion.md`.
- **[dueño] Vercel Pro antes de abrir a terceros.** El plan Hobby es de uso personal y no
  comercial (`docs/levantamiento-terceros.md` §5).

## Lo que todavía depende de `vicente-pareja.cl`

`vicente-pareja.cl` queda como la página personal de Vicente; el producto vive en
`tu-parrilla.cl`. Desde el 2026-10-04 la app del teléfono apunta a `tu-parrilla.cl`
(`mobile/src/lib/config.ts`), pero el dominio viejo no se puede soltar todavía:

- **Las instalaciones que aún no recibieron la actualización** siguen llamando a
  `www.vicente-pareja.cl/api/mobile/*`. Una actualización OTA se aplica en la segunda
  apertura de la app; mientras haya teléfonos sin abrirla, ese dominio tiene que seguir
  sirviendo la API (hoy lo hace: es el mismo despliegue).
- **La media vive en `media-bucket.vicente-pareja.cl`** (el dominio propio del bucket de
  R2, `R2_PUBLIC_BASE`). Moverla a algo como `media.tu-parrilla.cl` pide: el dominio nuevo
  en R2, `R2_PUBLIC_BASE` en Vercel, verificarlo como *URL property* en las dos apps de
  TikTok (si no, `PULL_FROM_URL` falla), y decidir qué pasa con las URLs ya guardadas en la
  base, que apuntan al dominio viejo.
- **El panel también responde en `www.vicente-pareja.cl/admin`.** Meta ya solo acepta los
  retornos de OAuth de `tu-parrilla.cl` (2026-10-04), así que conectar Instagram o Facebook
  desde el dominio viejo falla. Redirigir `/admin` del dominio viejo al nuevo lo cerraría.

## Features y trabajo de código

- **Cupos y reparto de los crons por usuario** (`docs/levantamiento-terceros.md` §5.4). Hace
  falta cuando la beta pase de unos diez usuarios.
- **El privado de Meta (DM con el PDF)** necesita `instagram_manage_messages` y
  `pages_messaging` en una segunda vuelta de App Review (`docs/levantamiento-terceros.md`
  §2.2 y §7).
