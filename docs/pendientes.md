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

- **En local no se puede entrar al panel sin Resend** (2026-10-13). `pedir()`
  (`src/lib/usuarios.ts`) imprime el código en la consola del servidor justo para probar el
  ingreso en local, pero si el correo no sale borra la fila del código, así que el código
  impreso nunca sirve. Mientras tanto, en local se entra con `REVISION_CORREO` y
  `REVISION_CODIGO`. El arreglo es no borrar la fila fuera de producción.
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
  otro `Promise.all` con más de cinco consultas podría colgarse igual.
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

- **Quedan hallazgos abiertos de la auditoría de seguridad del 2026-10-14.** El detalle no
  va acá: el repositorio es público, y escribir una vulnerabilidad sin arreglar es
  publicarla. Está en la carpeta privada del dueño, `tu-parrilla-privado`, fuera del repo;
  cada arreglo la cuenta en su propio PR, cuando ya está cerrada.

## Trámites con las plataformas

Plan completo y tiempos en `docs/levantamiento-terceros.md`; un guion por plataforma.

- **[dueño] TikTok: la cuenta `vicente.pareja` puede volver a ser pública** (2026-10-13). Se
  puso en privada para grabar la revisión de Direct Post, que ya está aprobada, y los avisos
  de «solo en privado» ya se quitaron del panel. Opcional, en el portal de TikTok: dejar en
  *Redirect URI* solo `https://tu-parrilla.cl/api/social/tiktok/callback` (las de
  `www.vicente-pareja.cl` y `portafolio-page-inky.vercel.app` ya no se usan para conectar).
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
  días hábiles). El mismo día se **envió el App Review**: 11 permisos (los 10 del video y
  `public_profile`; se sacaron los de Threads, los de mensajes privados y las variantes
  `instagram_business_*`, que la app no pide), tratamiento de datos y credenciales del
  revisor. Visto el 2026-10-16: la verificación de acceso sigue «En revisión» (ya pasada de
  los cinco días) y el App Review, «Revisión en curso» (Meta dice que la mayoría se revisa
  en 20 días, o más si pide información). Mientras dure, el revisor puede entrar en
  cualquier momento: no desconectar sus cuentas (@vicente_edits2 y la página Tu-Parrilla,
  en `revision@tu-parrilla.cl`), dejar `REVISION_CORREO`, `REVISION_CODIGO` y
  `META_EN_REVISION` en Vercel, y no cambiar el ícono ni la URL de privacidad de la app en
  Meta, que también se revisan. Las alertas llegan a la campana de developers.facebook.com
  y a pyxis.latam@gmail.com.
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
  comentarios; (4) TikTok, Threads y X desde Publicar —TikTok exige mostrar los datos de la
  cuenta (`creator_info`) antes de publicar—, y con eso la palabra clave: hoy un borrador
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
  (2026-10-13). Desde que cada usuario genera sus llaves en Tu Cuenta, la del despliegue
  solo sigue para no romper al agente que ya la usa. Pasos: generar una llave en Tu Cuenta,
  ponerla en ese agente y, cuando ande, borrar la variable en Vercel. En código no hay nada
  que hacer: sin la variable, la API ya acepta solo las llaves de usuario.
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
