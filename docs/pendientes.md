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
    comanda elige de ahí (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`). Desde el
    2026-11-06, de la fase 1, las preguntas del chef con plazo y opción por defecto, con el latido
    que dice si la cocina toma sola y la alarma al admin (VicentePareja/marca-personal#22).
  - **Lo siguiente, la fase 1:**
    - el probador («Prueba tus estilos», las comandas de tipo `prueba`);
    - el `reestilo` («Otros estilos con el mismo material»).

    El diseño dice qué trae cada una.
  - **El correo de la comanda, y el de la pregunta, no se reintentan si Resend falla**
    (2026-11-02; la pregunta, 2026-11-06). Salen uno por cambio y uno por pregunta; falta
    marcarlos enviados para reintentarlos sin arriesgar un segundo. Pide una migración: el detalle,
    en `docs/deuda-tecnica.md`, «El correo de la comanda no se reintenta».
  - **Los avisos de la cocina que faltan** (2026-11-02): el de un creativo del mesón por borrarse
    sigue solo en el resumen del día («Avisos», en el diseño). Y desde el 2026-11-06, que el chef
    pregunta: el diseño pide además un aviso en la pestaña de la barra del panel (como el de «Se
    quemó») y una línea en el resumen del día si hay preguntas sin responder; hoy hay correo y la
    tarjeta de color, nada en la barra ni en el resumen.
  - **La entrega, en la app del teléfono** (2026-11-08). Desde #284, el panel hace salir el plato de
    la cocina la primera vez que el dueño mira la primera tanda o la comanda lista, y lo anota en
    `comandas.entrega_vista` (`src/app/admin/(dash)/ia/entrega-del-plato.tsx`). La app muestra las
    comandas sin la estación dibujada, y ni la anima ni la anota: quien la ve primero en el teléfono
    la ve salir después en el panel. No se llevó porque la app 1.1.0 recibe sus OTA desde otra rama;
    pide la estación en la app y una ruta de `/api/mobile/cocina` que llame a `verEntrega`.
  - **[dueño] Probar el mesón en el teléfono con un creativo de verdad** (2026-11-07). Llega con el
    build 1.2.0 (`expo-video`): «Ver el mesón» en la comanda, el video, «Programar» hasta Publicar y
    «Descartar». Se probó la tarjeta dibujada en un navegador y el servidor con tests; el video en un
    teléfono, no. Programado desde el teléfono, el post en La Parrilla tiene que traer la portada,
    los atributos y, en YouTube, el título del chef.
  - **Por revisar: la alarma de la cocina no ve una comanda tomada sin hora estimada** (2026-11-06).
    Suena si lleva media hora sin tomar o si pasó su `eta`; una que el chef tomó y dejó en
    `revisando` sin `eta` —el camino «la revisa una persona del equipo» del issue
    VicentePareja/marca-personal#22— no suena nunca. Si el servicio del chef no siempre da `eta`,
    sumar un tercer motivo (tomada y sin cambios en N horas), con su columna. Detalle en
    `src/lib/cocina/alarma.ts`.
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
    le toca a cada plan: desde el 2026-11-08 la pone el plan (20 GB el gratis, 200 GB el pagado, en
    Los Maestros → «Los planes»), y a mano sigue ganando `users.bodega_bytes`.
  - **Del equipo de contenido:** el cliente del chef en `marca-personal`, contra
    `docs/cocina-api.md`.

## Bugs

- **El compositor del panel no mira el largo máximo de un video en TikTok** (2026-11-07, se vio al
  llevar el bloque al teléfono). `creator_info` trae `max_video_post_duration_sec` y la guía de
  TikTok pide no dejar mandar un video más largo; Publicar del teléfono lo dice y apaga
  «Programar» (`videoMuyLargo`, en `mobile/src/lib/tiktok.ts`), pero el bloque del panel
  (`tiktok-opciones.tsx`) ni lo muestra: el video sube y TikTok lo rechaza después. El panel ya
  mide la duración en `revision-media.tsx`; falta cruzarla con el dato de la cuenta.

- **En el panel a ancho de teléfono, la pieza que se elige en la cámara de frío vuela fuera de
  la pantalla** (2026-11-02, se vio al probar #296). A ese ancho el riel de la comanda queda
  debajo de la grilla, y la animación de salida apunta a él aunque no se vea. No rompe nada: la
  pieza queda elegida. Se podría apuntar el vuelo al borde visible, o mostrar el riel fijo abajo.

- **En la 1.1.0, la entraña de un video se sigue leyendo como una longaniza** (2026-10-26; desde
  el 2026-11-07, solo en la 1.1.0). La 1.2.0 dibuja el corte en SVG con las curvas del panel
  (`mobile/README.md`, «El corte en SVG, solo desde la 1.2.0»), pero la 1.1.0 no trae
  `react-native-svg` y se queda con las vistas de `ota-1.1.0`. Se va solo cuando todos tengan la
  1.2.0; si antes molesta, se puede retocar la silueta de la entraña en esa rama, por aire (más
  ancha, con un extremo afinado o las vetas más marcadas).
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
  Desde el 2026-11-07 el producto lo cuenta: la ayuda de «Palabra clave» pide la palabra dentro de
  una frase o una distinta por post, y La Mesa muestra «Comentarios que Instagram no entrega»
  cuando Instagram cuenta dos o más que no llegaron (`src/lib/social/comentarios/faltantes.ts`).
  Ese aviso no distingue las respuestas que otras personas se dan entre ellas, que Instagram
  también cuenta y Tu Parrilla no guarda, y por eso lo dice en vez de afirmar que todo lo que falta
  lo escondió Instagram. El teléfono también lo muestra en su La Mesa (por aire a la 1.1.0 desde el
  2026-11-07). Pendiente:
  - **[dueño]** una prueba de dos minutos: apagar «Hide comments» y «Advanced comment filtering»
    en Hidden Words y comentar `GUIA` solo desde una cuenta nueva en la publicación. Si la dueña
    lo ve, es el filtro de spam, que se apaga, y el aviso de La Mesa puede decirlo con certeza
    (hoy dice «puedes probar»). Si no, es un filtro de Instagram que nadie controla, y la frase
    del filtro sale del aviso;
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
- **Ver con fotos reales de TikTok que «Qué te funciona» las cuenta en «Música»** (2026-11-06):
  la línea cruza cada destino con la publicación que trae la sincronización de TikTok, y no se
  ha visto con una cuenta real que `video/list` devuelva las fotos (los tests usan filas
  armadas). Si a las dos semanas de publicar fotos con y sin «Música de TikTok» la línea sigue
  diciendo «Nada de lo publicado desde Tu Parrilla… llevó música», es eso: mirar si las fotos
  aparecen en «Tus publicaciones». Detalle en `src/lib/que-funciona.ts` (`queFuncionaLaMusica`).
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

- **Revisar cómo habla el sitio de Vercel con el servidor 2** (2026-11-11, lo pidió el dueño). Se
  entiende que es el servidor propio del chef de La Cocina, donde corre el pipeline de
  `marca-personal`: confirmarlo con el dueño antes de empezar. Hoy el chef es quien llama, a
  `/api/cocina/…` con `COCINA_SECRET` en `Authorization: Bearer` (`docs/cocina-api.md`, README «La
  Cocina»). Lo que hay que mirar:
  - el secreto: uno solo para todos los dueños, dónde vive en el servidor 2, cómo se cambia sin
    cortar la cocina y qué puede hacer quien lo tenga;
  - si el sitio le habla de vuelta al servidor 2, o solo escucha, y qué queda expuesto a internet
    en cada lado;
  - los enlaces de los insumos (`GET /api/cocina/insumos/{id}/enlace`): cuánto duran y quién más
    podría usarlos;
  - qué pasa si uno de los dos se cae a mitad de una comanda: el latido (`src/lib/cocina/latido.ts`),
    los reintentos y los plazos;
  - los logs de cada lado: que no guarden el secreto ni datos de los dueños;
  - que el servidor 2 tenga sus parches al día, su firewall y sus respaldos, que no se ven desde este
    repositorio.

## Trámites con las plataformas

Plan completo y tiempos en `docs/levantamiento-terceros.md`; un guion por plataforma.

Lo que falta para abrir cada plataforma, de un vistazo (el detalle está en cada entrada, más
abajo): los **mensajes privados de Instagram** (en «Meta, segunda vuelta»), el **login con
Instagram** sin página de Facebook (hecho y cerrado, espera una tercera vuelta), los permisos de Meta para
**leer y promocionar anuncios** (construido, espera la tercera vuelta), las **views y el alcance
de Facebook** (`read_insights`, candidato a la tercera vuelta), la **Play Store** (la pista interna ya existe; la tienda pública es otro trámite) y
el **App Store** de iPhone, las integraciones con **Threads** y con **X**, los **comentarios de
TikTok** (hechos y cerrados, esperan una app nueva de TikTok for Business), y **decidir los
permisos «por decidir»** de la tabla red por red, para pedirlos todos en una misma vuelta.

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
  cuentas conectadas —desde el 2026-11-03, @vicente.ingeniero (Instagram y Threads) y la página
  Tu-Parrilla—, y `REVISION_CORREO` y
  `REVISION_CODIGO` en Vercel. Meta vuelve a revisar las apps aprobadas y pide que las
  credenciales de prueba sigan activas un año (README, «Dejar entrar al revisor de Meta»).
  Una cuenta de Instagram la tiene una sola persona en Tu Parrilla: para usar @vicente.ingeniero en
  otra cuenta, primero hay que dejarle al revisor otro Instagram de prueba, conectándolo o
  traspasándolo en Los Maestros. Para no tenerla parada mientras tanto, se programa en ella con
  una llave del revisor (README, «Dejar entrar al revisor de Meta», paso 4), sin traspasarla.
  Al 2026-11-06 el revisor tiene cinco cuentas, cada una por un trámite: @vicente.ingeniero en
  Instagram y Threads y la página Tu-Parrilla (las vueltas de Meta; se quedan el año), «Pyxis
  oficial» en YouTube (la auditoría de cuota de Google, más abajo: hasta que la aprueben) y
  @vicente_edits2 (la primera vuelta de Meta). @vicente_edits2 se le devuelve al dueño, con un
  traspaso en Los Maestros, cuando Meta conteste la segunda vuelta: las instrucciones al revisor
  ya nombran @vicente.ingeniero, y la tercera se graba con una cuenta de prueba nueva. El video y los textos de esta vuelta (`meta-app-review-demo.mp4`,
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
- **Facebook: las views y el alcance de los reels, con `read_insights` en la tercera vuelta**
  (2026-11-08, issue #338). Todos los posts de Facebook llegan con `views` y `alcance` en `null`:
  Meta exige `read_insights` en las insights del post y en las del video de un reel, y la
  conexión no lo pide (la tabla de `docs/levantamiento-terceros.md`, §8, tiene las fuentes). La
  lectura de los reels está escrita y apagada (`FACEBOOK_INSIGHTS_DE_REELS`, README, «Facebook:
  las views y el alcance»), y no se probó contra la API real: no había un token con el permiso.
  Falta: (1) **[dueño]** agregar `read_insights` en el caso de uso de la app de Meta, después de
  que contesten la segunda vuelta; (2) sumarlo al conectar de Facebook detrás de su propia
  bandera, como `META_PERMISOS_ANUNCIOS`; (3) reconectar la página del revisor, encender
  `FACEBOOK_INSIGHTS_DE_REELS` y mirar que un reel traiga números —si `post_video_social_actions`
  llega desglosado, también los compartidos—; (4) grabarlo y pedirlo en la tercera vuelta;
  (5) aprobado, reconectar cada página.
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
     permisos nuevos; en Los Números → una publicación de @vicente.ingeniero → «Promocionar», con el
     presupuesto mínimo y un solo día, crearla en pausa y mirar que aparezca en «Tus promociones
     desde Tu Parrilla». Si algo falla, la frase de Meta sale en la pantalla, y lo de la lectura,
     en el registro del cron (`[sync] anuncios del dueño …`).
  4. **[dueño]** Grabar el video: Los Fierros → reconectar Instagram mostrando los dos permisos en
     la ventana de Meta → la pieza de una publicación → «Promocionar» → llenar con un presupuesto
     mínimo → «Revisar» (se ve lo máximo que se gasta) → marcar la casilla → «Crear y activar» →
     el estado en «Tus promociones» → «Pausar» → «Sincronizar ahora» → «Lo pagado» con lo que
     alcanzó a hacer. Detenerla al final, para no seguir gastando.
  4. **[dueño]** Mandarlo cuando Meta conteste la solicitud de la segunda vuelta que está en curso,
     no antes. El acceso estándar a la Marketing API se apoya en la verificación del negocio (la
     de Pyxis, más arriba): sin ella, Meta puede aprobar los permisos solo con acceso de desarrollo.
  5. Aprobado: `ANUNCIOS_ABIERTO_PARA=1` para todos, y sacar de la wiki (`los-numeros.md`,
     `los-fierros.md`, `index.md`) que «Lo pagado» y «Promocionar» se ven solo en algunas cuentas.
- **[dueño] Decidir los permisos «por decidir»** (2026-10-21; la pasada, el 2026-11-07). La
  tabla red por red —lo pedido, lo aprobado, lo que falta y en qué vuelta va— está en
  `docs/levantamiento-terceros.md`, §8. Lo que ya está escrito y espera su vuelta no hay que
  decidirlo (la tercera de Meta tiene sus diez permisos). Quedan tres decisiones: (1) las
  **métricas de las historias de Instagram**, que no piden permiso nuevo pero sí código que las
  lea antes de las 24 horas, y una escena en el video de la tercera vuelta si se hacen antes;
  (2) **`user.info.profile` de TikTok** (el @usuario) —`user.info.stats` ya se decidió el
  2026-11-08: va en la app de TikTok for Business, la entrada de abajo, y la app de siempre se
  queda quieta—; (3) **`yt-analytics.readonly`**, que pide volver a verificar la pantalla de Google
  y reconectar los canales, mejor junto con la auditoría de cuota.
- **TikTok for Business: comentarios en La Mesa y números en Los Números** (2026-10-23, lo pidió
  el dueño; los comentarios escritos el 2026-11-07, los números el 2026-11-08). La API de siempre
  (developers.tiktok.com) no lee ni responde comentarios, y de la cuenta no da ningún número. La que
  sí es la *Accounts API* de TikTok API for Business: otra app, en business-api.tiktok.com, con su
  propia revisión, y según su documentación sirve también para cuentas personales de creador
  (salvo algunas métricas, la comparación de su rubro y las búsquedas, que piden acceso avanzado;
  el detalle y las direcciones, en `docs/levantamiento-terceros.md`, §3.5). Hecho y **cerrado**
  detrás de `TIKTOK_COMENTARIOS_ABIERTO_PARA` (README, «TikTok for Business: comentarios y
  números»): la segunda autorización desde Los Fierros («Activar TikTok for Business (comentarios
  y números) →»), la cola en La Mesa, la cuenta, su audiencia y cada video a fondo en la
  sincronización diaria, «TikTok, más a fondo» en Los Números, «En TikTok, más a fondo» en la
  pieza y «Lo que se busca en TikTok» en el compositor. **La app todavía no existe**: el registro
  de desarrollador está pendiente (hasta tres días), y la app se crea cuando lo aprueben. En orden:

  1. **[dueño]** En <https://business-api.tiktok.com>: la cuenta de TikTok For Business y el
     registro como desarrollador (enviado; esperar la aprobación).
  2. **[dueño]** Llenar el *Accounts API Access Application Form* (TikTok lo exige desde el
     2026-03-20 antes de mandar una app con «TikTok Accounts»; el enlace está en
     <https://business-api.tiktok.com/portal/docs?id=1738855242728450>). Uso: un programador de
     publicaciones donde cada creador modera y responde los comentarios de sus propios videos,
     aprobando cada respuesta, y ve los números de su cuenta y de sus videos.
  3. **[dueño]** Con el registro aprobado, *My Apps* → *Create an App*: nombre Tu Parrilla, el logo
     (sin logo, la autorización da error), la descripción de uso de arriba, y en *Scope of
     permission*, grupo «TikTok Accounts», los siete: *Get account user info*, *Get account
     insights*, *Get account media*, *Get account comment*, *Manage account comment*, *Business
     benchmark* y *Discover trending search keywords* (qué usa cada uno, en
     `docs/levantamiento-terceros.md`, §8). *TikTok account holder redirect URL*:
     `https://tu-parrilla.cl/api/social/tiktok/comentarios/vuelta/`, con la barra final. Mandar a
     revisión (dos a tres días hábiles). Los textos para pegar están en la carpeta del trámite
     (`Social verifications\TikTok - Comentarios (Business)\TEXTOS-FORMULARIO.txt`).
  4. **[dueño]** Con la app aprobada, en Vercel (production): `TIKTOK_BUSINESS_APP_ID`,
     `TIKTOK_BUSINESS_SECRET`, `TIKTOK_BUSINESS_AUTORIZACION` (la *TikTok account holder
     authorization URL* de *App Detail → Basic Information*, copiada **después** de marcar los
     permisos: los trae adentro) y `TIKTOK_COMENTARIOS_ABIERTO_PARA=<id del dueño>`. Redesplegar.
  5. **[dueño]** Probar con una cuenta real, mejor una personal: Los Fierros → detalle de la
     cuenta de TikTok → «Activar TikTok for Business (comentarios y números) →»; ver en La Mesa que
     los comentarios llegan y se responden, y al día siguiente, en Los Números → «⋯ Más», «TikTok,
     más a fondo» y la pieza de un video de TikTok. En el registro de Vercel, la línea
     «[tiktok-business] videos de …» dice si los ids de los videos calzan por id o por enlace:
     anotar el resultado en el README (lo que no se pudo probar está al final de esa sección).
  6. Si la revisión pide un video, el guion por permiso:
     - *Get account user info* y *Get account insights*: Los Números → «⋯ Más» → la tarjeta de la
       cuenta de TikTok en «Tus cuentas» (seguidores, visitas al perfil, alcance) y «TikTok, más a
       fondo» → «Tu audiencia».
     - *Get account media*: Los Números → «Ver todas las publicaciones →» → un video de TikTok →
       la pieza, con «En TikTok, más a fondo» (tiempo visto, lo vieron completo, de dónde llegaron).
     - *Get account comment* y *Manage account comment*: un comentario nuevo en un video → La Mesa
       con el comentario → aprobar la respuesta → la respuesta en la app de TikTok.
     - *Business benchmark*: «TikTok, más a fondo» → «Cuentas parecidas a la tuya», y cambiar «Tu
       rubro» para que se vea la comparación nueva.
     - *Discover trending search keywords*: La Parrilla → nuevo → marcar la cuenta de TikTok → «Lo
       que se busca en TikTok» → «Ver qué se busca» → tocar una para sumarla al texto, y una
       consulta en «Ideas para…».
     Empezar por Los Fierros → «Activar TikTok for Business (comentarios y números) →» con la
     pantalla de permisos de TikTok a la vista. El molde es `docs/tiktok-revision-guion.md`.
  6. Funcionando: `TIKTOK_COMENTARIOS_ABIERTO_PARA=1`, y pasar a la cuenta lo que vive en
     `ajustes` (`docs/deuda-tecnica.md`). Al abrirlo, cambiar también la frase «En TikTok todavía
     no hay cola de comentarios.» del bloque de la palabra clave —en el panel
     (`schedule/regla-clave.tsx`) y en el teléfono (`mobile/src/lib/regla.ts`, que sale por aire)—
     y en su wiki (`la-parrilla.md`, `app-movil.md`): mientras esté cerrado para todos, es cierta.
     Y sacar de la wiki (`los-fierros.md`, `los-numeros.md`, `la-parrilla.md`) que TikTok for
     Business se ve solo en algunas cuentas.

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
    página de Facebook, para que se vea que no la pide; @vicente.ingeniero tiene página, y conectarlo
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

  Cómo saber si contestaron, sin depender del correo (que puede llegar a pyxis.latam o a
  parejavice, y traer una pregunta en vez de la aprobación): en
  <https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas?project=portafolio-page>,
  «Queries per day» deja de decir 10.000 cuando la aprueban. Revisado el 2026-11-09: sigue en
  10.000, con 738 usadas ese día (4 subidas); el cupo aparte de subidas es de 100 al día, así
  que hoy el cupo no frena nada.

  Para que el revisor pueda probar La Mesa tiene que haber un comentario de YouTube en
  «Pendientes»: el 2026-10-26 quedó uno en el Short público «canal video 2» de Pyxis
  oficial. La Mesa solo lee los videos de los últimos siete días, y los comentarios de YouTube
  se borran a los 30, así que si la revisión se alarga más allá del 2026-11-25 hay que subir
  otro Short público desde Studio, sincronizar al revisor y comentarlo desde parejavice. Desde el
  2026-11-07, «Desconectar» el canal en Los Fierros también borra ese comentario en el acto, y
  reconectar no lo trae de vuelta (el Short tiene más de siete días): para renovar el permiso del
  revisor se usa «Reconectar», nunca «Desconectar».

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
  aprobarse, ver «Después de aprobar» en el guion, y recién entonces la segunda verificación,
  la de YouTube Analytics («La analítica: segunda verificación», en el mismo guion).
- **Por revisar: cuánto guarda el chef la copia del material de una comanda** (2026-11-06).
  `/privacidad`, «La Cocina», dice que el chef baja una copia del material a los servidores de
  Pyxis para editarlo, pero no cuánto dura: Tu Parrilla borra lo suyo (la cámara de frío, cuando
  el usuario lo saca; lo cocinado sin programar, a los 30 días), y la carpeta
  `material/cocina/<comanda>/` del chef no tiene plazo escrito. Pedirle al chef (marca-personal)
  un plazo y, cuando lo tenga, sumarlo a `/privacidad`.
- **Por revisar: un canal de YouTube revocado desde Google se sigue leyendo** (2026-11-07, visto
  al cambiar «Desconectar»). Quitar Tu Parrilla en myaccount.google.com no le avisa a Tu Parrilla:
  la fila conserva su `refresh_token`, y como las estadísticas se leen con la API key
  (`youtubeConnector.ensureCredential` solo mira que el token exista), el sync diario sigue
  refrescando los contadores de ese canal. El sondeo de comentarios sí falla, con
  `invalid_grant`, y nadie lo convierte en desconexión. `/privacidad` ofrece revocar desde Google
  como alternativa a «Desconectar»: lo honesto es que un `invalid_grant` deje la cuenta
  desconectada y con lo de YouTube borrado (`desconectarCuenta`, en
  `src/lib/social/desconectar.ts`).
- **[dueño] Vercel Pro antes de abrir a terceros.** El plan Hobby es de uso personal y no
  comercial (`docs/levantamiento-terceros.md` §5).
- **[dueño] La app en la Play Store: en revisión; juntar doce probadores** (2026-10-16;
  al día el 2026-11-08). La cuenta de Play Console es personal y la app, `cl.tuparrilla.app`, se
  llama **«Parrilla»** en la ficha (decisión del dueño, 2026-11-08; el binario 1.2.0 dirá «Tu
  Parrilla» bajo el ícono). El 2026-11-08 quedaron llenas todas las tarjetas de Contenido de la app,
  la ficha (con 5 capturas, dos nuevas con datos de prueba) y la categoría Business, y se armó la
  prueba cerrada «Closed testing - Alpha»: solo Chile, la lista «Tu Parrilla - interno» (10) y la
  versión con el `.aab` 1.1.0 (código 2), con las instrucciones del revisor que piden cerrar y
  reabrir la app una vez (la 1.1.0 de la tienda trae el código del 2026-10-16 y lo nuevo llega por
  aire en la segunda apertura). **Enviado a revisión el 2026-11-08.**
  Después: Google revisa en días; aprobada, el enlace para unirse aparece en la prueba cerrada, y
  hacen falta **al menos doce** probadores que acepten y se queden **catorce días** antes de pedir
  producción (faltan dos o más: sus Gmail a la lista, o un Grupo de Google). Sin países de Europa,
  por el estado de comerciante (la entrada de abajo). Lo que se respondió en cada tarjeta, el
  paso a paso y lo que sigue están en la carpeta «Google Play» del escritorio de Vicente
  (`PASOS.txt`, recuadro del 2026-11-08, y `TEXTOS-FORMULARIO.txt`); el porqué, en
  `docs/play-store.md`. Desde el 2026-11-08 lo siguiente sale sin entrar a la consola: la cuenta
  de servicio `eas-submit` tiene su clave en EAS y el secreto `EXPO_TOKEN` está en GitHub (la
  entrada del build 1.2.0, abajo).
- **[dueño] Play Console: declarar el estado de comerciante antes de febrero de 2027**
  (2026-11-06). Google lo exige a todos los desarrolladores. Si no se hace, borra el perfil y las
  apps de Google Play en todo el mundo. No frena la revisión de hoy. **No declararlo en la cuenta
  personal tal como está:** como comerciante, Google publica en la Unión Europea el nombre legal y la
  dirección del perfil de pagos, que hoy es la de la casa del dueño. Dos caminos: una cuenta de
  organización a nombre de Pyxis con su dirección comercial y la app traspasada a ella (lo mismo
  que «TikTok y Google con la misma entidad»), o cambiar antes la dirección del perfil de pagos por
  una comercial. Tu Parrilla es un producto comercial de Pyxis: la respuesta honesta es «trader».
  Otra razón para la cuenta de Pyxis: en una cuenta personal nueva, Google exige una prueba
  cerrada de 12 probadores durante 14 días antes de pedir producción, como lo pide el Dashboard de
  la app. Una cuenta de organización no tiene esa exigencia. Verificarlo en la ayuda de Google al
  crearla.
- **[dueño] El build 1.2.0 de la app, a la Play Store** (2026-11-02; listo para armarse desde el
  2026-11-07). Todo lo nativo que esperaba un build ya está en `main`: la cámara y el micrófono de La
  Cocina, `expo-clipboard`, `expo-audio` (con `expo-asset`, que pedía), `expo-notifications`,
  `react-native-svg` (el corte con las curvas del panel), `expo-video` (el mesón), `expo-haptics` (sin
  usar todavía) y fuera `@react-native-community/datetimepicker`; los módulos de Expo, en los parches que
  pide el SDK 57 (`npx expo-doctor` sin avisos). Nada de la 1.2.0 llega por aire a la 1.1.0
  (`runtimeVersion` es la versión de la app). Falta solo lo del dueño, en orden, con el detalle en
  `docs/play-store.md`, «La 1.2.0, de punta a punta»:
  1. las credenciales de FCM (la entrada de abajo): hechas el 2026-11-08, el `google-services.json`
     en `main` y la clave en EAS;
  2. lo que el flujo necesita: hecho el 2026-11-08, el secreto `EXPO_TOKEN` en GitHub y la clave de
     la cuenta de servicio de Google Play en EAS (`docs/play-store.md`, Parte 4);
  3–4. hechos el 2026-11-08: el flujo «App a la tienda» armó la 1.2.0 (código de versión 3) y
     `eas submit` la mandó a la pista interna sin errores (la app en revisión no la rechazó por
     «draft»);
  5. en la Play Console, la seguridad de los datos con lo de «CUANDO SUBA LA 1.2.0» de
     `TEXTOS-FORMULARIO.txt` y el token de los avisos, y la versión publicada;
  6. probarla en el teléfono: la cámara y sus permisos, una subida de varios GB, «Avisarme», el mesón
     y el corte; y, desde la actualización por aire del 2026-11-11, «Lo que trajo» con el número del
     ícono y «Avisos de lo bueno» en Ajustes (`mobile/README.md`, «Lo de la 1.2.0 sale de `main`»).

  Y en el App Store cuando exista la cuenta de Apple (ver «La app en iPhone», abajo).
- **Revisar el aviso de actualizar la app, y subir la mínima a su tiempo** (2026-11-11). La app
  avisa cuando hay una versión nueva en la tienda y, por debajo de la mínima, no deja seguir
  (`src/lib/version-de-la-app.ts`; el detalle en `mobile/README.md`, «Cuando hay que ir a la
  tienda»). Hoy la recomendada es la 1.2.0 y la mínima la 1.1.0, que no bloquea a nadie. Falta:
  1. **[dueño]** probarlo en un teléfono con la 1.1.0, ya con la actualización por aire: que salga
     «Hay una versión nueva» unos segundos después de abrir, que «Actualizar» abra la Play Store, que
     «Después» no vuelva a preguntar y que quede «Actualizar la app» al pie de Ajustes. Nada de esto
     se probó en un teléfono.
  2. Subir la mínima a 1.2.0 **solo cuando la 1.2.0 esté en producción en la Play Store para todos**
     (hoy está en la pista interna): antes, quien no es probador queda bloqueado sin poder
     actualizar. Antes de subirla, confirmar en la Play Console que la versión publicada es la 1.2.0.
  3. La app de prueba «Vicente · Números» (el APK instalado a mano en septiembre, otro
     identificador) también recibe el aviso, pero su botón lleva a «Tu Parrilla», que es otra app:
     desinstalarla en vez de actualizarla.
  4. Cuando exista la app de iPhone, llenar `ios` con la dirección del App Store.
- **[dueño] Las credenciales de los avisos al teléfono (FCM), antes del build 1.2.0**
  (2026-11-07). El código está (`src/lib/push/`, `mobile/src/lib/avisos.ts`); sin esto, en Android
  «Avisarme» dice que no se pudieron encender. Lo pide la documentación de Expo SDK 57, «Add Android
  FCM V1 credentials». Ningún paso pide pegar un secreto en un chat:
  1–3. Hechos el 2026-11-08: el proyecto de Firebase es `tu-parrilla`, propio y no el de Google
     Cloud de YouTube (`portafolio-page`), que no se toca mientras dure su auditoría; la app
     Android `cl.tuparrilla.app` está registrada, y su `google-services.json` está en `mobile/`,
     nombrado en `mobile/app.json` (`android.googleServicesFile`). Ese archivo **sí** va al
     repositorio: según Expo, trae identificadores públicos, y EAS lo necesita en el build.
  4–6. Hechos el 2026-11-08: la clave de la cuenta de servicio de Firebase está en EAS (expo.dev →
     Credentials → Android → `cl.tuparrilla.app` → FCM V1 service account key, proyecto
     `tu-parrilla`). Si hubiera que cambiarla: Firebase → Configuración del proyecto → Cuentas de
     servicio → Generar nueva clave privada, y reemplazarla ahí. Es secreta: nunca al repositorio
     ni a un chat (`mobile/.gitignore` ignora los `*-firebase-adminsdk-*.json`).
  7. Arma el build 1.2.0 (la entrada de arriba). Para probar: entra en la app, toca «Avisarme» y
     contéstale algo desde Las Sugerencias a una sugerencia tuya; tiene que llegar «Te respondimos
     en el libro de sugerencias».
  7. Solo si un día enciendes la seguridad extra de push de Expo (expo.dev/settings/access-tokens),
     crea ahí un access token y ponlo en Vercel como `EXPO_ACCESS_TOKEN`; si no, Expo rechaza cada
     aviso. En iPhone, el build de iOS ofrece crear la llave de push de Apple cuando exista la
     cuenta.
- **[dueño] Probar TikTok desde el teléfono con una cuenta real** (2026-11-07). Llegó por aire a la
  1.1.0 el 2026-11-07; se probó en Expo web contra una API falsa, no contra TikTok: programar desde
  el teléfono una foto a una cuenta de TikTok y mirar que salga con la privacidad elegida.
- **[dueño] Probar desde el teléfono las opciones de YouTube** (2026-11-08). Llegaron por aire a la
  1.1.0 el 2026-11-08; no se probaron en un teléfono ni en Expo web: programar desde el teléfono un
  video no listado a una playlist y mirar que salga así.
- **[dueño] Probar las opciones de YouTube con un canal real** (2026-11-08). Las pruebas cubren lo
  que se le manda a YouTube, no lo que YouTube hace: falta subir un Short no listado, uno con
  «Hecho con IA» (mirar en YouTube Studio que quedó la declaración de contenido alterado) y uno con
  playlist, y ver que entró al final de ella. Si `playlistItems.insert` rechaza un video recién
  procesado, el aviso sale en el editor; ver el bloque de YouTube en `README.md`, «Varias cuentas
  de una misma red».- **[dueño] La app en iPhone** (2026-10-16). El código ya está listo para iOS; faltan la
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
  redactó Claude a partir del código, no alguien con criterio legal. Desde el 2026-11-09 la
  portada suma en público las vistas y los «me gusta» de todas las cuentas conectadas de
  Instagram, Facebook y TikTok (`src/lib/portada-numeros.ts`), y `/privacidad` lo dice: que
  revise también si ese uso calza con los términos para desarrolladores de Meta y de TikTok.
  YouTube quedó fuera porque sus políticas no dejan crear métricas con sus datos (§III.E.4.h).
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
  Con el traspaso, si se quiere, renombrar el proyecto (2026-11-08: el dueño preguntó): el nombre
  `vicente-numeros` es el `slug` de `mobile/app.json` y solo se ve en expo.dev; en el teléfono y en
  la tienda la app se llama por `name`. Renombrarlo en expo.dev obliga a cambiar el `slug` en
  `main` **y** en `ota-1.1.0` a la vez: si no calza con el del servidor, EAS rechaza el build y
  la publicación por aire. Por eso no se hace en medio del build 1.2.0.

## Finanzas: planes y pagos

Pedido del dueño el 2026-10-23, como uno de los dos ejes de trabajo, junto con los trámites. Desde
el 2026-11-08 hay dos planes, el gratis y el pagado («Maestro Parrillero», $34.990 al mes), con las mismas
funciones y distintos topes, espacio, tokens de IA y prioridad en las colas; el admin los edita y da
el pagado como cortesía en Los Maestros (README, «Los planes»). Nadie paga todavía: el README sigue
diciendo «Sin suscripción», y es cierto.

- **[dueño] Probar y abrir el cobro con Mercado Pago** (2026-11-08; contrastado con la
  documentación el 2026-11-11). Está escrito y **cerrado** detrás de `PAGOS_ABIERTO_PARA` (README,
  «Los planes»; el diseño en `docs/superpowers/specs/2026-11-08-planes-design.md`). No se probó
  contra Mercado Pago. El 2026-11-11 se leyó por fin su documentación (agregándole `.md` a cada
  dirección) y se corrigió lo que decía distinto: la prueba gratis va como `start_date`, la
  cancelación acepta `canceled` y `cancelled`, la gracia es de 11 días porque reintenta 4 veces en
  10, y solo un cobro de verdad alarga el plan. Lo que falta es del dueño, en orden y con cada clic,
  en `docs/mercadopago-paso-a-paso.md`: la cuenta de Pyxis con el retiro al Santander; la
  aplicación; un comprador de prueba y las credenciales de prueba de la aplicación; el webhook
  `https://tu-parrilla.cl/api/pagos/mercadopago` con «Planes y suscripciones» y «Pagos»; las tres
  variables en Vercel; la prueba completa, con un cobro aprobado y uno rechazado; y, con lo de abajo
  listo, el token de producción y `PAGOS_ABIERTO_PARA=1`. Lo que hay que mirar en la prueba está en
  esa guía, «Lo que la prueba tiene que mirar».

  Se cobra solo en la web: lo que se vende dentro de una app de Android tiene que ir por Google Play
  Billing, con su comisión, y cobrar en la web sin botón ni enlace de pago en la app no lo exige. Si
  algún día se cobra en la app, volver en la Play Console a «Content rating» («purchase digital goods» pasa a Yes) y a «Data safety» (sumar el historial de
  compras); «Financial features» sigue en «ninguna»: una suscripción al propio servicio no cuenta
  (anotado el 2026-11-08, al llenarlas).
- **[dueño] Lo que pide cobrar, fuera del código** (2026-10-23; al día el 2026-11-08):
  - la cuenta de Mercado Pago a nombre de Pyxis, con el retiro a la cuenta del Santander; para la
    fase 2, sus credenciales (`MERCADOPAGO_ACCESS_TOKEN` y el secreto del webhook) y las de prueba,
    con un vendedor y un comprador de prueba (`docs/mercadopago-paso-a-paso.md`);
  - la boleta o factura electrónica de cada cobro, al SII: Mercado Pago no la emite;
  - que `/terminos` y `/privacidad` cuenten los planes, el cobro, la prueba y la baja, en la misma
    revisión del abogado («Que todo quede a nombre de Pyxis», arriba), antes de abrir el cobro; y que
    `/borrar-mis-datos` diga que lo cobrado se guarda: al borrar a una persona, sus suscripciones y
    cobros —con el correo con que pagó— quedan sin dueño, para la contabilidad;
  - Vercel Pro, que ya hacía falta antes de abrir a terceros.

  Al abrir el cobro, cambian también el README (la frase «Sin suscripción», arriba de todo) y la
  portada, que debe seguir describiendo la app y enlazando Privacidad y Términos.

## Features y trabajo de código

- **Lo que trajo, en el panel** (2026-11-11). Las cuatro fases de «Lo que trajo» están hechas en la
  app del teléfono —la fila con lo nuevo de cada corte, el número del ícono, los hitos con su
  celebración, la racha y el aviso de lo bueno—; el panel web no tiene nada de eso. Llevarlo a La
  Parrilla del panel quedó fuera a propósito (el diseño, «Lo que no entra»:
  `docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`). Las rutas y la lógica ya están en el
  servidor (`src/lib/lo-que-trajo.ts`, `hitos.ts`, `racha.ts`).
- **[dueño] El antes y el después de La Cocina en la portada (#324)** (2026-11-09; la sección
  está desde el 2026-11-12, `src/components/landing.tsx`, «Los cortos te llegan hechos»). Hoy
  muestra los dos mejores cortos de @vicente_pareja_j (los eligió el dueño) como tarjetas que
  enlazan a cada reel, sin plazo de entrega prometido. Falta el antes y el después de cada uno: el
  tramo del video largo (el video 10, de 7:53 a 8:59 y de 10:14 a 11:27) y el corto terminado. Los
  archivos los pasa el dueño por privado, no por el issue, porque el repo es público; con ellos, cada
  tarjeta suma sus dos videos.
- **«Sincronizar ahora» le puede quitar a una publicación su lectura de las 48 horas** (2026-11-08,
  al sumar `viewsA48h`, #358). La lectura del día (`post_metrics`, una por publicación y día) se
  reescribe entera en cada sincronización, también su `captured_at`. La ventana de las 48 horas
  (de 48 a 72, `src/lib/igual-edad.ts`) no tiene día de más, a diferencia de la de los 7 días:
  una sincronización a mano H horas después del cron de la mañana corre esa lectura H horas, y lo
  publicado entre 72 − H y 72 horas antes del cron se queda sin `viewsA48h` (null, nunca 0). Lo
  mismo si el cron de un día falla. Arreglarlo es elegir: estirar la ventana (pierde precisión
  justo cuando la publicación crece rápido) o guardar la lectura de las 48 horas aparte, la
  primera vez que cae en la ventana, sin que la reescriba la del mismo día.
- **El teléfono no muestra el aviso de la playlist de YouTube** (2026-11-08). Un video que salió sin
  entrar a su playlist lo dice en el editor del panel y en `GET /api/schedule/posts` (`aviso`); el
  teléfono no tiene una vista de lo publicado por destino donde ponerlo. Si se le agrega una, el
  aviso está en `scheduled_post_targets.aviso`. Tampoco lo cuenta el resumen del día.
- **Borrar una cuenta que ya entró, con todos sus datos** (2026-11-08, al llenar «Data safety» en
  Play). `/borrar-mis-datos` promete borrar todo dentro de 30 días a quien lo pida por correo, pero
  no hay cómo: «Quitar», en Los Maestros, solo borra a quien nunca entró (`quitar` en
  `src/lib/usuarios.ts`), y las tablas del usuario no borran en cascada. Mientras tanto se hace a
  mano. Falta una acción del admin, «Borrar la cuenta y sus datos», que en una transacción borre
  lo de esa cuenta en cada tabla (o sume `ON DELETE CASCADE` con una migración), su media en R2,
  sus tokens de push y sus llaves, y cierre o borre sus pedidos del libro de sugerencias en GitHub;
  con su test de aislamiento. Si algún día la persona lo puede pedir sola desde Tu Cuenta, Play
  pide además un botón dentro de la app.
- **`/terminos` no dice que Tu Parrilla es para mayores de 18** (2026-11-08). En Play se declaró
  «18 and over» con los menores bloqueados; conviene que los términos lo digan, en la revisión del
  abogado («Que todo quede a nombre de Pyxis»).
- **Música en videos con bibliotecas con licencia** (2026-11-06; el dueño lo pospuso: caro y no lo
  bastante bueno por ahora). Las API de Instagram, TikTok y YouTube no dejan ponerle a un video su
  propia música; la excepción es la Audio API de Instagram para reels, con Facebook Login, que es
  el camino aparte y el preferido. Bibliotecas con licencia y API para apps: la Partner API de
  Epidemic Sound (la licencia es de la app, con sublicencia y safelisting en YouTube, Instagram,
  Facebook y TikTok; el precio, por ventas; <https://developers.epidemicsound.com/docs/>) y la API
  de Soundraw (hecha con IA, US$29,99 al mes por 100 canciones; sin confirmar qué cubre la licencia
  para los usuarios finales; <https://soundraw.io/api>). Es música de producción, no éxitos, y
  mezclarla con el video pide un servidor con ffmpeg: Vercel no sirve para eso. Descartadas:
  Pixabay (su API no trae música), la biblioteca de audio de YouTube (sin API), Uppbeat (sin API) y
  Mubert (la sublicencia, desde US$499 al mes).

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

- **Historias en Instagram y Facebook: lo que falta** (2026-10-25). El motor está hecho —el
  contrato, los publicadores, la secuencia en orden, el choripán al paso y la API y el CSV—;
  el diseño entero está en `docs/superpowers/specs/2026-10-24-historias-design.md`. Falta:
  - el compositor del panel, con el selector «Post · Historia» y las tarjetas verticales
    (parte 2), y en La Parrilla el número de la secuencia («1/3») junto al corte y, en el
    detalle del post, «Historia en Instagram · @cuenta». El teléfono ya las arma (parte 3,
    2026-11-07): el compositor tiene que leer y escribir el campo `modo` del borrador
    (`esBorradorDeHistoria`, en `src/lib/borrador.ts`). Hasta entonces abre un borrador de historia
    del teléfono como un post, y al guardarlo deja de ser historia;
  - en el teléfono, ver el primer cuadro de un video en el visor (hoy, «▶» y la duración: sacarlo
    sin `expo-video` pide una miniatura del servidor; `expo-video` entró con el build 1.2.0 para el
    mesón, pero el visor también va por aire a la 1.1.0, que no lo trae) y cambiar el orden de una secuencia ya
    programada (hoy se borra y se programa de nuevo);
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
  compartidos con el panel. La parte 3 (La Mesa, como tarjeta de La Parrilla) y TikTok con la
  palabra clave en Publicar llegaron el 2026-11-07. Falta: Threads y X desde Publicar cuando
  salgan de «Próximamente»; hasta entonces un borrador que va a una de esas redes se programa en
  el panel (`soloEnElPanel` en `src/lib/borrador.ts`). El nombre y el ícono «Tu Parrilla» ya están en
  `mobile/app.json`, con el identificador `cl.tuparrilla.app`: llegan con el primer build de
  la Play Store, no por aire. Cuando ninguna
  instalación vieja las pida, salen `/api/mobile/overview` y `/api/mobile/schedule/check`,
  que la app nueva ya no usa, y la parte de `soloEnElPanel` y de `REDES_MOVIL` que cuida a una app
  sin el encabezado `X-Parrilla-Publicar`.

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
  red); un archivo de tokens común para el panel y la app; y la vibración en la app, una corta
  cuando algo sale o se quema (tanda 6 de la auditoría): `expo-haptics` ya viaja en el build 1.2.0
  (2026-11-07), sin usarse, para que esto llegue por aire. Falta decidir cuándo vibra —solo con la
  app abierta no se entera de nada, y los avisos al teléfono ya suenan— y detectar en La Parrilla el
  paso de un corte a servido o a quemado entre dos lecturas. `(tabs)/index.tsx` también va a
  `ota-1.1.0`: pedir el nativo con `requireOptionalNativeModule('ExpoHaptics')`, como el audio. El corte en SVG llegó con la 1.2.0 (2026-11-07); falta pasar a SVG la pieza de sushi
  del día (`mobile/src/components/pieza-sushi.tsx`, todavía con vistas), que ya es puro JavaScript
  sobre ese build y no se copia a `ota-1.1.0`.
- **Gamificar las notificaciones de cada red** (2026-10-25, lo pidió el dueño). Que lo que cada
  red le avisa a un creador —seguidores nuevos, comentarios, reacciones a un post— se viva en Tu
  Parrilla como un juego, red por red. Falta definir con el dueño qué cuenta como notificación y
  cuál es el juego (puntos, rachas, logros, en qué pantalla). Hasta donde se sabe, ninguna de las
  APIs que se usan entrega la bandeja de notificaciones de la red, así que el juego se arma con lo
  que ya se lee: los comentarios de La Mesa, las métricas de cada post y los seguidores de cada
  cuenta (`src/lib/social/account-metrics.ts`). Desde la 1.2.0 la app tiene avisos al teléfono
  (`src/lib/push/`, ver «Avisos al teléfono» en el `README.md`): un juego que avise usa ese mismo
  camino. Se cruza con «Mientras no mirabas», de la entrada de arriba, que también necesita guardar
  la última visita por usuario.
- **Un mensaje a cada seguidor nuevo** (2026-11-11, lo pidió el dueño). Que cuando alguien
  empieza a seguir una cuenta conectada le llegue un mensaje directo de bienvenida, escrito por el
  dueño (o con la IA, como los borradores de La Mesa). Antes de diseñar, verificar en la
  documentación de cada red qué se puede, porque hasta donde se sabe es lo que lo frena:
  - ninguna de las APIs que se usan avisa de un seguidor nuevo ni entrega quién es: hoy solo se lee
    cuántos hay (`src/lib/social/account-metrics.ts`);
  - en Instagram y Facebook, una empresa no puede abrirle una conversación a alguien que no le
    escribió antes; puede contestar dentro de las 24 horas desde su último mensaje, o mandarle un
    privado a quien comenta, que es lo que ya está construido y espera la aprobación de Meta
    («El privado de Meta», abajo);
  - TikTok y YouTube no tienen mensajes directos en sus APIs.

  Si se confirma, lo posible está cerca: el privado a quien comenta (ya hecho), y un mensaje de
  bienvenida o «ice breakers» para quien escribe por primera vez, en Instagram y Messenger. Se
  cruza con «Gamificar las notificaciones de cada red», arriba, que tampoco tiene cómo enterarse
  de un seguidor nuevo.
- **Cupos y reparto de los crons por usuario** (`docs/levantamiento-terceros.md` §5.4). Hace
  falta cuando la beta pase de unos diez usuarios. Desde el 2026-11-08 la prioridad del plan ordena
  las colas (README, «Los planes»); falta el cupo por usuario y la cola de trabajo.
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
  la historia, pero no lo ganado ni el arrastre; (2) **el permiso de YouTube Analytics**
  (`yt-analytics.readonly`). **El (2) quedó escrito y cerrado el 2026-11-08**: lee la historia
  del canal día por día, la retención de cada video, las fuentes de tráfico y la audiencia, y la
  guarda mientras el dueño autoriza (ver README, «YouTube Analytics: escrito y cerrado»). Abrirlo
  es la **[dueño]** segunda verificación de Google, que no se pide antes de que aprueben la
  auditoría de cuota: el paso a paso está en `docs/google-verificacion-guion.md`, «La analítica:
  segunda verificación». Lo que sigue fuera, también con Analytics: lo ganado y el arrastre
  calculados por Tu Parrilla con datos de YouTube (§III.E.4.h); eso es el permiso aparte de
  §III.L, que nadie pidió, y las filas de YouTube de la Data API siguen con su plazo de 30 días.
  Por hacer cuando se abra: lo de Analytics solo se ve en el panel; no está en la planilla de
  «Llevar para la casa», en la app del teléfono ni en la API de métricas.
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
- **DevOps y seguridad: lo que falta** (revisado el 2026-11-11, lo pidió el dueño; reemplaza la
  revisión «no urgente» del 2026-11-02). Ya hecho ese día: Next a 16.4.3 por dos avisos críticos
  (#386), `npm audit --omit=dev --audit-level=critical` en el CI, el respaldo, que fallaba al
  instalar `age` con `apt`, y las protecciones de GitHub. Lo que sigue, en orden:
  1. **[dueño]** Exigir la verificación en dos pasos en la organización (Settings de `Ribs-org` →
     Authentication security → «Require two-factor authentication…»). El dueño ya la tiene; el
     colaborador externo de la organización no (2026-11-11), y exigirla ahora le quita el acceso:
     primero que la active (github.com/settings/security), o sacarlo si ya no trabaja en el repo.
     Lo demás de GitHub quedó encendido ese día: el grafo de dependencias, el escaneo de secretos con
     push protection, las actualizaciones de seguridad de Dependabot, el reporte privado de
     vulnerabilidades y CodeQL (README, «Cómo entra un cambio»), y la reja de `main` pasó a pedir pull
     request y a valer para el admin.
  2. **[dueño]** Un vigía que avise si algo deja de pasar: Healthchecks.io gratis, con un aviso al
     terminar `publish-social` (cada 5 minutos, por el pinger de cron-job.org, que ya se cayó una
     vez en silencio) y otro al terminar `respaldo.yml`. Hoy, si el pinger se cae o el respaldo
     falla, nadie se entera. Falta la cuenta; el código de los avisos es corto.
  3. **[dueño]** Sentry (gratis) o similar en el sitio: hoy los errores solo quedan en los logs de
     Vercel, que en el plan Hobby duran poco. Falta la cuenta y su DSN en Vercel.
  4. **[dueño]** Restaurar un respaldo una vez: la entrada «Probar una vez que un respaldo se
     restaura», arriba. De paso, que el respaldo use un rol de la base de solo lectura.
  5. Los secretos de Actions (`DATABASE_URL_UNPOOLED`, `EXPO_TOKEN`) en un environment limitado a
     `main`, y no a nivel de repositorio, donde los lee cualquier rama. **[dueño]** para crearlo.
  6. Escribir cómo se vuelve atrás: el rollback de un despliegue en Vercel, una migración que no
     tiene reversa y restaurar un respaldo.
  7. Un formateador (Prettier) con `--check` en el CI. El primer pase cambia casi todos los
     archivos, así que va solo, sin otras ramas abiertas que lo choquen.
  8. Lo que ya estaba en `docs/deuda-tecnica.md`: la CSP (en modo Report-Only primero) y el límite
     de intentos compartido entre instancias.
  9. Las dependencias que quedan: #288 (las otras 17 del sitio, que reemplazó a la #242) y #241
      (las acciones), con su CI; los dos avisos altos de `undici` y `zod` que trae `ai`; y los de
      la app, que vienen de las herramientas de Expo y se arreglan con el SDK 58.
  10. Más adelante: pruebas de punta a punta de entrar, programar y publicar, y una prueba de
      humo después de cada despliegue.
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
