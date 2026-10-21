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

- **Por revisar: el resto de la auditoría de la wiki de la UI** (2026-10-13). Al escribir
  `public/docs/ui/` salieron unos cuarenta defectos más —textos que nombran pantallas
  viejas, validaciones que dejan programar lo que va a fallar, números
  que no cuadran—, ordenados por gravedad en `docs/auditoria-wiki-ui-2026-10-13.md`. Al
  arreglar cada uno, corregir también la página de la wiki que lo cuenta.
- **Por revisar: seis consultas en paralelo contra la base no volvían nunca** (2026-10-05).
  El barrido de huérfanos leía seis columnas con un `Promise.all` y la lectura se colgaba en
  cada corrida —por eso el cron moría en 504—, sin bloqueos en `pg_stat_activity`. En serie
  las mismas seis tardan milisegundos, y así quedaron (`urlsReferenciadas`). Lo distintivo es
  que eran más consultas a la vez que conexiones en el pool (`max: 5` en `src/db/index.ts`),
  contra el pooler de Supabase en modo transacción. La causa no está explicada: cualquier
  otro `Promise.all` con más de cinco consultas podría colgarse igual. Desde el 2026-10-21 no
  queda ninguno que crezca con los datos: el conteo de enlaces del panel de páginas y el
  reordenamiento de enlaces, los dos que lanzaban una consulta por fila, son una sola; los
  `Promise.all` que siguen lanzan cuatro consultas como mucho.
- **Por revisar en el teléfono: la barra de pestañas de la app** (2026-10-16). En la versión
  web de la app, las etiquetas de las pestañas se ven cortadas por abajo; puede ser solo la
  web. Mirarlo en el teléfono, y si pasa ahí también, darle alto a la barra en
  `mobile/src/app/(tabs)/_layout.tsx`. Es el último defecto abierto de
  `docs/auditoria-ui-2026-10-16.md`.
- **Por revisar: miniaturas vencidas en La Mesa y en Tus publicaciones** (2026-10-16). Las
  dos dibujan `socialPosts.thumbnailUrl` tal cual (`comments/cola.tsx`,
  `analytics/publicaciones/post-table.tsx`), y esa URL se refresca solo con la
  sincronización diaria. Las de Instagram vencen: si una vence entre dos sincronizaciones,
  se ve el ícono de imagen rota. Se vio con datos de prueba, no en producción. Si pasa, la
  salida es que la imagen caiga al cuadro vacío que ya existe para las publicaciones sin
  miniatura.
- **La Parrilla abierta pide decenas de páginas `/admin/schedule/<id>` cada pocos
  segundos** (2026-10-04). En los logs de Vercel, unas 60 peticiones por tanda, una por cada
  corte del calendario: parece el prefetch de los `Link` combinado con un refresco
  periódico. No rompe nada, pero gasta invocaciones y entierra los logs útiles. El
  2026-10-13, con el calendario como vista de entrada, se apagó el prefetch de los enlaces
  al editor (calendario, lista y «Se quemó»); falta mirar en los logs si dejó de pasar y, si
  no, buscar el refresco.

## Seguridad

- **Quedan hallazgos abiertos de las auditorías de seguridad del 2026-10-14 y del
  2026-10-21.** El detalle no va acá: el repositorio es público, y escribir una
  vulnerabilidad sin arreglar es publicarla. Está en la carpeta privada del dueño,
  `tu-parrilla-privado`, fuera del repo; cada arreglo la cuenta en su propio PR, cuando ya
  está cerrada.

## Trámites con las plataformas

Plan completo y tiempos en `docs/levantamiento-terceros.md`; un guion por plataforma.

Lo que falta para abrir cada plataforma, de un vistazo (el detalle está en cada entrada, más
abajo): el **login con Instagram** sin página de Facebook y los **mensajes privados de
Instagram** (las dos en «Meta, segunda vuelta»), los permisos de Meta para **anuncios
pagados**, la **Play Store** (la pista interna ya existe; la tienda pública es otro trámite) y
el **App Store** de iPhone, las integraciones con **Threads** y con **X**, y **revisar qué
otros permisos hacen falta**, para pedirlos todos en una misma vuelta.

- **[dueño] TikTok: la cuenta `vicente.pareja` puede volver a ser pública** (2026-10-13). Se
  puso en privada para grabar la revisión de Direct Post, que ya está aprobada, y los avisos
  de «solo en privado» ya se quitaron del panel. Opcional, en el portal de TikTok: dejar en
  *Redirect URI* solo `https://tu-parrilla.cl/api/social/tiktok/callback` (las de
  `www.vicente-pareja.cl` y `portafolio-page-inky.vercel.app` ya no se usan para conectar).
- **[dueño] Meta (Instagram y Facebook): falta la verificación de acceso.** La app
  (1433211842004004) está en Live desde el 2026-10-19, con los 11 permisos del App Review
  aprobados con acceso avanzado, y `META_EN_REVISION` salió de Vercel ese mismo día: a un
  creador le basta la invitación en Los Maestros. Queda la **verificación de acceso** (Pyxis
  como proveedor de tecnología, enviada el 2026-10-06), «En revisión» al 2026-10-19. Meta pide
  tenerla antes del 18/12/2026 para no restringir la app; no hay nada que mandar, y si piden
  más información llega a la campana de developers.facebook.com y a pyxis.latam@gmail.com.

  Lo que se queda aunque la app esté en Live: el revisor (`revision@tu-parrilla.cl`) con sus
  cuentas conectadas, @vicente_edits2 y la página Tu-Parrilla, y `REVISION_CORREO` y
  `REVISION_CODIGO` en Vercel. Meta vuelve a revisar las apps aprobadas y pide que las
  credenciales de prueba sigan activas un año (README, «Dejar entrar al revisor de Meta»).
  Una cuenta de Instagram la conecta una sola persona en Tu Parrilla: para usar
  @vicente_edits2 en otra cuenta, primero hay que conectarle al revisor otro Instagram de
  prueba. El video y los textos de esta vuelta (`meta-app-review-demo.mp4`,
  `TEXTOS-FORMULARIO.txt`) están en la carpeta «Meta - Verification» del escritorio de
  Vicente, y sirven de molde para la segunda.
- **[dueño] Política interna ante solicitudes de autoridades** (2026-10-06). En el App
  Review de Meta, Pyxis declaró revisar la legalidad de cada solicitud, poder impugnarla,
  entregar lo mínimo y documentarla. Que el abogado la deje por escrito, junto con la
  revisión de `/privacidad` y `/terminos`.
- **Integración con Threads** (en «Próximamente» desde el 2026-10-19). Se apagó, junto con X,
  para que un usuario nuevo no se tope con algo que no funciona: Los Fierros dice
  «Próximamente» y nada deja programar ahí (README, «Conectar y sincronizar»). El código para
  publicar existe (`src/lib/social/publish/threads.ts`). Para abrirla: la segunda vuelta del App
  Review con `threads_basic` y `threads_content_publish` (la entrada «Meta, segunda vuelta», más
  abajo), su baja y su borrado (`docs/deuda-tecnica.md`, «Threads se queda fuera de la baja y
  del borrado de Meta»), sacarla de `REDES_PROXIMAMENTE` (`src/lib/networks.ts`) y volver a
  contar su conexión en `public/docs/ui/los-fierros.md`.
- **Integración con X** (en «Próximamente» desde el 2026-10-19). El código para publicar existe
  (`src/lib/social/publish/x.ts`), pero no publica: lo primero a mirar es el saldo, porque su
  API ya no tiene capa gratuita, y pagarla es decisión del **[dueño]**. Abrirla es lo mismo que
  con Threads: sacarla de `REDES_PROXIMAMENTE` y volver a contar su conexión en la wiki.
- **Meta: permisos para anuncios pagados** (2026-10-21). Hoy Tu Parrilla lee y publica lo
  orgánico; no ve ni toca anuncios. Para mostrar cómo les fue a los posts promocionados, o
  promocionar uno desde acá, hace falta la Marketing API: `ads_read` para leer resultados,
  `ads_management` si además se crean o se promocionan anuncios, y probablemente
  `business_management` para llegar a las cuentas publicitarias de un negocio. Cada permiso pide
  su video en un App Review, y el acceso estándar a la Marketing API se apoya en la verificación
  del negocio (la de Pyxis, en curso, más arriba). Antes del guion hay que decidir el alcance
  —solo leer, o también promocionar— y qué vería el creador.
- **Revisar qué otros permisos hacen falta** (2026-10-21). Una pasada red por red de lo que el
  producto necesita y todavía no pidió, antes de la próxima vuelta de cada revisión, para
  pedirlo todo de una vez y no volver a grabar. Lo que ya se sabe que falta: el login con
  Instagram y los mensajes privados (Meta, segunda vuelta), los anuncios (la entrada de arriba)
  y Threads. Por decidir si hacen falta: más métricas de las que se leen hoy (las historias de
  Instagram, las estadísticas del perfil de TikTok), responder comentarios de TikTok, y otro
  alcance de YouTube. Lo que ya se pidió, permiso por permiso, está en
  `docs/levantamiento-terceros.md` (§2.2 para Meta).
- **Meta, segunda vuelta: mensajes privados** (el privado con el enlace de la regla de
  palabra clave, `instagram_manage_messages` y `pages_messaging`) y, aparte, **Threads**
  (`threads_basic`, `threads_content_publish`). Se sacaron de la primera solicitud porque
  no salen en su video; cada una necesita su guion y su grabación. Ver
  `docs/levantamiento-terceros.md` §2.2 y §7.

  En la misma vuelta, **Instagram sin página de Facebook** (2026-10-19). La conexión de hoy es
  Instagram con login de Facebook, que encuentra el Instagram solo a través de una página que la
  persona administre: sin página enlazada, Meta no entrega ninguno, aunque se acepten todos los
  permisos. Probablemente es lo que trabó a la primera usuaria invitada, que conectó TikTok y no
  Instagram. Meta tiene otra vía, Instagram con login de Instagram (*Business Login for
  Instagram*: `instagram_business_basic`, `instagram_business_content_publish` y compañía, en
  `graph.instagram.com`), que no pide página; la cuenta profesional, sí. Cuesta un video más en
  esta vuelta y una conexión nueva en el código: otro token, que según Meta se renueva desde el
  servidor, y adaptar a él la publicación, la sincronización y los comentarios de Instagram. Los
  trial reels por esa vía, por confirmar. La idea: «Conectar con Instagram» como camino
  principal en Los Fierros, y el login de Facebook para quien además maneja páginas.
- **[dueño] Google — auditoría de cuota de YouTube (trámite B): enviada el 2026-10-10,
  esperando respuesta.** YouTube acusó recibo por correo a pyxis.latam@gmail.com, sin número
  de caso; suele tardar semanas. Se pidieron 100.000 unidades al día del cupo general (el
  cálculo está en el guion) y ningún aumento del cupo de subidas. Lo enviado está al final
  de `TEXTOS-FORMULARIO.txt`, sección por sección, y la evidencia en `evidencia/`, en la
  misma carpeta. Antes de enviar se corrigió lo que las políticas de YouTube prohíben (#157;
  ver «Lo que la auditoría mira de los datos guardados» en el guion). Quedaron sin
  confirmar tres cosas de lo enviado: si se marcó «Analytics & Reporting» (se recomendó,
  pero la captura nueva de Los Cortes que pide esa opción no se llegó a hacer); si el cupo
  de `videos.insert` quedó en 100 (un borrador lo tenía en 1000), y si «Pyxis oficial» se
  reconectó al usuario revisor antes de enviar. Si la respuesta toca alguna, se aclara en el
  mismo hilo. **Mientras tanto:** que «Pyxis oficial» esté conectado al usuario revisor
  (las instrucciones de acceso lo dan por conectado; verificarlo en Los Fierros entrando
  como `revision@tu-parrilla.cl`) y que haya algún comentario pendiente en La Mesa (los de
  YouTube se borran a los 30 días). Contestar siempre en el mismo hilo del correo. Al
  aprobarse, ver «Después de aprobar» en el guion.
- **Por revisar: qué se borra al desconectar YouTube** (2026-10-06). Desconectar borra las
  credenciales y el canal deja de leerse; lo guardado se borra solo a los 30 días
  (`retencion-youtube`). Si la auditoría de cuota pide borrarlo en el acto, hay que cambiar
  `disconnectAccount` y `/privacidad`. Ver `docs/google-verificacion-guion.md`.
- **[dueño] Vercel Pro antes de abrir a terceros.** El plan Hobby es de uso personal y no
  comercial (`docs/levantamiento-terceros.md` §5).
- **[dueño] La app en la Play Store, pista de pruebas internas** (2026-10-16). La cuenta de
  Play Console (personal) y la app existen: está como «Parrilla», `cl.tuparrilla.app`, en
  borrador. El binario está listo, `tu-parrilla-1.1.0-2.aab` (versión 1.1.0, código 2,
  salido de `a6bd08f`; nada nativo cambió después, y lo demás le llega por aire en el canal
  `production`). La versión interna con ese `.aab` se publicó el 2026-10-17, «Tu Parrilla
  (Alfa)», sin revisar: hasta que Google revise la app, la tienda se la muestra a los
  probadores como «cl.tuparrilla.app (unreviewed)». Falta, en la consola, lo que pide esa
  revisión —el nombre «Tu Parrilla» y la ficha, y las tarjetas de Contenido de la app—, y en
  el teléfono, unirse como probador e instalarla. Para que lo siguiente salga sin entrar a la
  consola: la cuenta de servicio con
  su clave JSON para EAS (nunca en un chat ni en el repo) y el secreto `EXPO_TOKEN` en
  GitHub, que el flujo «App a la tienda» necesita y todavía no está. El paso a paso y los
  textos, en la carpeta «Google Play» del escritorio de Vicente; el porqué, en
  `docs/play-store.md`. La tienda pública es otro trámite: una cuenta personal nueva
  necesita una prueba cerrada con doce probadores durante catorce días.
- **[dueño] La app en iPhone** (2026-10-16). El código ya está listo para iOS; faltan la
  cuenta del Apple Developer Program, confirmar el identificador `cl.tuparrilla.app`
  (queda fijo al registrarlo), la ficha en App Store Connect y el primer build a
  TestFlight. Pasos y comandos en `mobile/README.md`, «iPhone (iOS)».

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
- **El AM de Vicente** (el repositorio privado `marca-personal`) programa y lee números en
  `https://www.vicente-pareja.cl/api/…`: sus tres constantes `API`
  (`pipeline/cortos/programar.py`, `pipeline/cortos/metricas.py` y
  `pipeline/evento/programar.py`). Se cambian a `tu-parrilla.cl` junto con su llave propia
  (ver «Pasar el agente del admin a una llave propia», en «Features y trabajo de código»).

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
- **[dueño] La app del teléfono en Expo** (2026-10-16). El proyecto (`vicente-numeros`)
  está en la cuenta personal `vicentepareja`, y la de Pyxis (`pyxis-team`) no tiene acceso:
  para publicar una actualización hay que entrar con la personal. Se puede traspasar en
  expo.dev (*Project settings → General → Transfer project*), pero antes: agregar al
  usuario `vicentepareja` como administrador de `pyxis-team` (Expo exige mandar en las dos
  cuentas) y **bajar el respaldo de la llave de firma de Android** desde *Credentials*,
  porque la documentación no dice si viaja con el traspaso y sin ella la Play Store no
  acepta más versiones. Después, `owner` en `mobile/app.json` y los enlaces de
  `mobile/README.md`. La cuenta de Apple para iPhone conviene sacarla ya a nombre de Pyxis.

## Features y trabajo de código

- **El chef de la casa** (2026-10-19). Un agente nuestro, levemente personalizado por cliente,
  que recibe el material crudo —la res entera de noche, el atún entero de día—, lo despieza en
  clips y los deja en la parrilla de cada cliente para que los apruebe. Es un servicio pagado, y
  convive con el chef propio de cada uno en Tu IA. Nada está implementado: espera el servidor,
  que el **[dueño]** está configurando; la lista de lo que necesita está en el diseño, junto con
  las fases y las preguntas abiertas: `docs/superpowers/specs/2026-10-19-chef-de-la-casa-design.md`.
- **El modo día con sushi** (2026-10-18). Pedido del dueño, para el público que la estética de
  asado deja fuera. Están hechas las cuatro tandas: el panel, sus motivos, la app del teléfono y
  la portada. El diseño está en `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`.
  Falta:
  - mirar de día los gráficos en Safari y en Firefox: en Chrome, recharts toma las variables
    del modo; si otro navegador no, saldrían con el color por defecto de cada atributo;
  - lo nativo de la app, que sigue de noche en los dos modos (ver `docs/deuda-tecnica.md`, «Lo
    nativo de la app no cambia de modo»).
- **Llevar el resto de la interfaz al nivel del corte** (2026-10-16). La auditoría de ese
  día propone seis tandas que se publican solas. La primera, lo roto, ya está. Quedan: el
  corte en los flujos (el compositor, la parrilla fría y la carga tibia ya están; faltan La
  Mesa como conversación y las cuentas del editor de un post como fichas, que siguen siendo
  casillas); la carne que se asa al ritmo de cada etapa de
  la publicación (toca el publicador); Los Números con brasas donde se mide calor; la puerta
  de entrada (la portada ya está; faltan el código en casillas, y el error y el 404); y lo
  nativo de la app. Detalle y tiempos a ojo en
  `docs/auditoria-ui-2026-10-16.md`.
- **El rediseño de la app del teléfono, partes 3 y 4** (2026-10-16). Las partes 1 y 2
  dejaron las tres pestañas del panel, «Reprogramar» en «Se quemó» y los borradores
  compartidos con el panel. Faltan: (3) La Mesa como cuarta pestaña, para leer y responder
  comentarios; (4) TikTok desde Publicar —exige mostrar los datos de la cuenta
  (`creator_info`) antes de publicar—, y Threads y X cuando salgan de «Próximamente»; y con eso
  la palabra clave: hoy un borrador
  con TikTok o con palabra clave se edita en el teléfono pero se programa en el panel
  (`soloEnElPanel` en `src/lib/borrador.ts`). El nombre y el ícono «Tu Parrilla» ya están en
  `mobile/app.json`, con el identificador `cl.tuparrilla.app`: llegan con el primer build de
  la Play Store, no por aire. Cuando ninguna
  instalación vieja las pida, salen `/api/mobile/overview` y `/api/mobile/schedule/check`,
  que la app nueva ya no usa.

- **La propuesta de diseño 2.1: lo que falta** (2026-10-16). De la propuesta externa del 16
  de octubre (no está en el repo) entró el corte dibujado
  (`docs/superpowers/specs/2026-10-16-el-corte-que-se-lee-design.md`), el texto secundario y
  tenue a 4,5:1, el botón de Ajustes que avisa cuando un fierro se enfría y Ajustes en la app.
  Quedan, de lo más barato a lo más caro: «Mientras no mirabas» —qué cambió desde la última visita, con lo que pasa una sola
  vez: el sellado de una marca y el chisporroteo— (necesita guardar la última visita por
  usuario); la semana como días × franjas, con las zonas calientes de cada creador (necesita
  decidir las franjas y qué mide una zona); el cierre del domingo («Aplauso para el
  asador»); las familias de cuentas, con su subíndice (TikTok₁, TikTok₂) y el corte
  trinchado (necesita tabla nueva y decidir si una familia admite dos cuentas de la misma
  red); un archivo de tokens común para el panel y la app; y, con un build nativo, el corte
  en SVG y la vibración en la app.
- **Cupos y reparto de los crons por usuario** (`docs/levantamiento-terceros.md` §5.4). Hace
  falta cuando la beta pase de unos diez usuarios.
- **El privado de Meta (DM con el PDF)** necesita `instagram_manage_messages` y
  `pages_messaging` en una segunda vuelta de App Review (`docs/levantamiento-terceros.md`
  §2.2 y §7).
- **El privado con botón, y la guía solo para seguidores** (2026-10-15). En vez de mandar
  el PDF de una en el privado, mandar un botón: «¿Quieres que te mande la guía?». Al
  apretarlo, la guía llega solo si la persona sigue la cuenta; si no, recibe «Esta guía es
  solo para mis seguidores, sígueme: @cuenta» con un botón «Ya te seguí» que vuelve a
  revisar. Pedir el follow es un interruptor de cada regla de palabra clave (una columna
  booleana en `reglas_clave`): apagado, el botón entrega la guía sin mirar. Depende del
  privado de la entrada anterior y de sus mismos permisos. Por confirmar al hacerlo: que
  la API de mensajes de Instagram diga si quien escribe sigue la cuenta (su perfil trae
  `is_user_follow_business`); que en Facebook no hay equivalente; y que el toque del botón
  llega por webhook, no por el sondeo con que hoy se leen los comentarios. El privado de
  hoy está en `src/lib/social/comentarios/privado.ts`.
- **YouTube: la historia y el arrastre de las cuentas propias** (2026-10-10). Para cumplir
  las políticas de YouTube (PR #157), todo dato suyo se borra a los 30 días sin refrescar
  y sus filas van sin lo ganado ni arrastre, para todos los usuarios. Es un parche para
  pasar la auditoría: Vicente quiere que sus propias cuentas guarden la historia completa,
  como antes, y que el plazo de 30 días valga solo para los demás usuarios. Ojo al
  hacerlo: las políticas valen para todo dato que pase por el proyecto de API, sea de
  quien sea el canal, así que una excepción por usuario con el mismo proyecto seguiría
  siendo un incumplimiento, y una reauditoría puede verlo. Lo que sí calza:
  (1) **leer las estadísticas con el token OAuth del dueño** en vez de la API key: leídas
  así son datos autorizados, que se pueden guardar mientras él siga autorizando (hay que
  revisarlo cada 30 días); vale para el canal propio y para cualquier usuario, y devuelve
  la historia, pero no lo ganado ni el arrastre; (2) **pedir el permiso de analítica de
  §III.L**, una vez aprobada la primera auditoría, que además devuelve lo ganado y el
  arrastre, lo que vende la portada. Se afloja en `src/lib/social/politica-youtube.ts` y
  `retencion-youtube.ts`. Ver `docs/google-verificacion-guion.md`, «Lo que la auditoría
  mira de los datos guardados».
- **[dueño] Pasar el agente del admin a una llave propia y retirar `SCHEDULE_API_KEY`**
  (2026-10-13). Desde que cada usuario genera sus llaves en el panel (hoy en Tu IA), la del
  despliegue solo sigue para no romper al agente que ya la usa. Pasos: generar una llave en Tu IA,
  ponerla en ese agente y, cuando ande, borrar la variable en Vercel. En código no hay nada
  que hacer: sin la variable, la API ya acepta solo las llaves de usuario. Ese agente es el AM
  de `marca-personal`, y en el mismo cambio conviene ponerle al día su `docs/parrilla.md`, que
  describe la API de antes: dice que TikTok va por Buffer (hoy publica directo), que la API no
  evita duplicados (hoy está `ref`), nombra Threads y X entre las redes que publican (hoy en
  «Próximamente») y no conoce `/api/schedule/resumen` ni `/api/metrics/mejores`.
- **Por decidir: que el admin pueda cortar las llaves de otro usuario** (2026-10-13). Hoy
  solo el dueño de una llave la revoca, y «Cerrar sesiones» en Los Maestros no las toca (son
  credenciales aparte, y cortarlas en silencio rompería su agente). Si una se filtra y el
  usuario no responde, el admin no tiene cómo cortarla sin tocar la base. Opciones: que
  «Cerrar sesiones» también las borre, o una lista de llaves por usuario en Los Maestros.
- **Por decidir: que los avisos lleguen a quien lleva el calendario** (2026-10-17). El correo
  de una cuenta caída, el de un post quemado y el resumen del día van al correo del dueño de
  las cuentas. Si el calendario lo lleva otra persona con la llave del dueño —un agente que
  programa por la API—, por correo no le llega nada; lo lee en `GET /api/schedule/resumen`.
  Si hace falta que le llegue por correo, la salida es un campo «Avisos a» en Tu Cuenta, un
  correo por usuario, que lean `destinatario` (`src/lib/social/publish/alert.ts`) y
  `enviarResumenes` (`src/lib/avisos/run.ts`) en vez del correo del dueño.
