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

- **Por revisar: seis consultas en paralelo contra la base no volvían nunca** (2026-10-05).
  El barrido de huérfanos leía seis columnas con un `Promise.all` y la lectura se colgaba en
  cada corrida —por eso el cron moría en 504—, sin bloqueos en `pg_stat_activity`. En serie
  las mismas seis tardan milisegundos, y así quedaron (`urlsReferenciadas`). Lo distintivo es
  que eran más consultas a la vez que conexiones en el pool (`max: 5` en `src/db/index.ts`),
  contra el pooler de Supabase en modo transacción. La causa no está explicada: cualquier
  otro `Promise.all` con más de cinco consultas podría colgarse igual.
- **La Parrilla abierta pide decenas de páginas `/admin/schedule/<id>` cada pocos
  segundos** (2026-10-04). En los logs de Vercel, unas 60 peticiones por tanda, una por cada
  corte del calendario: parece el prefetch de los `Link` combinado con un refresco
  periódico. No rompe nada, pero gasta invocaciones y entierra los logs útiles.

## Trámites con las plataformas

Plan completo y tiempos en `docs/levantamiento-terceros.md`; un guion por plataforma.

- **TikTok — auditoría de Direct Post aprobada** (avisado el 2026-10-06). Ya no hay cupo de 5
  usuarios por día y las cuentas públicas pueden publicar con la privacidad que elijan. En
  código queda quitar los avisos de «mientras TikTok no apruebe»: lo que dice «Después de
  aprobar» en `docs/tiktok-revision-guion.md` (el aviso de `AVISO_ANTES_DE_CONECTAR` en
  `src/lib/networks.ts` y su test, la nota de `schedule/tiktok-opciones.tsx` y las frases del
  README). **[dueño]** La cuenta `vicente.pareja` puede volver a ser pública.
- **[dueño] Meta (Instagram y Facebook) — salir de modo desarrollo.** Guion y textos:
  `docs/meta-revision-guion.md`; el paso a paso de trabajo vive en la carpeta
  «Meta - Verification» del escritorio de Vicente. Hecho el 2026-10-04: la app
  (1433211842004004) pasó del portafolio «Marca personal Vicente» al de **Pyxis spa**,
  verificado desde el 2026-07-30, así que la verificación de negocio ya está; la ficha
  básica (nombre «Tu Parrilla», ícono, privacidad, términos, borrado de datos) y el inicio
  de sesión (retornos de OAuth solo en `tu-parrilla.cl`, baja) quedaron configurados.
  El 2026-10-05 quedó grabado el video (`meta-app-review-demo.mp4`, 4:47, en esa carpeta,
  junto a `TEXTOS-FORMULARIO.txt` con los minutos de cada permiso), con la cuenta del
  revisor, @vicente_edits2 y la página Tu-Parrilla. El 2026-10-06 Pyxis pasó a
  «proveedor de tecnología» (irreversible: los usuarios conectan sus propias páginas, que
  viven en sus portafolios) y envió la **verificación de acceso** (Meta tarda unos cinco
  días hábiles). La solicitud del App Review quedó llena y sin enviar: 11 permisos (los 10
  del video y `public_profile`; se sacaron los de Threads, los de mensajes privados y las
  variantes `instagram_business_*`, que la app no pide), tratamiento de datos y
  credenciales del revisor. Falta: cuando aprueben el acceso, conectar de nuevo las
  cuentas del revisor y enviar.
- **[dueño] Política interna ante solicitudes de autoridades** (2026-10-06). En el App
  Review de Meta, Pyxis declaró revisar la legalidad de cada solicitud, poder impugnarla,
  entregar lo mínimo y documentarla. Que el abogado la deje por escrito, junto con la
  revisión de `/privacidad` y `/terminos`.
- **[dueño] Mientras Meta revisa: la beta con creadores reales** (2026-10-06). Mientras la
  app de Meta esté en modo desarrollo, solo conectan su Instagram o su Facebook las cuentas
  con un rol en la app, así que cada creador tiene que pasar dos puertas: la de Meta, como
  **evaluador** (developers → Roles de la app → Evaluador, con su cuenta de Facebook, y él
  acepta), y la de Tu Parrilla, invitado en **Los Maestros** con su correo. Con una sola no
  alcanza. No es requisito para la aprobación —a diferencia de los probadores de la Play
  Store—: sirve para tener creadores reales usando la app antes de que Meta responda. Cuando
  Meta apruebe, la lista deja de importar.
- **Meta, segunda vuelta: mensajes privados** (el privado con el enlace de la regla de
  palabra clave, `instagram_manage_messages` y `pages_messaging`) y, aparte, **Threads**
  (`threads_basic`, `threads_content_publish`). Se sacaron de la primera solicitud porque
  no salen en su video; cada una necesita su guion y su grabación. Ver
  `docs/levantamiento-terceros.md` §2.2 y §7.
- **[dueño] Google — verificación del OAuth y auditoría de cuota de YouTube**, en paralelo.
  Sin la primera, solo 100 test users y tokens de 7 días; sin la segunda, 10.000 unidades al
  día para todos y videos siempre privados. Guion: `docs/google-verificacion-guion.md`; el
  paso a paso de trabajo, en la carpeta «YouTube - Verification» del escritorio de Vicente
  (2026-10-06). La portada y las páginas legales ya cumplen lo que piden Google y YouTube.
  Hecho el 2026-10-06 (fases 1 a 3): el proyecto (`portafolio-page`, número 306430930448)
  tiene a pyxis.latam@gmail.com como dueña; `tu-parrilla.cl` está verificado en Search
  Console (registro TXT en Cloudflare: no borrarlo); la marca dice «Tu Parrilla», con Pyxis
  de contacto y solo `tu-parrilla.cl` autorizado; el cliente OAuth solo acepta
  `https://tu-parrilla.cl/api/social/youtube/callback`; y los permisos son exactamente
  `youtube.upload` y `youtube.force-ssl`. Falta: el canal de prueba del revisor, el video y
  enviar los dos trámites.
- **Por revisar: qué se borra al desconectar YouTube** (2026-10-06). Desconectar borra las
  credenciales y conserva el historial de métricas (`disconnectAccount`). Si la auditoría
  de cuota pide borrar también los datos de la API al revocar, hay que cambiar eso y
  `/privacidad`. Ver `docs/google-verificacion-guion.md`.
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

## Que todo quede a nombre de Pyxis

El producto es de Pyxis SpA, pero varias piezas siguen a nombre de Vicente como persona.
Nada de esto bloquea un trámite hoy; conviene ordenarlo antes de abrir a terceros.

- **[dueño] Que un abogado revise `/privacidad` y `/terminos`.** Desde el 2026-10-05 nombran
  a PYXIS SpA como responsable y describen el servicio tal como funciona hoy, pero los
  redactó Claude a partir del código, no alguien con criterio legal.
- **[dueño] El código.** Lo escribió Vicente; lo prolijo es cederlo o licenciarlo a Pyxis
  con un documento simple. Verlo con el contador o un abogado: es una decisión legal, no
  técnica.
- **[dueño] El dominio `tu-parrilla.cl`** registrado en NIC Chile a nombre de Pyxis.
- **[dueño] TikTok y Google con la misma entidad.** El formulario de Direct Post de TikTok
  dice «Tu Parrilla, built by Vicente Pareja Jones»; al pedir la verificación de Google
  conviene usar ya la razón social.

## Features y trabajo de código

- **Cupos y reparto de los crons por usuario** (`docs/levantamiento-terceros.md` §5.4). Hace
  falta cuando la beta pase de unos diez usuarios.
- **El privado de Meta (DM con el PDF)** necesita `instagram_manage_messages` y
  `pages_messaging` en una segunda vuelta de App Review (`docs/levantamiento-terceros.md`
  §2.2 y §7).
