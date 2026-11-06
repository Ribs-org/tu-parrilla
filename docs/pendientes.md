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

## Lo primero

Lo que el dueño marcó como lo más prioritario de toda la lista. Va antes que cualquier otra
sección.

- **Integrar al chef en la parrilla: La Cocina** (pedido el 2026-10-21, diseñado el
  2026-10-22). El chef es el editor del dueño: el pipeline de `marca-personal`, que corre en un
  servidor propio. Cada usuario tiene su fábrica de creativos dentro de Tu Parrilla:
  - sube el material crudo y lo que lo acompaña, cada cosa con su tipo y su dibujo;
  - elige sus estilos, que salen del catálogo del chef, y los prueba con un clip;
  - recibe los creativos en el mesón (de día, la bandeja), con sus textos y sus atributos, y los
    programa.

  El diseño está en `docs/superpowers/specs/2026-10-22-la-cocina-design.md`, y reemplaza a «El chef
  de la casa». Trae los nueve puntos del líder de creación de contenido, las fases de la 0 a la 3 y
  las decisiones del dueño del 2026-10-22, y el feedback del equipo de creación de contenido de ese
  mismo día, que entró entero.

  - **Ya existe** (2026-10-22): qué cuenta acepta trial reels, y de la fase 0:
    - la base, que son las tablas y la API del chef, con su contrato en `docs/cocina-api.md`;
    - la subida por partes del panel;
    - la pestaña La Cocina en lugar de Tu IA, con el seguimiento de las comandas y su
      cancelación, y el interruptor de cada cuenta en Los Maestros;
    - pedir desde el panel: el formulario con la subida por partes, la marca básica y el dibujo de
      cada insumo;
    - el mesón: programar por un borrador, con la portada, los atributos y el título de YouTube, y
      descartar con motivo;
    - los barridos de 14 días (lo crudo) y de 30 (lo que nadie programó), con su aviso en el
      resumen del día.

    Con eso está la fase 0 entera. Y desde el 2026-11-02, la cámara de frío (la bodega): el material
    en bruto se guarda sin pedir comanda, no vence, tiene una cuota de 20 GB por usuario, y la
    comanda elige de ahí (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`).
  - **Lo siguiente, la fase 1:**
    - las preguntas del chef con plazo y opción por defecto;
    - el probador («Prueba tus estilos», las comandas de tipo `prueba`);
    - el `reestilo` («Otros estilos con el mismo material»).

    El diseño dice qué trae cada una.
  - **El correo de la comanda no se reintenta si Resend falla** (2026-11-02). El de lista,
    rechazada o fallida ya sale, uno por cambio; falta marcarlo enviado para reintentarlo sin
    arriesgar un segundo. Pide una migración: el detalle, en `docs/deuda-tecnica.md`, «El correo
    de la comanda no se reintenta».
  - **Los avisos de la cocina que faltan** (2026-11-02): el correo cuando el chef pregunta llega
    con las preguntas de la fase 1, y el de un creativo del mesón por borrarse sigue solo en el
    resumen del día («Avisos», en el diseño).
  - **[dueño] Probar una vez la subida por partes contra el almacén de verdad** (2026-10-22). La
    cocina del dueño ya está encendida: en La Cocina → «La cámara de frío», guardar un video de más
    de 64 MB, para que vaya en varias partes, y después sacarlo. El 2026-11-02 se probó de punta a
    punta en un navegador contra S3Mock, un almacén compatible con S3 en Docker (`R2_ENDPOINT`), con
    un archivo de 150 MB en tres partes; lo que no se pudo ver es si el CORS del bucket de R2 deja
    pasar los PUT de las partes y si R2 contesta `ListParts` igual. Si falla, la frase del error lo
    dice en la tarjeta del archivo.
  - **[dueño] Dónde vive el material de la cámara de frío: R2 o tu Google Drive** (2026-11-02). Hoy
    va a R2, como el resto de la media. 20 GB por usuario pasa los 10 GB gratis de R2 para todo el
    bucket: cada GB de más cuesta unos US$0,015 al mes (diez usuarios llenos, unos 200 GB, son unos
    US$3 al mes; R2 no cobra la bajada). Lo que hay que decidir: si se queda en R2 y se cobra en el
    plan, o si va al Drive del dueño —que pide su API, el OAuth y una cuenta con espacio, y que el
    chef baje de ahí, cuando Drive era justo el cuello de botella que La Cocina sacó del camino
    («Todo en el almacén de Tu Parrilla, no en Drive», en el diseño de La Cocina)—. También, cuánto
    le toca a cada plan: hoy la cuota se cambia a mano en Los Maestros (`users.bodega_bytes`).
  - **[dueño] Decidir juntas la aprobación de lo que propone el chef (#283) y el aviso de la
    entrega (#284)** (2026-11-03). #283 pide que el chef proponga estados y entregas y que una
    persona del equipo los apruebe desde Tu Parrilla: una tabla de propuestas, sus endpoints y una
    vista en el panel. De #284 ya sale el correo de lista (#295); faltan el de la primera vez que
    pasa a `sirviendo`, la animación de entrega (una vez por entrega), un asunto opcional y poder
    apagarlo. Van juntas porque, con aprobación, el aviso sale al aprobar y no al proponer.
  - **Del equipo de contenido:** el cliente del chef en `marca-personal`, contra
    `docs/cocina-api.md`.

## Bugs

- **En el panel a ancho de teléfono, la pieza que se elige en la cámara de frío vuela fuera de
  la pantalla** (2026-11-02, se vio al probar #296). A ese ancho el riel de la comanda queda
  debajo de la grilla, y la animación de salida apunta a él aunque no se vea. No rompe nada: la
  pieza queda elegida. Se podría apuntar el vuelo al borde visible, o mostrar el riel fijo abajo.

- **En la app, la entraña de un video se lee como una longaniza** (2026-10-26, lo vio el dueño
  al publicar un video desde el teléfono). El formato llega bien del servidor (`entrana`);
  el problema es el dibujo. Sin `react-native-svg`, `mobile/src/components/pieza.tsx` arma
  cada silueta con vistas de bordes redondeados, y la entraña queda como una barra larga y
  angosta (62 × 14), casi la forma del chori. Lo de fondo es la tanda 6 de
  `docs/auditoria-ui-2026-10-16.md`: `react-native-svg` en el próximo build nativo, con las
  curvas del panel. Mientras tanto, se puede retocar la silueta por aire (más ancha, con un
  extremo afinado o las vetas más marcadas) para que no se confunda.
- **Instagram oculta el comentario que es solo la palabra clave, y ninguna app lo recibe**
  (2026-11-03; antes «no entrega los comentarios de @vicente_edits2», 2026-10-30). En una foto de
  @vicente.ingeniero que decía «Comment GUIA and I'll send you the guide», los comentarios `GUIA`
  y `Guia`, de dos cuentas distintas, se cuentan en `comments_count` pero solo los ve quien los
  escribió. La dueña de la cuenta no los ve en la app, ni aparece «View hidden comments» para
  mostrarlos, y `/comments` no los devuelve. En la misma foto, «Hola, dame la GUIA??» y «Holaa, aun
  la necesito» se ven y llegan, y el `GUIA` suelto sí llegó en una publicación que no lo pedía. No
  es Tu Parrilla, ni la API, ni algo que arreglen los webhooks: la API entrega lo mismo que ve la
  dueña. Los usuarios de ManyChat reportan lo mismo desde 2024 («video», «ebooks», «YES»), y ni
  Meta ni los proveedores lo explican. El informe completo, con fuentes, está en la carpeta de
  Meta del escritorio del dueño, «reports/Comentarios de palabra clave en Instagram.md».
  Pendiente:
  - una prueba de dos minutos: apagar «Hide comments» y «Advanced comment filtering» en Hidden
    Words y comentar `GUIA` solo desde una cuenta nueva en la publicación. Si la dueña lo ve, es
    el filtro de spam, que se apaga, y el panel debería decírselo al creador. Si no, es un filtro
    de Instagram que nadie controla;
  - en el producto: que la ayuda de la regla le pida al creador que pida la palabra dentro de una
    frase o una palabra distinta por publicación, y que La Mesa avise cuando Instagram cuenta
    comentarios que no entrega;
  - los webhooks de comentarios, por velocidad y cupo, no por esto: piden `pages_manage_metadata`,
    que hoy no se pide.
- **Por revisar: en qué orden entrega Instagram los comentarios** (2026-10-30). El comentario de
  `src/lib/social/comentarios/instagram.ts` dice que el borde va del más viejo al más nuevo, y la
  referencia de Meta dice lo contrario: «Returns results in reverse chronological order by
  default». No rompe la lectura, que recorre hasta cinco páginas igual, pero uno de los dos
  miente: mirarlo con una publicación de muchos comentarios y corregir el comentario si hace falta.
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
- **[dueño] Probar una vez lo de la revisión de deuda técnica del 2026-10-21 que no se pudo
  probar en un navegador.** En el panel: agregar un video en el editor de un post
  programado, que ahora sube directo al almacén (#231). En el teléfono, después de la
  actualización por aire: que «Cerrar sesión» vuelva a la entrada sin que «atrás» lleve a
  ninguna pantalla de la cuenta (`Alert` no se dibuja en la versión web).
- **[dueño] Probar dos cosas recién hechas que solo se ven con cuentas reales** (2026-10-24):
  responder un comentario directo en la app de Instagram y ver que, a los cinco minutos, sale
  de «Pendientes» y queda en «Enviados» como «Respondido desde Instagram: …» (#273); y publicar
  un video en TikTok con «Hecho con IA» encendido y ver que TikTok le pone la etiqueta (#272).
- **[dueño] Probar «Música de TikTok» con una cuenta real** (2026-11-06): programar fotos a
  TikTok con el interruptor encendido y ver que salen con una canción y que se puede cambiar en
  la app; y que el interruptor nace encendido la próxima vez en esa cuenta (#320). Lo que TikTok
  haga con `auto_add_music` solo se ve publicando: los tests miran lo que se le manda.
- **[dueño] Probar «Música de Instagram» con una cuenta real conectada con Facebook**
  (2026-11-06, #320). Nada de la Audio API de Meta se pudo probar contra Meta: el código sigue la
  documentación y los tests miran lo que se le pide y lo que se lee. Hay que comprobar:
  - que «Elegir canción» muestre lo que está sonando en Chile (sin `search_query`) y que buscar
    traiga resultados; si sale vacío o con «Instagram no dejó ver su música…», mirar en los logs
    de Vercel el cuerpo de «Instagram música:» —puede faltar un permiso, o que la lista pida
    `ig_user_id` en vez de `user_id` (el error 9050 de la tabla de Meta habla de los dos)—;
  - los nombres de los campos de la respuesta (`audio_id`, `title`, `display_artist`,
    `duration_in_ms`, `download_url`, la carátula como `cover_artwork_thumbnail_uri` en la búsqueda
    y `..._url` en una sola): se leen los dos y también `id` y `data` por si acaso
    (`social/instagram-audio.ts`);
  - que la muestra (`download_url`) suene en el navegador y, en el teléfono, que en la 1.1.0 se
    abra afuera y en una build con `expo-audio` suene ahí mismo;
  - que un reel programado con una canción salga con ella, y que los dos volúmenes se noten (una
    prueba con la canción al 30 % sobre un video con voz);
  - qué contesta Meta si la canción ya no está: el publicador lo da por definitivo solo si el
    rechazo nombra el audio (`motivoDeRechazoDeMusica`, en `publish/instagram.ts`); si Meta
    contesta otra cosa, ajustar esa lectura;
  - que la sincronización siga leyendo ese reel: Meta ya no manda `media_url` en un video con
    música con derechos (2026-07-30); la miniatura sale de `thumbnail_url` y no se usa `media_url`
    en ningún otro lado, pero hay que verlo con uno de verdad.
- **«Música de Instagram» no se cambia en lo ya programado** (2026-11-06). Como el trial reel, el
  editor del panel y el del teléfono no tocan las opciones de un destino: para cambiar o quitar la
  canción hay que borrar el post y programarlo de nuevo, y si Meta la rechaza, igual. Si se usa
  mucho, sumar «Quitar la música» al editor (`editarPostProgramado` recibiría las opciones de
  Instagram de cada destino pendiente).
- **La cola de #234 (copiar los videos del lote en segundo plano) no se hace por ahora**
  (2026-10-21). Los otros issues de ese envío ya están: bajar en paralelo (#235), cuánto tardó
  y por qué falló cada fila (#238), una sola descarga por URL en un lote (#236) y
  `POST /api/media` para subir un video una vez sin Drive (#237). Con eso, la cola deja de
  hacer falta para ese caso; si vuelve a pedirse, es la de `docs/deuda-tecnica.md` («Publicar
  dentro del cron…»).
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
  está cerrada. **[dueño]** Algunos no se cierran con código sino desde los paneles de Vercel
  y de GitHub: los pasos están en el archivo de la auditoría del 2026-10-21, en «Lo que hace
  el dueño».
- **[dueño] Encender «Require a pull request before merging» en la protección de `main`**
  (2026-10-21). Hoy son obligatorias las comprobaciones `sitio` y `app` y que la rama esté al
  día, pero no el pull request (README, «Cómo entra un cambio»). Con cero aprobaciones
  pedidas, para que el dueño siga fusionando solo.
- **[dueño] Probar una vez que un respaldo se restaura** (2026-10-21). Desde el 2026-10-21 el
  flujo revisa el índice de cada volcado, pero nadie restauró uno entero todavía. Bajar el de
  un día, descifrarlo con la llave y restaurarlo en una Postgres desechable (README,
  «Respaldos»). Sin la llave privada los respaldos no se abren: que siga guardada en más de un
  lugar.

- **[dueño] Renovar el token del libro de sugerencias antes de noviembre de 2027** (anotado el
  2026-11-02). `SUGERENCIAS_GITHUB_TOKEN` está en Vercel (production) desde el 2026-11-02: un
  token *fine-grained* de `Ribs-org`, solo para `Ribs-org/tu-parrilla`, con «Issues: Read and
  write», que vence al año. Vencido, lo que la gente escribe se guarda pero deja de llegar a
  GitHub, sin aviso. Para renovarlo: «Regenerate token» en github.com/settings/personal-access-tokens,
  reemplazar el valor en Vercel y redesplegar; lo que se juntó mientras tanto sale solo en la
  sincronización diaria siguiente (README, «El libro de sugerencias»).

## Trámites con las plataformas

Plan completo y tiempos en `docs/levantamiento-terceros.md`; un guion por plataforma.

Lo que falta para abrir cada plataforma, de un vistazo (el detalle está en cada entrada, más
abajo): los **mensajes privados de Instagram** (en «Meta, segunda vuelta»), el **login con
Instagram** sin página de Facebook (hecho y cerrado, espera una tercera vuelta), los permisos de Meta para
**leer y promocionar anuncios** (construido, espera la tercera vuelta), la **Play Store** (la pista interna ya existe; la tienda pública es otro trámite) y
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
  Una cuenta de Instagram la tiene una sola persona en Tu Parrilla: para usar @vicente_edits2 en
  otra cuenta, primero hay que dejarle al revisor otro Instagram de prueba, conectándolo o
  traspasándolo en Los Maestros. El video y los textos de esta vuelta (`meta-app-review-demo.mp4`,
  `TEXTOS-FORMULARIO.txt`) están en la carpeta «Meta - Verification» del escritorio de
  Vicente, y sirven de molde para la segunda.
- **[dueño] Política interna ante solicitudes de autoridades** (2026-10-06). En el App
  Review de Meta, Pyxis declaró revisar la legalidad de cada solicitud, poder impugnarla,
  entregar lo mínimo y documentarla. Que el abogado la deje por escrito, junto con la
  revisión de `/privacidad` y `/terminos`.
- **Integración con Threads** (en «Próximamente» desde el 2026-10-19). Se apagó, junto con X,
  para que un usuario nuevo no se tope con algo que no funciona: Los Fierros dice
  «Próximamente» y nada deja programar ahí (README, «Conectar y sincronizar»). El código para
  publicar existe (`src/lib/social/publish/threads.ts`), y desde el 2026-10-27 también su baja y
  su borrado. Para grabar la revisión, `THREADS_ABIERTO_PARA=<id del revisor>` la abre solo para
  esa cuenta. **[dueño]** En el caso de uso de Threads de la app de Meta, poner
  *Uninstall callback URL* `https://tu-parrilla.cl/api/social/threads/baja` y *Delete callback
  URL* `https://tu-parrilla.cl/api/social/threads/borrado`. Para abrirla a todos: la aprobación
  de `threads_basic` y `threads_content_publish` (la entrada «Meta, segunda vuelta», más abajo),
  sacarla de `REDES_PROXIMAMENTE` (`src/lib/networks.ts`) y volver a contar su conexión en
  `public/docs/ui/los-fierros.md`. Las métricas de Threads en Los Números y sus respuestas
  en La Mesa ya tienen código, apagado tras `THREADS_PERMISOS_EXTRA`: lo que falta para
  encenderlas está en la entrada «Threads: números en Los Números…», más abajo.
- **Integración con X** (en «Próximamente» desde el 2026-10-19). El código para publicar existe
  (`src/lib/social/publish/x.ts`), pero no publica: lo primero a mirar es el saldo, porque su
  API ya no tiene capa gratuita, y pagarla es decisión del **[dueño]**. Abrirla es lo mismo que
  con Threads: sacarla de `REDES_PROXIMAMENTE` y volver a contar su conexión en la wiki.
- **Threads: números en Los Números y respuestas en La Mesa, para una tercera vuelta de Meta**
  (2026-11-05). El código está hecho y apagado: el conector de métricas
  (`src/lib/social/threads.ts`, `threads_manage_insights`) y el `Comentarista` de La Mesa con la
  regla de palabra clave en público (`src/lib/social/comentarios/threads.ts`,
  `threads_read_replies` y `threads_manage_replies`); el README lo cuenta en «Threads». No se
  probó contra la API real: sin esos permisos no hay token que los tenga. Lo que falta, todo
  del **[dueño]**: (1) volver a activar los tres permisos en el caso de uso de Threads de la app
  de Meta (se quitaron el 2026-11-05, porque el panel los había sumado al borrador de la segunda
  solicitud); (2) poner `THREADS_PERMISOS_EXTRA=1` en Vercel y redesplegar —antes de (1) no,
  porque la ventana de Threads rechazaría el pedido entero—; (3) reconectar Threads con la
  cuenta del revisor, correr «Sincronizar ahora» y responder una respuesta desde La Mesa, que
  además deja la llamada de prueba que Meta exige por permiso; (4) grabar el video; (5) enviar
  la solicitud después de que contesten la de la segunda vuelta. Si en la prueba los números de
  un post salen vacíos, lo primero a mirar es el log del sync («threads … sin números»): la
  documentación marca `views` como «en desarrollo».
- **Meta: los anuncios (`ads_read` y `ads_management`), tercera vuelta del App Review**
  (2026-10-21; construido el 2026-11-05). El dueño eligió primero solo leer y después «todo lo
  posible desde Tu Parrilla»: leer los resultados y también promocionar. Lo hecho:
  - **Leer** (`ads_read`): la sincronización diaria lee con la Marketing API las cuentas
    publicitarias del creador y sus anuncios, los cruza con sus publicaciones de Instagram y
    Facebook y los guarda en `anuncios`; Los Números los muestra en «Lo pagado».
  - **Promocionar** (`ads_management`): en la pieza de una publicación ya publicada de Instagram o
    Facebook, «Promocionar» arma campaña, conjunto, creativo y anuncio en la cuenta publicitaria
    del creador —objetivo, presupuesto por día o total, fechas, países, edades, Advantage+—, con un
    resumen que dice lo máximo que gasta antes de crear nada, la confirmación de que no es una
    categoría especial y la elección de dejarla en pausa (lo que viene marcado) o activarla. Se
    pausa, reanuda y detiene desde la pieza o desde «Lo pagado». Nunca se crea nada sin esa
    confirmación ni de forma automática.

  Detalle en el README («Conectar y sincronizar») y en la wiki (`los-numeros.md`). Está todo
  detrás de tres variables, apagadas: `META_PERMISOS_ANUNCIOS=1` pide `ads_read` al conectar,
  `META_PERMISOS_PROMOCIONAR=1` suma `ads_management` (solo junto con la otra) y
  `ANUNCIOS_ABIERTO_PARA` dice para quién se lee, se ve y se ofrece «Promocionar».

  **No se probó contra una cuenta publicitaria de verdad**: los campos salen de la documentación
  de la Marketing API y están en los tests, con Meta doblada. Falta ver en vivo, al leer, que
  `insights.date_preset(maximum)` venga dentro del listado de anuncios, que el filtro de estados no
  lo rechace (si lo rechaza, se repite sin él y se pierde lo archivado) y que un post promocionado
  desde la app traiga `effective_instagram_media_id`. Al promocionar, que Meta acepte el conjunto
  tal como se arma: `destination_type: ON_POST` para la interacción, `publisher_platforms` con una
  sola red, el mínimo diario de `minimum_budgets` (se valida contra `min_daily_budget_imp`; si Meta
  pide más para la interacción o las visitas, lo dice al crear) y el tope de 25 para la edad mínima
  con Advantage+; que el creativo de Instagram (`instagram_user_id` con el id de la cuenta que
  guarda Tu Parrilla, y su página) pase; que `boost_eligibility_info` traiga `eligible_to_boost`, y
  que los errores lleguen en castellano con `locale=es_LA`. Tampoco se sabe si el token de página
  que guarda Facebook sirve para la Marketing API: se prueba solo si no hay un Instagram conectado,
  así que un creador con solo Facebook podría quedarse sin «Lo pagado» y sin «Promocionar».

  Lo que falta, en orden:
  1. **[dueño]** Volver a agregar `ads_read` **y** `ads_management` al caso de uso de la app de
     Meta (`ads_read` se quitó el 2026-11-05, para que no frenara la segunda vuelta).
  2. **[dueño]** En Vercel, `META_PERMISOS_ANUNCIOS=1`, `META_PERMISOS_PROMOCIONAR=1` (las dos solo
     después del paso 1: si no, Meta rechaza la ventana entera y nadie conecta) y
     `ANUNCIOS_ABIERTO_PARA=<id del revisor>`; redesplegar.
  3. **[dueño]** Con la cuenta del revisor, que tiene un rol en la app y administra la cuenta
     publicitaria (con el acceso de desarrollo de la Marketing API, Meta solo deja eso: su error
     270): que la cuenta publicitaria tenga un medio de pago; reconectar Instagram aceptando los
     permisos nuevos; en Los Números → una publicación de @vicente_edits2 → «Promocionar», con el
     presupuesto mínimo y un solo día, crearla en pausa y mirar que aparezca en «Tus promociones
     desde Tu Parrilla». Si algo falla, la frase de Meta sale en la pantalla, y lo de la lectura,
     en el registro del cron (`[sync] anuncios del dueño …`).
  4. **[dueño]** Grabar el video: Los Fierros → reconectar Instagram mostrando los dos permisos en
     la ventana de Meta → la pieza de una publicación → «Promocionar» → llenar con un presupuesto
     mínimo → «Revisar» (se ve lo máximo que se gasta) → marcar la casilla → «Crear y activar» →
     el estado en «Tus promociones» → «Pausar» → «Sincronizar ahora» → «Lo pagado» con lo que
     alcanzó a hacer. Detenerla al final, para no seguir gastando.
  5. **[dueño]** Mandarlo cuando Meta conteste la solicitud de la segunda vuelta que está en curso,
     no antes. El acceso estándar a la Marketing API se apoya en la verificación del negocio (la
     de Pyxis, más arriba): sin ella, Meta puede aprobar los permisos solo con acceso de desarrollo.
  6. Aprobado: `ANUNCIOS_ABIERTO_PARA=1` para todos, y sacar de la wiki (`los-numeros.md`,
     `los-fierros.md`, `index.md`) que «Lo pagado» y «Promocionar» se ven solo en algunas cuentas.
- **Revisar qué otros permisos hacen falta** (2026-10-21). Una pasada red por red de lo que el
  producto necesita y todavía no pidió, antes de la próxima vuelta de cada revisión, para
  pedirlo todo de una vez y no volver a grabar. Lo que ya se sabe que falta: los mensajes
  privados (Meta, segunda vuelta), el login con Instagram (su entrada, abajo), los anuncios (la entrada de arriba)
  y Threads. Por decidir si hacen falta: más métricas de las que se leen hoy (las historias de
  Instagram, las estadísticas del perfil de TikTok) y otro alcance de YouTube. Los comentarios
  de TikTok ya se decidió quererlos, en la entrada de abajo.
- **Comentarios de TikTok en La Mesa** (2026-10-23, lo pidió el dueño). La API que usa Tu
  Parrilla (Login Kit, Display y Content Posting de developers.tiktok.com) no lee ni responde
  comentarios: solo da el número. La vía parece ser la API for Business de TikTok (sus API
  «Organic», para cuentas de empresa), que es otra app, otro portal y otra revisión. Falta
  confirmarlo en business-api.tiktok.com y ver si sirve para cuentas de creador. Con eso, es un
  `Comentarista` más en `src/lib/social/comentarios/`. Lo que ya se pidió, permiso por permiso, está en
  `docs/levantamiento-terceros.md` (§2.2 para Meta).
- **Meta, segunda vuelta: mensajes privados** (el privado con el enlace de la regla de
  palabra clave, `instagram_manage_messages` y `pages_messaging`) y, aparte, **Threads**
  (`threads_basic`, `threads_content_publish`). Se sacaron de la primera solicitud porque
  no salen en su video; cada una necesita su guion y su grabación. Ver
  `docs/levantamiento-terceros.md` §2.2 y §7.

  En la misma vuelta, **las historias** (2026-10-25). No piden permisos nuevos: alcanzan
  `instagram_content_publish` y `pages_manage_posts`, ya aprobados. Pero si Meta vuelve a
  revisar la app, cuenta que el uso aprobado describa lo que hace: nombrarlas en la descripción
  de esos dos permisos y mostrar una en el video.

  Video grabado el 2026-11-05 (`meta-app-review-demo-2.mp4`, en la carpeta «Meta -
  Verification» con sus textos en `2026-10-27-SEGUNDA-VUELTA.txt`); la solicitud va con esos
  cuatro permisos y nada más. **Enviada el 2026-11-06**; el PDF de lo enviado está en la misma
  carpeta. **[dueño]** Esperar la respuesta de Meta sin desconectar las cuentas del revisor ni
  tocar `COMENTARIOS_DM`, `THREADS_ABIERTO_PARA` ni `META_PERMISOS_PRIVADO`; lo que se hace al
  aprobarse está al final de `2026-10-27-SEGUNDA-VUELTA.txt`.
- **Instagram sin página de Facebook: tercera vuelta de Meta** (2026-10-19; el código, el
  2026-11-05). La conexión de siempre es Instagram con login de Facebook, que encuentra el
  Instagram solo a través de una página que la persona administre: sin página enlazada, Meta no
  entrega ninguno, aunque se acepten todos los permisos. Probablemente es lo que trabó a la primera
  usuaria invitada, que conectó TikTok y no Instagram. La otra vía es el login de Instagram
  (*Business Login for Instagram*, en `graph.instagram.com`), que no pide página; la cuenta
  profesional, sí. Usa su propio juego de permisos: `instagram_business_basic`,
  `instagram_business_content_publish`, `instagram_business_manage_comments`,
  `instagram_business_manage_messages` e `instagram_business_manage_insights`.

  **Ya está hecho**, cerrado para todos salvo quien diga `INSTAGRAM_LOGIN_ABIERTO_PARA`:
  «Conectar con Instagram →» en Los Fierros, el canje y la renovación sola del token, y la
  publicación (fotos, reels, carruseles, historias y trial reels), la sincronización, los
  comentarios y el privado por ese login, con su baja y su borrado. El detalle, en el README,
  «Instagram sin página de Facebook: el login de Instagram». Lo que queda:

  - **[dueño]** En el caso de uso de Instagram de la app de Meta («API setup with Instagram
    login»): volver a agregar los cinco permisos `instagram_business_*`, que se quitaron el
    2026-11-05 del borrador de la segunda solicitud; copiar el *Instagram app ID* y su secreto, y en
    *Business login settings* poner *OAuth redirect URIs*
    `https://tu-parrilla.cl/api/social/instagram/callback`, *Deauthorize callback URL*
    `https://tu-parrilla.cl/api/social/instagram/baja` y *Data deletion request URL*
    `https://tu-parrilla.cl/api/social/instagram/borrado`.
  - **[dueño]** En Vercel (production): `INSTAGRAM_LOGIN_APP_ID`, `INSTAGRAM_LOGIN_APP_SECRET` e
    `INSTAGRAM_LOGIN_ABIERTO_PARA=<id del usuario revisor>`, y que `COMENTARIOS_DM` lo incluya para
    mostrar el privado. Redesplegar.
  - **[dueño]** Grabar el video y mandar la solicitud. Conviene un Instagram profesional **sin**
    página de Facebook, para que se vea que no la pide; @vicente_edits2 tiene página, y conectarlo
    por este login pasa su fila al login de Instagram. Si la ventana de Instagram dice que la app no
    está disponible o que falta un rol, agregar esa cuenta como tester de Instagram en los roles de
    la app y aceptar la invitación desde Instagram.
  - Al grabar, mirar lo que no se pudo probar sin la app real (la lista está al final de esa
    sección del README): si algo falla, el registro de Vercel dice qué contestó Instagram.
  - Aprobada: `INSTAGRAM_LOGIN_ABIERTO_PARA=1`, y decidir si «Conectar con Instagram» pasa a ser el
    camino principal en Los Fierros, con el login de Facebook para quien además maneja páginas.
    Antes de abrirlo a todos, las ventanas de ayuda de la vuelta (`ayuda-conexion.ts`) hablan solo
    del login de Facebook: la de «No se agregó otra cuenta de Instagram» dice que se edite el acceso
    en la ventana de Facebook aunque se haya entrado por la de Instagram.
- **[dueño] Google — auditoría de cuota de YouTube (trámite B): se contestó el 2026-10-26;
  queda esperar.** El 2026-10-22 YouTube pidió dos cosas (el correo está en
  `2026-10-22-pedido-de-informacion.txt`, en la carpeta del trámite): si la API se usa en
  Android y en iOS, con un screencast de publicar en varias redes y responder desde una sola
  cola, y credenciales de demo. Se respondió en el mismo hilo que la API la llama solo el
  servidor, que la app de Android pasa por él y que en iOS no hay app; el screencast quedó no
  listado en el canal Pyxis oficial (`https://youtu.be/ekfLmNq8wqw`, el archivo y el texto
  enviado en `2026-10-23-RESPUESTA-Y-SCREENCAST.txt`), y las credenciales son las del revisor
  con su código fijo, explicado como contraseña. Los Shorts que sube Tu Parrilla salen
  públicos: la regla de subir en privado no se le aplica a este proyecto.

  Para que el revisor pueda probar La Mesa tiene que haber un comentario de YouTube en
  «Pendientes»: el 2026-10-26 quedó uno en el Short público «canal video 2» de Pyxis
  oficial. La Mesa solo lee los videos de los últimos siete días, y los comentarios de YouTube
  se borran a los 30, así que si la revisión se alarga más allá del 2026-11-25 hay que subir
  otro Short público desde Studio, sincronizar al revisor y comentarlo desde parejavice.

  Lo de antes: se envió el 2026-10-10, y YouTube acusó recibo por correo a
  pyxis.latam@gmail.com, sin número de caso. Se pidieron 100.000 unidades al día del cupo general (el
  cálculo está en el guion) y ningún aumento del cupo de subidas. Lo enviado está al final
  de `TEXTOS-FORMULARIO.txt`, sección por sección, y la evidencia en `evidencia/`, en la
  misma carpeta. Antes de enviar se corrigió lo que las políticas de YouTube prohíben (#157;
  ver «Lo que la auditoría mira de los datos guardados» en el guion). Quedaron sin
  confirmar tres cosas de lo enviado: si se marcó «Analytics & Reporting» (se recomendó,
  pero la captura nueva de Los Cortes que pide esa opción no se llegó a hacer); si el cupo
  de `videos.insert` quedó en 100 (un borrador lo tenía en 1000), y si «Pyxis oficial» se
  reconectó al usuario revisor antes de enviar. Si la respuesta toca alguna, se aclara en el
  mismo hilo. **Mientras tanto:** que «Pyxis oficial» esté conectado al usuario revisor
  (las instrucciones de acceso lo dan por conectado; si los registros de producción traen
  `Google refresh: 400 invalid_grant` al leer sus comentarios, perdió el permiso y se
  reconecta en Los Fierros entrando como `revision@tu-parrilla.cl`) y que haya algún
  comentario pendiente en La Mesa (los de
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
  salido de `a6bd08f`; lo demás le llega por aire en el canal `production`). Lo nativo que
  cambió después entra en el próximo build, sin apuro: desde el 2026-10-21 Android no respalda
  los datos de la app (`allowBackup: false` en `mobile/app.json`) y salieron dos módulos que no
  se usaban (`expo-device` y `expo-web-browser`); el binario de hoy sigue respaldando lo que la
  app guarda. La versión interna con ese `.aab` se publicó el 2026-10-17, «Tu Parrilla
  (Alfa)», sin revisar: hasta que Google revise la app, la tienda se la muestra a los
  probadores como «cl.tuparrilla.app (unreviewed)». Desde el 2026-10-26 el dueño está en la
  lista de verificadores «Tu Parrilla - interno» y tiene la app instalada desde la tienda.
  Falta, en la consola, lo que pide esa revisión —el nombre «Tu Parrilla» y la ficha, y las
  tarjetas de Contenido de la app—. Para que lo siguiente salga sin entrar a la
  consola: la cuenta de servicio con
  su clave JSON para EAS (nunca en un chat ni en el repo) y el secreto `EXPO_TOKEN` en
  GitHub, que el flujo «App a la tienda» necesita y todavía no está. El paso a paso y los
  textos, en la carpeta «Google Play» del escritorio de Vicente; el porqué, en
  `docs/play-store.md`. La tienda pública es otro trámite: una cuenta personal nueva
  necesita una prueba cerrada con doce probadores durante catorce días.
- **[dueño] El build 1.2.0 de la app, con la cámara, a las tiendas** (2026-11-02). La 1.2.0 trae
  La Cocina en el teléfono: grabar un video o sacar una foto y mandárselo al chef. Pide los
  permisos de cámara y micrófono, que solo llegan con un binario nuevo, y su `runtimeVersion` es
  otra: nada de la 1.2.0 llega por aire a un teléfono con la 1.1.0. Falta: el build de EAS de
  producción (el flujo «App a la tienda» de GitHub, o `npx eas-cli build -p android --profile
  production` en `mobile/`) y subirlo a Google Play (`eas submit`), con la sección de seguridad de
  los datos de la Play Console al día —la app usa la cámara y el micrófono para lo que la persona
  sube—; y lo mismo en el App Store cuando exista la cuenta de Apple (ver la entrada de abajo).
  Probarlo en un teléfono de verdad antes de soltarlo: la cámara, los permisos y la subida por
  partes de un video de varios GB no se pudieron probar sin uno. Mientras tanto, lo de la 1.1.0
  se publica por aire desde un commit anterior. Detalle en `mobile/README.md`, «La 1.2.0
  necesita un build nativo y pasar por las tiendas». Ya que hay build, conviene sumarle antes
  `react-native-svg`, que también espera uno (el bug de la entraña, en «Bugs»).
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

## Finanzas: planes y pagos

Pedido del dueño el 2026-10-23, como uno de los dos ejes de trabajo, junto con los trámites. Hoy
nadie paga: todas las cuentas son iguales y el README dice «Sin suscripción».

- **Tres niveles de cuenta y una forma de pagar** (2026-10-23). Tres planes, cada uno con sus
  límites, y una integración para que la gente pague desde Tu Parrilla. Por decidir: el nombre y
  el precio de cada plan, qué limita cada uno (las cuentas conectadas, lo programado, las comandas
  de La Cocina, el espacio de la media) y con qué proveedor se cobra. Se apoya en «Cupos y reparto
  de los crons por usuario», en la sección de abajo, que todavía no está hecho. Si se cobra dentro de
  la app del teléfono, las tiendas tienen sus propias reglas de cobro: por revisar antes de
  elegir.
- **Que el admin maneje los planes a mano** (2026-10-23). Desde la cuenta del dueño, en Los
  Maestros o al lado: mover los límites de cada plan, cambiarle el plan a una cuenta y dar cuentas
  gratis, sin pasar por el cobro.
- **[dueño] Lo que pide cobrar, fuera del código** (2026-10-23):
  - la cuenta del proveedor de pagos a nombre de Pyxis;
  - la boleta o factura electrónica de cada cobro;
  - que `/terminos` y `/privacidad` cuenten los planes, el cobro y la baja, en la misma revisión
    del abogado («Que todo quede a nombre de Pyxis», arriba);
  - Vercel Pro, que ya hacía falta antes de abrir a terceros.

  Al salir, cambian también el README (la frase «Sin suscripción», arriba de todo) y la portada,
  que debe seguir describiendo la app y enlazando Privacidad y Términos.

## Features y trabajo de código

- **El correo del código, con un enlace para entrar** (2026-11-02, lo pidió el dueño). Hoy dice
  «NNNNNN es tu código para entrar a Parrilla» y nada más (`pedir` en `src/lib/usuarios.ts`):
  hay que copiar el código a mano. Sumar un botón que entre directo, sin sacar el código, que
  sigue sirviendo para la app y para abrir el correo en otro aparato. Al diseñarlo: los filtros de
  correo abren los enlaces antes que la persona, así que el enlace no puede gastar el código al
  abrirse —que lleve a una página con «Entrar» que lo canjee al apretar—; que valga lo mismo que el
  código (diez minutos, un solo uso, el mismo cupo de intentos); y que entre en el aparato donde se
  abre, aunque el código se haya pedido en otro. La wiki (`ingresar.md`, `los-maestros.md`) dice
  hoy que el correo «no trae enlace».

- **Lo que todavía dibuja el navegador** (2026-11-02). Las preguntas, los calendarios, el color,
  los avisos de los formularios y los globitos ya son del panel (rama `ventanas-propias`, ver
  «Las ventanas del panel» en `public/docs/ui/index.md`). Quedan, a propósito:
  - los `<select>` nativos, ocho en el código (`Select` de `ui.tsx` en Tu Cuenta, La Vitrina
    ×2, el bloque de TikTok y Los Maestros ×2; `SelectorEnUrl` de `filter-bar.tsx`, que usan
    todas las pantallas de Los Números; y el de fusionar en Los Fierros), y el `<datalist>` de
    «Icono» en un link de La Vitrina: su lista la dibuja el navegador. Pide un menú propio,
    con teclado y lector de pantalla;
  - el `title` de cada link en la página pública de un creador (`profile-view.tsx`): esa
    página tiene la identidad del creador, no la del panel;
  - sin reemplazo posible: el selector de archivos del sistema, y el aviso del navegador al
    cerrar la pestaña con una subida en curso en La Cocina (`beforeunload` en
    `ia/pedir/formulario.tsx`), que el navegador no deja dibujar a nadie más.
- **Sacar `@react-native-community/datetimepicker` de la app** (2026-11-02). Ya no se usa: el día
  y la hora se eligen en la hoja de la app (`mobile/src/components/selector-fecha.tsx`). Se dejó
  en `package.json` y en los plugins de `app.json` para que este cambio llegue solo por aire;
  sacarlo cambia el binario, así que va con el próximo build nativo.

- **Historias en Instagram y Facebook: lo que falta** (2026-10-25). El motor está hecho —el
  contrato, los publicadores, la secuencia en orden, el choripán al paso y la API y el CSV—;
  el diseño entero está en `docs/superpowers/specs/2026-10-24-historias-design.md`. Falta:
  - el compositor del panel, con el selector «Post · Historia» y las tarjetas verticales
    (parte 2), y en La Parrilla el número de la secuencia («1/3») junto al corte y, en el
    detalle del post, «Historia en Instagram · @cuenta»;
  - Publicar en el teléfono, con el visor 9:16 (parte 3), por OTA;
  - **[dueño] la primera historia real**, con una cuenta de prueba: si Instagram la rechaza
    desde una cuenta de creador (@vicente_edits2, si es Creator), y un video a la página de
    Facebook, cuya guía se contradice entre 60 y 90 segundos. Si Instagram ya no rechaza las de
    creador, se borra la frase `HISTORIA_SOLO_EMPRESA` y su mención en las guías de la API;
  - las métricas de las historias, fuera de esta entrega: Instagram las da solo durante 24
    horas, y las de Facebook no están documentadas.

- **Por decidir: que la app pida el candado también al volver a ella** (2026-10-21). Hoy lo
  pide cuando arranca; si quedó abierta en segundo plano, al volver entra sin pedirlo, y quien
  tenga en la mano el teléfono desbloqueado ve la cuenta. Las apps de bancos lo vuelven a pedir
  pasado un rato fuera. Es una decisión de producto, no un arreglo: cuánto rato, y si vale la
  molestia. Se haría en `mobile/src/components/sesion.tsx`, mirando `AppState`.

- **El modo día con sushi** (2026-10-18). Pedido del dueño, para el público que la estética de
  asado deja fuera. Están hechas las cuatro tandas: el panel, sus motivos, la app del teléfono y
  la portada. El diseño está en `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`.
  Falta:
  - mirar de día los gráficos en Safari y en Firefox: en Chrome, recharts toma las variables
    del modo; si otro navegador no, saldrían con el color por defecto de cada atributo;
  - la pantalla de arranque de la app, que sigue de noche en los dos modos (ver
    `docs/deuda-tecnica.md`, «Lo nativo de la app no cambia de modo»).
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
  compartidos con el panel. Faltan: (3) La Mesa como otra pestaña (la cuarta es La Cocina
  desde el 2026-11-02), para leer y responder comentarios; (4) TikTok desde Publicar —exige mostrar los datos de la cuenta
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
- **Gamificar las notificaciones de cada red** (2026-10-25, lo pidió el dueño). Que lo que cada
  red le avisa a un creador —seguidores nuevos, comentarios, reacciones a un post— se viva en Tu
  Parrilla como un juego, red por red. Falta definir con el dueño qué cuenta como notificación y
  cuál es el juego (puntos, rachas, logros, en qué pantalla). Hasta donde se sabe, ninguna de las
  APIs que se usan entrega la bandeja de notificaciones de la red, así que el juego se arma con lo
  que ya se lee: los comentarios de La Mesa, las métricas de cada post y los seguidores de cada
  cuenta (`src/lib/social/account-metrics.ts`). La app del teléfono no manda notificaciones:
  avisar allí pide `expo-notifications`, que es nativo, y un build nuevo. Se cruza con «Mientras
  no mirabas», de la entrada de arriba, que también necesita guardar la última visita por usuario.
- **Cupos y reparto de los crons por usuario** (`docs/levantamiento-terceros.md` §5.4). Hace
  falta cuando la beta pase de unos diez usuarios.
- **[dueño] El privado de Meta (DM con el PDF): construido, falta la aprobación** (2026-10-27).
  El privado tras responder a mano y el de la regla de palabra clave están hechos y apagados.
  Para la segunda vuelta del App Review: activar `instagram_manage_messages` y
  `pages_messaging` en los casos de uso de la app de Meta; después `META_PERMISOS_PRIVADO=1`
  y `COMENTARIOS_DM=<id del usuario revisor>` en Vercel; reconectar Instagram y Facebook en el
  revisor, y grabar. Con la aprobación, `COMENTARIOS_DM=1` lo enciende para todos (cada
  cuenta tiene que reconectarse una vez para conceder los permisos). Ver el README, el párrafo
  del mensaje privado en lo de La Mesa.
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
- **[dueño] Retirar `SCHEDULE_API_KEY` de Vercel** (2026-10-13). Desde que cada usuario
  genera sus llaves en su panel (hoy en La Cocina, «Tu propio chef»), la del despliegue solo
  seguía para el AM de `marca-personal`, y
  el AM ya se pasó: desde el 2026-10-20 llama a `tu-parrilla.cl`, y su `docs/parrilla.md`
  describe la API de hoy y dice que usa una llave de Tu IA (el nombre de entonces de La Cocina). Falta confirmar en la
  máquina del AM que la llave que tiene empieza con `tp_` y, si es así, borrar la variable en
  Vercel. En código no hay nada que hacer: sin la variable, la API ya acepta solo las llaves
  de usuario. Después, sacarla de la tabla de variables del `README.md` y de `.env.example`.
- **Por decidir: que el admin pueda cortar las llaves de otro usuario** (2026-10-13). Hoy
  solo el dueño de una llave la revoca, y «Cerrar sesiones» en Los Maestros no las toca (son
  credenciales aparte, y cortarlas en silencio rompería su agente). Si una se filtra y el
  usuario no responde, el admin no tiene cómo cortarla sin tocar la base. Opciones: que
  «Cerrar sesiones» también las borre, o una lista de llaves por usuario en Los Maestros.
- **Por decidir: el nombre de La Mesa** (2026-10-23). El dueño dudó de que «La Mesa» se
  entienda como el lugar donde se responden comentarios. La propuesta es «El Comedor» (o «Las
  Mesas»): sigue la metáfora del restorán y suena a donde está la gente. Falta que el dueño
  elija; el cambio toca la pestaña, la ruta de la wiki (`public/docs/ui/la-mesa.md`) y los
  textos que la nombran.
- **Por decidir: que «Pedir una comanda» avise si falta el nombre de la marca** (2026-10-23).
  Hoy la comanda sale igual y el chef tiene que preguntar. Se propuso un aviso antes de
  mandarla; falta el sí del dueño.
- **Por revisar: «las notificaciones de Google»** (2026-10-23). El dueño las nombró al pedir
  los preparativos de YouTube y no quedó claro dónde las ve (¿correos de Google Cloud?, ¿el
  Verification Center?, ¿avisos en la app?). Preguntarle antes de tocar nada.
- **No urgente: revisar el CI/CD y evaluar las dependencias** (2026-11-02, lo pidió el dueño).
  - Ver si la reja de pull requests y el despliegue (README, «Cómo entra un cambio») cubren lo
    que hace falta y cuánto tardan.
  - Revisar las dependencias del sitio y de la app: cuáles sobran, cuáles traen avisos de
    seguridad y cuáles se pueden reemplazar. Por ejemplo, `exceljs` se descartó para la planilla
    por sus avisos.
  - De paso, los pull requests de Dependabot que siguen abiertos (#241 y #288, que reemplazó a la
    #242): que el CI pase y que no rompan nada antes de fusionarlos.
- **[dueño] Borrar el almacén viejo de Vercel Blob** (2026-10-22). La media ya vive en R2 y el
  código no lo usa; no se borró porque borrar es irreversible y pide el sí del dueño. Antes,
  mirar que no quede nada que se quiera guardar.
- **Por decidir: que los avisos lleguen a quien lleva el calendario** (2026-10-17). El correo
  de una cuenta caída, el de un post quemado y el resumen del día van al correo del dueño de
  las cuentas. Si el calendario lo lleva otra persona con la llave del dueño —un agente que
  programa por la API—, por correo no le llega nada; lo lee en `GET /api/schedule/resumen`.
  Si hace falta que le llegue por correo, la salida es un campo «Avisos a» en Tu Cuenta, un
  correo por usuario, que lean `destinatario` (`src/lib/social/publish/alert.ts`) y
  `enviarResumenes` (`src/lib/avisos/run.ts`) en vez del correo del dueño.
