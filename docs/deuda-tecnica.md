# Deuda técnica

Lo que se dejó a medias a propósito, con el porqué y lo que costaría terminarlo. No es una
lista de deseos: cada entrada nació de un problema real que se parcheó para seguir.

---
## La página de un usuario se crea al invitarlo, pero nadie rellena hacia atrás

**Abierto desde 2026-09-24.**

Desde que existe la página por usuario, `invitar()` y `asegurarAdmin()` la crean junto con
el usuario, y de ahí sale el invariante que el resto del código puede suponer: **todo
usuario tiene exactamente una página**. Para los usuarios creados **antes** de ese cambio no
hay nada que la cree: `asegurarAdmin()` repara solo al admin, y el migrador solo adopta
perfiles huérfanos, no crea los que faltan.

Hoy no muerde —se consultó la base al desplegarlo: un solo usuario, el admin, con su página
ya creada—, así que no se escribió un relleno para cero filas. Pero si alguna vez hay
usuarios sin página, el síntoma va a ser silencioso: su dominio responde 404 en todo, sin
error. Un `select` de usuarios sin fila en `profiles` lo detecta en un segundo, y el relleno
es el mismo `crearPaginaDe` en un bucle.

## Dos cosas anteriores que la página por usuario dejó más expuestas

**Anotado el 2026-09-24.** Ninguna es de esa entrega; las dos quedaron con más superficie.

- **`isPublished` se filtra en memoria, no en el SQL** (`src/app/[slug]/page.tsx`). Un
  perfil despublicado sale igual de la base para descartarse después, que es lo contrario
  del principio que enuncia el comentario de `getProfileBySlug` dos archivos más allá. No es
  una fuga —la fila nunca llega al cliente—, pero la incoherencia invita a copiar el patrón.
- **Una petición anónima puede escribir.** `adminId()` llama a `asegurarAdmin()`, que hace
  un `insert … on conflict do update` si falta la fila del admin. Antes eso colgaba solo de
  la raíz `/`; ahora también de `/<cualquier-cosa>`, o sea de un espacio de nombres
  ilimitado. El patrón es anterior y está asumido, pero conviene saber que creció.

## La suite falla unas 3 pruebas en 1 de cada 20 corridas

**Abierto desde 2026-09-24.**

`npx vitest run` pasa 725/725 casi siempre, y de vez en cuando caen tres. Reprodujo una vez
en veintiuna corridas y no volvió en las siguientes, así que no se pudo capturar cuáles ni
con qué mensaje. Las sospechas razonables, por orden: estado compartido entre archivos de
test, un mock que se filtra entre ellos, o una dependencia del orden en que vitest los
reparte entre procesos.

Mientras no se identifique, **una corrida roja en CI no se puede dar por buena sin mirar qué
falló**: puede ser esto o puede ser real, y la diferencia importa.

Una causa sí apareció después: un `await import()` dentro de un `it` paga la transformación de
todo lo que trae en medio de la prueba, y bajo carga se pasa de `testTimeout`. Los que había se
movieron arriba del archivo (`aislamiento.test.ts`, `usuarios.test.ts` y, el 2026-10-21,
`filters.test.ts`); no se sabe si era la única.

## La prueba que «no envejece» solo mira directorios

**Abierto desde 2026-09-24.**

`src/lib/slugs.test.ts` lee `src/app` y `public/` del disco para exigir que toda ruta real
esté en `RESERVADOS`, y esa es su gracia: agregar una ruta y olvidar la lista rompe el test
en vez de romperle la página a un usuario.

Pero solo lee **directorios**. Una ruta de convención por archivo —`sitemap.ts`,
`manifest.ts`, `opengraph-image.tsx`— no la vería. `robots.ts` ya existe y está cubierto
solo porque alguien lo escribió a mano en la lista, que es exactamente lo que este test
existe para no depender. Hoy no falta ninguna; la garantía es más chica que su promesa.

## El arnés de aislamiento solo llega a `src/lib`

**Abierto desde 2026-09-24.**

`aislamiento.test.ts` importa funciones de `src/lib` y comprueba que cada una ate su
consulta al dueño. Eso deja sin protección cualquier consulta escrita **fuera de
`src/lib`**. La del calendario (`schedule/page.tsx`) lo estuvo hasta el 2026-09-29, cuando
El Fuego necesitó la misma lectura y se movió a `src/lib/social/publish/cortes.ts`, donde
el arnés sí la ve. Eso achicó la superficie en una, no la cerró: al 2026-10-21, `grep -rln
"getDb()" src/app` (sin contar los tests) da doce archivos que arman su propio SQL, en
cuatro clases:

- **Tres páginas del panel**: `schedule/[id]/page.tsx`, `profiles/[id]/page.tsx` y
  `accounts/elegir/page.tsx`.
- **Las acciones de servidor**, `admin/actions.ts`, con decenas de consultas (la guardia de
  `rescheduleTarget` que se añadió el 2026-09-29 es una de ellas).
- **Siete rutas de API**: `api/schedule/posts`, `api/mobile/schedule`, `api/mobile/overview`
  (esta con dos consultas, una por ventana), `api/mobile/schedule/accounts`,
  `api/mobile/tema`, `api/track/visit` y `api/track/click`.
- **La página de un borrado** (`(legal)/borrado/[codigo]/page.tsx`), que es la excepción de
  más abajo.

De todas ellas, solo las tres primeras rutas se leyeron a mano el 2026-09-24 y tenían el
dueño en el `WHERE`; del resto esta entrada no afirma nada, y las dos de `api/track/*`
escriben colgando de un perfil, que es otra forma de acotar. Lo que sí vale para todas:
nada impide que mañana alguien mueva un filtro al `ON` de un join sin que ninguna prueba
chille.

El calendario no se extrajo por criterio sino porque otra pantalla la pedía; el patrón
real del repositorio sigue siendo que el arnés llega a `src/lib` y no a las páginas, las
acciones ni las rutas de API que arman su propio SQL. Cerrarlo de verdad pide decidir
cuáles de esas doce se trasladan a `src/lib`, o extender el arnés para que también las
alcance ahí donde viven.

Y hay una excepción al revés, dentro de `src/lib`: `src/lib/social/meta-bajas.ts`
(`darDeBaja`, `pasosDeBorrado`, `borrarDatosDe`) busca por `social_accounts.meta_user_id` y
**no** filtra por dueño, a propósito. Quien pide ahí no es un dueño con sesión sino Meta,
que no sabe quién es nuestro dueño: el callback de baja o de borrado llega como un `POST`
público cuya única credencial es el `signed_request` firmado con el app secret. Exigirle un
`owner_id` a esas consultas sería pedir un dato que la petición no trae. Lo que sostiene el
aislamiento acá es la firma, no el `WHERE`: por eso nada de ese módulo se llama desde una
acción con sesión ni desde otra ruta sin haber pasado antes por `leerSignedRequest`
(`src/lib/social/meta-firma.ts`), y por eso tampoco está en la lista de `aislamiento.test.ts`
—el arnés lo daría por roto, y no lo está—. Si alguien lo importa desde el panel, el filtro
por dueño hay que ponerlo en el llamador.

La misma excepción alcanza a la página `/borrado/[codigo]`
(`src/app/(legal)/borrado/[codigo]/page.tsx`), que lee `solicitudes_borrado` por el código y
no por dueño: esa tabla no tiene `owner_id` a propósito —cuando la fila se escribe, ese
dueño ya no tiene cuentas de Meta—, y quien consulta la URL es Meta o quien pidió el
borrado, ninguno con sesión. Ahí la llave es el código aleatorio de 16 caracteres, y por eso
la página no muestra nada que necesite más: ni nombre, ni correo, ni handle.

## Dos caminos que crean publicaciones, sin código compartido

**Abierto desde 2026-09-24.**

`crearPostProgramado` (`src/lib/social/publish/crear.ts`) y los `insert` propios de
`POST /api/schedule/batch` (`src/lib/social/publish/batch.ts`) escriben posts y sus
destinos por caminos separados. `batch.ts` no llama a `crearPostProgramado` porque esa
función no sabe de portada (`coverUrl`) ni de `atributos`, dos columnas que solo la carga
masiva escribe. Es una duplicación anterior a esta entrega, que la conservó a propósito
—extender `crearPostProgramado` habría tocado la pieza del camino de publicar que ya usa
el compositor, el más transitado, a cuestas de un cambio de vocabulario—.

El costo: un cambio futuro en cómo se escriben los destinos de un post (la tabla
`scheduled_post_targets`, sus columnas, su validación) hay que hacerlo dos veces, y las dos
copias pueden divergir sin que nada lo note. Desde el 2026-10-21 cada camino escribe en una
transacción —un post no puede quedar sin sus destinos—, pero cada uno en la suya: la
atomicidad también está escrita dos veces. Cerrarlo pide que `crearPostProgramado` acepte
portada y atributos, o que `batch.ts` la llame para escribir destinos y solo haga sus
propios `insert` para lo que le es propio.

## Un campo nuevo en `ReglaLimpia` no llega solo a los tres caminos que la escriben

**Abierto desde 2026-09-27.**

`reglas_clave` se escribe desde tres sitios, y `ReglaLimpia` es el tipo que los tres comparten.
Agregarle `documento_url` en esta entrega dejó claro que el tipo compartido no reparte nada por
sí solo: cada camino decidió distinto, y dos de las tres decisiones estaban mal.

- **`scheduleBatch`** (`src/lib/social/publish/batch.ts`) es el que lo hace bien: llama a
  `documentoToBlob`, copia el PDF a R2 y guarda **nuestra** URL; si no puede traerlo, rechaza la
  fila ahí mismo.
- **`updateScheduledPost`** (`src/app/admin/actions.ts`) lo hacía mal y **se arregló en esta
  misma rama**: su `onConflictDoUpdate` esparcía la regla entera, así que cada guardado del
  editor escribía `documento_url = NULL` —el formulario no tiene ese campo, y el validador
  siempre devuelve la clave puesta—. Un post programado por API con su PDF perdía el documento en
  cuanto el dueño cambiaba la hora, y al día siguiente el barrido de R2 borraba el archivo. Ahora
  su `set` nombra solo las columnas que ese editor administra (`columnasEditablesDeRegla`).
- **`crearPostProgramado`** (`src/lib/social/publish/crear.ts`) **sigue abierto**: inserta
  `...input.regla` completo, sin pasar por `documentoToBlob`, así que un `documentoUrl` que le
  llegara quedaría guardado tal cual, apuntando al servidor de un tercero. Hoy no hay llamador
  que pueda hacerlo —el compositor del panel solo arma palabra, mensaje y respuesta, y la ruta
  del teléfono no le pasa `regla`— así que no es un fallo de hoy. Se dejó así porque esta entrega
  es «todo por API» y tocar el camino del compositor no le hacía falta.

Lo que cuesta y lo que enseña: **una columna de este tipo tiene dos formas de fallar, y las dos
son silenciosas.** Guardar una URL ajena hace que el enlace muera cuando el tercero borre su
archivo, y el barrido nunca protege nada porque no hay objeto nuestro que proteger. Pisarla con
`null` borra el archivo que sí era nuestro. Ninguna de las dos da error, y ninguna se ve en la
pantalla del panel, que no muestra el documento en ninguna parte.

Cerrar lo que queda abierto pide una de dos: que `crearPostProgramado` copie el documento como
hace el lote, o que rechace una regla que traiga `documentoUrl` en vez de guardarla a medias. Y
el día que el editor del panel administre documentos de verdad, la salida buena es que los tres
caminos compartan la escritura de la regla en vez de tener cada uno su `insert` —que es la deuda
de más arriba, «Dos caminos que crean publicaciones, sin código compartido», de la que esta es
una consecuencia concreta.

## Tres cosas de los trial reels que no se pudieron verificar

**Abierto desde 2026-09-28.** Ninguna cuenta de Instagram con la función habilitada estuvo
disponible para probar el publicador de trial reels de punta a punta, así que estos tres
puntos de `docs/superpowers/specs/2026-09-28-trial-reels-design.md` (sección 10) quedan sin
comprobar:

1. **Si `trial_params` convive con `cover_url` en el mismo contenedor.** No está documentado
   por Meta. `reelContainerParams` (`src/lib/social/publish/instagram.ts`) manda los dos
   campos juntos sin problema declarado; si Graph rechazara la combinación, el síntoma sería
   un trial reel con portada fallando siempre, indistinguible en el código de cualquier otro
   rechazo de contenedor.
2. **Si el sync de métricas ve un trial reel no graduado.** No aparece en el perfil hasta que
   el dueño lo comparte, así que `GET /{ig-user-id}/media` podría no listarlo — el post
   quedaría `published` sin números en el panel hasta la graduación, y hoy eso no está dicho
   en ningún lado.
3. **La forma exacta del error de rechazo.** `motivoDeRechazo` (mismo archivo) detecta el
   rechazo por texto (`/trial/i` en el cuerpo), porque Meta no documenta el código. `postForm`
   registra el cuerpo completo en el log del servidor (`console.error('Instagram publish:',
   …)`) a propósito: es la única forma de aprender la frase real de Meta el día que el rechazo
   ocurra de verdad, sin haber apostado antes a una forma adivinada.

   Lo que cuesta mientras tanto, dicho sin suavizar: un rechazo definitivo que Meta redacte
   sin la palabra —una cuenta privada, por ejemplo— cae en «No se pudo hablar con la
   red. Se reintentará.» y se reintenta hasta tres veces antes de fallar, prometiendo un
   reintento que Meta ya negó. Es el mismo trato que hoy recibe cualquier no-ok en un reel
   normal; el mapeo solo lo estrecha para el único caso que Meta deja reconocer. Cerrarlo
   pide ver el error real una vez, y entonces reconocerlo por su código y no por su texto.
   La cuota diaria ya no está en este caso: Meta sí documenta su código (9, subcódigo
   2207042), y `esTopeDiario` la reconoce y la hace esperar sin gastar intentos (2026-10-17).

   El rechazo que sí reconoce por texto ya no se reintenta: `createContainer` marca ese
   `failed` con `definitivo: true`, y `resolveOutcome` (`publisher.ts`) lo hace fallar en
   el mismo intento en vez de esperar al tercero. Lo de arriba es justo lo que queda fuera
   de ese reconocimiento.

Cerrar las tres pide lo mismo: una cuenta de Instagram con trial reels habilitados y una
tarde — un trial reel con portada, un trial reel sin graduar mirado desde `/api/metrics/posts`,
y una cuenta sin la función para leer el rechazo real del log.

**El calendario y la cola no marcan un trial reel.** Distinto de las tres de arriba: esto no
falta por no haberse podido probar, falta porque no se construyó. Solo la página del editor
de un post programado lo muestra (`resumenOpciones`, «Trial reel — lo compartes tú desde
Instagram»); las vistas de calendario y de cola siguen leyendo la red y el handle, sin esa
marca — spec §6 lo deja dicho así a propósito (es otra entrega). Cerrarlo es llevar
`resumenOpciones` (o su frase) a esas dos vistas.

## Un par de restos chicos de esta entrega

**Anotado el 2026-09-24.** Ninguno tiene efecto observable hoy; quedan escritos para no
perderlos.

- **`validateScheduleDraft` corre dos veces con los mismos datos** en las filas de
  `POST /api/schedule/batch` que traen `redes` (`src/lib/social/publish/batch.ts`): una
  vez para la validación de la forma y otra al derivar `cuentas`. Redundante, sin
  resultado distinto entre una corrida y otra.
- **Las dos rutas móviles simulan `resolverDestinos` en sus propios tests**
  (`src/app/api/mobile/schedule/check/route.test.ts` y
  `src/app/api/mobile/schedule/route.test.ts`), así que la precedencia entre `cuentas` y
  `redes` solo queda cubierta contra la función real en `mobile-api.test.ts`. División
  razonable —ver el ledger de la entrega— pero vale saber dónde vive esa cobertura antes
  de tocar `resolverDestinos`.

## «Se quemó» no tiene ventana de fecha ni forma de podarse

**Abierto desde 2026-09-29.**

`cortesQuemados` (`src/lib/social/publish/cortes.ts`) lee **todo** corte del dueño con algún
destino en `failed`, sin mirar la fecha; `quemados` (`src/lib/fuego.ts`) saca de ahí los
destinos, y La Parrilla los lista enteros arriba del calendario. Es a propósito: un fallo viejo
sigue pidiendo la acción hasta que alguien lo reprograma, y esconderlo a los siete días
sería perderlo en silencio. Desde esta entrega la lista va del más reciente al más viejo y
cada fila que no es de hoy lleva su día y su mes delante, así que al menos se sabe qué es
qué — que es lo mínimo en una lista sin ventana, donde un fallo puede ser de agosto.

Lo que no tiene es salida propia. Un destino quemado sale de la lista cuando algo lo
devuelve a la cola —reprogramarlo, «Subir ahora» (`subirAhora`, que rearma todo destino
`failed` del corte), guardar el corte en su editor (los `rearmIds` de `diffTargets`, que
rearman cualquier destino `failed` que siga elegido)— o cuando se borra el corte entero
(`borrarPostProgramado`, que lo permite mientras ningún destino haya alcanzado a
publicarse). Las cuatro son efectos de otra cosa: no hay «descartar», ni caducidad, ni
poda. Un dueño que acumule cuarenta fallos de hace meses —una cuenta que se desconectó y
nadie reconectó— abre la pantalla de entrada y ve cuarenta filas, que es exactamente lo
contrario de «solo lo que pide una acción hoy».

Cerrarlo pide una decisión de producto antes que código: qué significa «ya no me importa»
—una columna `descartado_en` en `scheduled_post_targets`, o un estado nuevo en el enum—, un
botón que lo escriba, y la condición correspondiente en `cortesQuemados`. Con eso decidido son
una migración, una acción y un test; sin decidirlo, cualquier límite que se ponga hoy
—«solo los últimos treinta días»— esconde trabajo pendiente sin avisar.

## Threads se queda fuera de la baja y del borrado de Meta

**Abierto desde 2026-09-30.**

`REDES_META` (`src/lib/social/meta-bajas.ts`) son `instagram` y `facebook`, y `meta_user_id`
solo lo llenan `instagramCredential` y `facebookCredential`. Threads es una red conectable y
completa en este código, montada sobre la misma app de Meta pero por otro **caso de uso**,
el de «API de Threads», que en el App Dashboard tiene su propio par de campos de
*deauthorize* y *data deletion* y firma sus `signed_request` con `THREADS_APP_SECRET`.
Ninguno de los dos está implementado: quien quite la app o pida el borrado desde Threads no
llega a ninguna parte, y sus datos se quedan.

La entrega A acotó su alcance a Instagram y Facebook a propósito, y para el App Review de
esos permisos alcanza. Lo que no alcanza es el día que Threads entre a revisión.

Desde el 2026-10-19 Threads está en «Próximamente» (`REDES_PROXIMAMENTE`,
`src/lib/networks.ts`): nadie nuevo lo conecta, así que el hueco se reduce a las cuentas que
ya estaban conectadas, y cerrarlo pasa a ser parte de abrirlo.

Cerrarlo son las dos rutas otra vez —`/api/social/meta/threads-baja` y `-borrado`, o un
segmento por caso de uso— leyendo `THREADS_APP_SECRET`, y una decisión antes: si el id de
usuario de Threads vive en la misma columna `meta_user_id` (son espacios de ids distintos,
así que compartir columna pide también mirar la red al filtrar) o en una propia. La página
de estado y `solicitudes_borrado` sirven igual, que para eso `red` es una columna y no una
constante.

## Cambiar de zona horaria deja el historial de métricas en la zona vieja

**Abierto desde 2026-09-30.**

Cada snapshot de `post_metrics` y `account_metrics` lleva un `day`, y desde la entrega B
del panel para terceros `sync.ts` lo escribe en la zona del dueño de la cuenta (con
`ZONA_POR_DEFECTO` si la cuenta no tiene dueño), que es la misma zona con la que
`getPostRows` y las series de Los Números lo leen. Mientras el dueño no cambie su zona,
todo cuadra.

Si la cambia en Tu Cuenta, los `day` ya escritos se quedan en la zona vieja y los nuevos
salen en la nueva: cerca de la fecha del cambio una fila puede correrse un día en la
serie —ni pérdida ni duplicación, un artefacto de un día, una sola vez—. No se avisa en
Tu Cuenta a propósito: alarmaría por algo que casi nadie va a notar.

Cerrarlo cuesta una de dos: reescribir los `day` del dueño al cambiar de zona (una
migración de datos por usuario, dentro de `guardarCuenta`), o guardar el instante del
snapshot y calcular el día al leer, que es un cambio de esquema y de todas las lecturas.


## El teléfono programa en la zona del aparato y lee en la del dueño

**Abierto desde 2026-09-30.**

La entrega B le dio a cada usuario su zona horaria, y `api/mobile/*` la respeta al
devolver: la app trocea la cadena que recibe (`cuando.slice(11, 16)`) en vez de volver a
formatearla, así que lo que muestra ya viene en `users.zona`. Al revés no: el selector de
fecha de `mobile/src/app/(tabs)/publicar.tsx` corre en la zona del teléfono y manda
`fecha.toISOString()`, un instante absoluto. `POST /api/mobile/schedule` lo acepta tal
cual, y hace bien —un ISO con offset no necesita zona ninguna—.

El resultado es que, con el teléfono y Tu Cuenta en zonas distintas, uno elige «19:00» y la
app se lo confirma a otra hora. Desde el 2026-10-16 pasa lo mismo con los borradores: el que
se guarda en el teléfono a las «19:00» de su reloj se abre en el panel a la hora de Tu Cuenta,
y al revés. Ninguna pantalla de la app dice en qué zona vive la cuenta,
así que no hay dónde darse cuenta. Con el dueño y su teléfono en el mismo sitio —el caso de
hoy— no se nota, y por eso quedó fuera del alcance de la entrega, que nombraba `api/mobile/*`
y no la app.

Cerrarlo es barato y son dos decisiones, no una: que una ruta que la app ya lee devuelva
`zona` —`GET /api/mobile/schedule`, que ya manda `hoy` en la zona del dueño; `overview` no,
que la app de hoy no llama—, y después o bien el selector compone la hora en esa zona (lo
correcto: «19:00» es 19:00 del dueño en los dos lados), o bien la app solo la muestra junto
al selector («se publicará a las 19:00 de Europe/Madrid») y deja que el dueño traduzca. Lo
segundo es una tarde; lo primero pide aritmética de zonas en el cliente, que es justo lo
que `fromZonedInput` ya resuelve en el servidor.

## TikTok: el id del video se recupera por texto y hora (2026-10-16)

TikTok no siempre devuelve el id del video al publicar: `status/fetch` lo trae en
`publicaly_available_post_id` solo para posts públicos ya moderados, así que un post en «Solo
yo», un borrador mandado a la bandeja o uno que todavía modera quedaban con `externalId`
vacío para siempre, y sin el id no cruzaban con sus métricas ni con sus atributos (el
torneo de ideas y versiones se medía solo en Instagram).

Lo que se hizo: al final de cada sincronización de una cuenta de TikTok,
`vincularVideosTikTok` (`src/lib/social/vincular-tiktok.ts`) cruza los destinos publicados
sin id con los videos de esa cuenta que ningún destino tiene, por texto (el más corto es el
comienzo del otro, con doce caracteres o más) y por hora (de una hora antes a dos días
después de la programada; un mes para un borrador). Los pares se arman del más cercano en
el tiempo al más lejano y cada lado entra en uno solo (`emparejarVideos`,
`src/lib/social/tiktok-vinculo.ts`). Lee los videos del último mes y los destinos de los dos
últimos (`VIDEOS_DESDE_MS`, `DESTINOS_DESDE_MS`): lo más viejo ya pasó por las sincronizaciones
de cada día.

Lo que queda a medias, a propósito:

- **Es un cruce aproximado.** Dos posts con el mismo texto que salen dentro de la misma
  ventana se reparten por cercanía en la hora; si TikTok tarda distinto en publicar cada
  uno, pueden quedar cruzados. Un post sin texto solo cruza con un video sin texto a dos
  horas o menos.
- **Solo ve lo que la sincronización lista**: los videos públicos de los últimos 10 días, o
  los 200 más nuevos si son más (`src/lib/social/lectura.ts`); lo más viejo se lee por id y
  no pasa por este cruce. Un post que se queda en «Solo yo» no aparece en la lista de videos
  de TikTok y no se puede recuperar así.
- **No vuelve a preguntarle a TikTok.** Lo exacto sería seguir consultando `status/fetch`
  con el `publish_id` hasta que llegue el id, pero ese id no se guarda después de publicar y
  TikTok no garantiza cuánto tarda la moderación. Costaría guardar el `publish_id` en el
  destino publicado y un sondeo aparte en el cron.

## Publicar dentro del cron deja una ventana para publicar dos veces (2026-10-20)

Desde esta entrega cada destino se reclama antes de intentarlo, cada llamada a una red tiene su
plazo, el cron solo empieza lo que le cabe y lo atascado no se vuelve a subir (ver «Cada
destino sale una sola vez» en el README). Lo que no se pudo cerrar sin cambiar de arquitectura
es el momento entre que la red acepta y que la base lo anota: si la función se cae justo ahí
—un corte de Vercel, un despliegue a mitad, el proceso que muere—, el resultado se pierde, el
reclamo vence a los diez minutos y el intento siguiente publica otra vez. Pasa en cuatro
lugares: la foto suelta de Instagram, que crea su contenedor y lo publica en el mismo intento
sin anotarlo entre los dos pasos; la subida del video a YouTube, una sola petición con los
bytes dentro de la función; la subida a Facebook, y el arranque de la publicación en TikTok.
«Subir ahora» además publica dentro de la acción del panel, sin el presupuesto del cron: un
video pesado de YouTube puede quedar cortado por el tiempo máximo de la función.

Quedó así porque cerrarlo pide que cada paso que la red no puede deshacer deje su rastro en la
base antes de darlo, y que el trabajo largo no viva dentro de una petición con tiempo máximo:

- una cola de trabajos —una tabla con `FOR UPDATE SKIP LOCKED`, o un servicio de colas— en vez
  de un cron que recorre todo lo vencido, con un trabajo por destino y por paso;
- la subida reanudable de YouTube (`uploadType=resumable`): se pide la dirección de subida y se
  anota antes de mandar los bytes, y un intento cortado sigue desde donde quedó en vez de subir
  otro video;
- en Instagram, anotar el contenedor de la foto antes de publicarlo, como ya pasa con los
  videos, que esperan a la pasada siguiente;
- «Subir ahora» encolando el trabajo en vez de publicar dentro de la acción.

Terminarlo cuesta unos días: la tabla de trabajos y su consumidor, la reanudación de YouTube, y
mover el cron y «Subir ahora» a encolar, con sus pruebas contra una Postgres de verdad
(`run.integracion.test.ts` ya tiene el andamiaje). Mientras tanto, contar el intento al
reclamarlo hace que un destino que se corta una y otra vez se queme con «La publicación se
cortó a la mitad y ya no quedan intentos.» en vez de reintentarse para siempre.

## La lista de La Parrilla carga el historial entero (2026-10-21)

Desde esta entrega el calendario, «Por hora» y «Día» leen solo la semana o el día que dibujan
(`cortesEntre`), y «Se quemó» y el aviso del compositor tienen sus propias lecturas
(`cortesQuemados`, `horasPorVenir`). La vista «Lista» todavía lee todo lo programado del dueño
—posts, destinos y media— y lo manda entero al navegador, que lo ordena y lo dibuja. Con un año
de parrilla son cientos de cortes por cada visita a esa pestaña.

Quedó así porque acotarla no es solo una consulta: la lista no tiene páginas ni «cargar más»,
el filtro por red cuenta lo que está a la vista y el orden (lo que viene primero, lo que ya
salió después) se arma en el cliente. Terminarlo pide paginarla en el servidor por ese mismo
orden, con un cursor (la hora y el id del último corte), un «Ver más» al pie, y que los
contadores del filtro salgan de una consulta propia en vez de contar lo cargado. Medio día de
trabajo, con su página de la wiki.

## Los límites de intentos viven en la memoria de cada instancia (2026-10-21)

El pedido y el canje de códigos de ingreso, y las balizas de visitas y clics de las páginas
públicas, cuentan sus intentos por IP en un mapa en memoria (`src/lib/limite-ip.ts`, con la
cuenta pura en `src/lib/limite.ts`). Desde esta entrega ese mapa tiene tope y barre lo
vencido, pero sigue siendo de cada instancia: Vercel levanta varias, cada una con su cuenta, y
una instancia nueva empieza de cero. Frena a quien insiste desde un solo lugar contra una sola
instancia; no es un límite del sitio.

Quedó así porque un límite compartido necesita un almacén compartido con escrituras baratas,
que el proyecto no tiene: la base no conviene para contar cada visita, y no hay Redis. Cerrarlo
es sumar uno (Upstash Redis tiene plan gratis y una librería de ventanas deslizantes,
`@upstash/ratelimit`), cambiar `demasiadosIntentos` para que cuente ahí con la misma firma, y
dejar la cuenta en memoria como respaldo si el almacén no contesta. Medio día, más la variable
de entorno nueva en el README y en `.env.example`.

## Falta la política de contenido (CSP) (2026-10-21)

Desde esta entrega el sitio manda las cabeceras de seguridad que no cambian nada de lo que se
ve (`next.config.ts`): sin adivinar tipos, sin marcos ajenos, sin cámara ni micrófono. Falta la
que más protege, `Content-Security-Policy`, que le dice al navegador de qué orígenes puede
cargar scripts, estilos e imágenes.

Quedó afuera porque una CSP útil con Next pide un `nonce` por petición para sus scripts en
línea (se arma en `src/proxy.ts` y lo leen las páginas), y una lista de orígenes que hoy está
repartida: R2 para la media y las miniaturas de Instagram, Facebook, YouTube y TikTok. Una
CSP mal armada no avisa: deja la página en blanco o sin imágenes.
Terminarlo es armarla primero en modo `Content-Security-Policy-Report-Only`, mirar una semana
qué reporta, completar la lista, y recién ahí pasarla a la cabecera que bloquea. Un día de
trabajo repartido en esa semana.

## Las visitas y las métricas no se podan nunca (2026-10-21)

`visits` y `clicks` guardan una fila por visita y por clic de las páginas públicas, y
`post_metrics` y `account_metrics`, una lectura por publicación y por cuenta cada día que se
sincroniza. Ninguna se borra, salvo lo de YouTube, que se va a los 30 días sin refrescarse
porque sus políticas lo piden (`retencion-youtube`). Con pocos usuarios no pesa; con más, son
las tablas que crecen sin techo, y el plan gratis de Supabase tiene 500 MB.

Quedó así porque podar es decidir qué se pierde: Los Números compara períodos («Todo» empieza
en 2020) y mira la curva de cada publicación por edad, así que borrar lecturas viejas cambia lo
que muestran. Cerrarlo pide decidir cuánto se guarda entero —un año, por ejemplo—, juntar lo
más viejo en resúmenes por día y por mes (una tabla por resumen y un cron que los llena), que
las consultas de Los Números lean los resúmenes cuando el período lo pide, y contar en
`/privacidad` cuánto se guarda cada cosa. Unos días, sobre todo por las consultas.

## El aislamiento por dueño vive solo en el código (2026-10-21)

Cada consulta filtra por `owner_id` en su `WHERE`, y lo vigila el arnés de
`aislamiento.test.ts` (ver «El arnés de aislamiento solo llega a `src/lib`», más arriba). La
base no lo exige: la app entra como `postgres`, que se salta RLS, y las tablas tienen RLS
encendido sin políticas solo para dejar a ciegas a la API de datos de Supabase (`0005_rls.sql`;
`migraciones.test.ts` pide que toda tabla nueva lo encienda). Un `WHERE` que se olvide en una
consulta nueva lee lo de otro dueño, y solo lo ataja una prueba, si alguien la escribió.

Quedó así porque que la base lo exija pide que cada consulta sepa quién pregunta: un rol que no
se salte RLS, políticas `owner_id = current_setting('app.dueno')` en cada tabla con dueño, y
fijar ese valor al empezar cada transacción, que con el pooler de Supabase en modo transacción
hay que hacer con `set_config(…, true)` dentro de la misma transacción. Las rutas sin dueño
—las balizas, los callbacks de Meta, los crons— necesitan su propio camino. Es un cambio en
cómo se abre cada consulta del proyecto; una semana con sus pruebas contra una Postgres de
verdad.

## La versión de la app no impide mandar por aire lo que el binario no trae (2026-10-21)

`mobile/app.json` usa `runtimeVersion: { policy: "appVersion" }`: toda actualización por aire
de la versión 1.1.0 le llega a todo binario 1.1.0, sin mirar qué módulos nativos trae cada uno.
Si un cambio de JavaScript empieza a usar un módulo nativo nuevo y se publica por aire antes del
build, la app instalada lo pide y no lo tiene, y se cae al abrir. Hoy lo cuida la costumbre: los módulos nativos se agregan junto
con un build y una versión nueva, y Dependabot no toca la app (`.github/dependabot.yml`). El CI
tampoco lo ve: prueba el JavaScript de la app, no construye el binario.

Quedó así porque la salida, `policy: "fingerprint"`, calcula la versión a partir de lo nativo y
cambia cómo se publica: cada cambio nativo da una versión nueva que solo recibe lo publicado
para ella, y el binario instalado hoy queda sin actualizaciones hasta el próximo build. Hacerlo
es cambiar la política, construir un binario nuevo para la Play Store, ajustar
`mobile/README.md` y el script de publicación por aire, y probar que el canal `preview` del APK
sigue recibiendo lo suyo. Medio día, más la espera del build y de la revisión de Google.

## Los dos compositores son archivos de cientos de líneas (2026-10-21)

`schedule/composer.tsx` en el panel (unas 850 líneas) y `mobile/src/app/(tabs)/publicar.tsx` en
la app (unas 790) tienen cada uno en un solo componente el formulario, el guardado del
borrador, la cola de subidas, la validación y el envío, con refs que se cruzan entre awaits. Se
leen de arriba abajo, pero un cambio en el guardado obliga a entender la subida, y las pruebas
llegan solo a lo puro que ya salió a `lib/` (`borradores.ts`, `publicar.ts`): el ciclo entero
—escribir, subir, guardar, programar— no tiene prueba que no sea a mano. `admin/actions.ts`
(unas 1500 líneas) es el mismo caso del lado del servidor, con todas las acciones del panel
juntas.

Quedó así porque partirlos toca los dos caminos más usados del producto, y lo que se ganaría no
arregla nada que hoy falle. Cerrarlo es sacar cada pieza a un hook propio —`useBorrador`,
`useSubidas`, `useEnvio`— que se pruebe con un renderizador de React (hoy no hay ninguno en el
repositorio, ni en el sitio ni en la app), y partir `actions.ts` por pantalla. Unos días por
compositor, mejor de a uno y con el otro quieto.

## Lo nativo de la app no cambia de modo (2026-10-19)

La app del teléfono tiene los dos modos de la cuenta (ver «Tanda 3» en
`docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`), pero lo que dibuja el teléfono
mismo y no la app sigue oscuro también de día: la pantalla de arranque, el selector de fecha y
hora de Android, y las preguntas de «Cerrar sesión» o de descartar un borrador (`Alert`).

Quedó así a propósito: el modo día viaja por aire, y esas tres cosas salen de
`userInterfaceStyle: "dark"` y del color de arranque de `mobile/app.json`, que solo cambian con
un build nuevo y una versión en la Play Store. Lo que sí cambia por aire, cambia: las pantallas,
las cabeceras y la barra del sistema con la hora, que se oscurece sobre el papel de arroz.

Terminarlo cuesta un build nativo: `userInterfaceStyle: "automatic"`, que el selector y las
alertas sigan el tema que la app le pase con `Appearance.setColorScheme` según el modo de la
cuenta, y probar que el arranque —que sale antes de saber el modo— no destelle claro a quien
usa la noche.
