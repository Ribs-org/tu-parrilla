# API de programación — guía para un LLM

Para un modelo que llama a esta API sin tener este repositorio delante. Es la contraparte
compacta de `api-editor.md` (esa es para personas; describe la misma API y no la contradice).
El esquema formal está en `api.json` — léelo una vez y sabrás la forma exacta de cada campo,
sus tipos y sus límites numéricos; esta guía es la tarea: qué mandar, qué falla y cómo, y qué
no existe.

Base: `https://tu-parrilla.cl`. Las otras dos guías están al lado:
`https://tu-parrilla.cl/docs/api-editor.md` y `https://tu-parrilla.cl/docs/api.json`. Si la
persona con la que trabajas se pierde en su panel —dónde se conecta una red, dónde se genera
la llave, qué significa un error que le salió—, la wiki de la interfaz está en
`https://tu-parrilla.cl/docs/ui/index.md`: cada pantalla, con el texto literal de cada botón.
Esta guía nombra las pantallas como se ven de noche; en el modo día, La Parrilla es «La Barra»
y Los Fierros, «Los Cuchillos» (la wiki las da todas, en «El modo día»).

Cinco endpoints de escritura: `POST /api/schedule/batch` programa, `DELETE /api/schedule/posts/{id}` saca lo programado (sección 3b), `POST /api/schedule/posts/{id}/archivar` y `…/desarchivar` archivan lo quemado sin borrarlo (sección 3f), y `POST /api/media` sube un archivo una vez para nombrarlo en varias filas (sección 3e). Aparte del calendario, `POST /api/bodega/subidas` guarda material en bruto en la cámara de frío de La Cocina (sección 3h). Autenticación en todos los
endpoints:

```
Authorization: Bearer <tu llave>
```

La llave te la da la persona dueña de las cuentas, que la genera en su panel, en La Cocina,
sección «Tu propio chef» (`/admin/ia`; hasta el 2026-10-22 la pestaña se llamaba Tu IA; las que
salen de ahí empiezan con `tp_`). Todo lo que hagas con ella es a su nombre: sus cuentas, sus posts, su zona horaria.
Sin ella, con una incorrecta o con una revocada: `401` con el cuerpo `No autorizado`. Un
`401` con una llave que antes andaba es que la revocaron: no reintentes, pide una nueva.

## 1. El cuerpo mínimo que funciona

```json
{
  "posts": [
    { "fecha": "2026-10-01 09:00", "texto": "Hola.", "redes": ["instagram"] }
  ]
}
```

`fecha` es siempre obligatoria (`YYYY-MM-DD HH:MM`, en la zona horaria del dueño —la de Tu
Cuenta—, futura). Cada
fila necesita además: `texto` o al menos un elemento en `media`, y `redes` o `cuentas` con al
menos un elemento. `redes` solo resuelve la cuenta a nombrar la red si hay exactamente una
conectada de esa red; con dos, hay que usar `cuentas` con el identificador exacto (se leen en
`GET /api/schedule/cuentas`, campo `id`: sección 3d).

**Ponle una `ref` a cada fila** (`"ref": "octubre-fila-3"`: un texto tuyo de 1 a 100
caracteres, único por dueño). Si el envío se corta y no llega la respuesta, reenvía el lote
entero con las mismas `ref`: las filas que ya habían entrado vuelven con su `postId` y
`"repetido": true`, sin programarse otra vez ni volver a validarse, y se programan solo las
que faltaban. La `ref` no compara contenidos: una fila cambiada con la misma `ref` devuelve el
post de antes. Sin `ref`, reenviar duplica.

## 2. Una sola petición: video, regla y documento

```bash
curl -X POST https://tu-parrilla.cl/api/schedule/batch \
  -H "Authorization: Bearer $LLAVE_PARRILLA" \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "fecha": "2026-10-01 19:00",
        "texto": "Comenta GUIA y te la mando.",
        "redes": ["instagram", "facebook"],
        "media": ["https://drive.usercontent.google.com/download?id=ABC&export=download"],
        "regla": {
          "palabra": "GUIA",
          "mensaje": "Acá va la guía 👇",
          "documentoUrl": "https://drive.usercontent.google.com/download?id=XYZ&export=download"
        }
      }
    ]
  }'
```

Esto programa un post de video con una regla de palabra clave: cuando alguien comente «GUIA»
en Instagram o Facebook (completa, sin importar mayúsculas ni tildes), el sistema copia el PDF
de `documentoUrl` a su propio almacenamiento **al programar, no al comentar** — si la
descarga falla o el archivo no es un PDF de hasta 25 MB, la fila entera se rechaza ahí mismo,
no tres días después dentro de un cron. `mensaje` es obligatorio junto con `palabra`;
`documentoUrl` es opcional.

**Qué pasa hoy cuando alguien comenta la palabra:** el mensaje con el enlace del PDF sale
como **respuesta pública** al comentario, no por mensaje privado. Ver la sección 6, «Lo que
Meta no permite», para el porqué y para lo que cambia cuando el privado se encienda.

## 2b. Los atributos: anótalos siempre igual

Cada fila acepta `atributos`, un objeto plano de valores simples (texto, número o booleano;
hasta 20 claves y 2000 caracteres). El sistema no los interpreta —salvo `pieza`, abajo—: los
guarda y los devuelve junto a las métricas, y el panel del dueño compara lo publicado por
cada valor («Comparar por atributo») y dice qué se repite entre lo mejor y entre lo peor
(«Tu mejor 10 %»). Son opcionales y no se validan, pero si los mandas, usa este vocabulario,
con los mismos valores en todos los posts, o no se van a poder comparar:

| Clave | Qué anota | Valores de ejemplo |
|---|---|---|
| `tema` | De qué trata: el tema principal, uno solo | `negocios`, `edicion`, `finanzas`, `recetas` |
| `hook` | Cómo abre: lo que pasa en los primeros 3 segundos | `pregunta`, `pregunta-polemica`, `dato`, `promesa`, `historia`, `lista`, `antes-despues`, `error-comun` |
| `estilo` | Cómo está hecho | `a-camara`, `voz-en-off`, `tutorial`, `entrevista`, `b-roll`, `meme`, `texto` |
| `serie` | La serie, si es parte de una | su nombre corto: `mut`, `lunes-de-numeros` |
| `color` | El tratamiento de color dominante | `calido`, `frio`, `saturado`, `desaturado`, `blanco-y-negro`, `de-marca` |
| `fuente` | La tipografía del texto en pantalla | su nombre (`montserrat`, `bebas-neue`), o `sin-texto` |
| `ritmo` | Cada cuánto hay un corte de edición | `rapido` (cada 1 a 2 segundos), `medio` (cada 3 a 5), `lento` (más de 5), `plano-secuencia` |
| `musica` | Qué suena | `tendencia`, `biblioteca`, `original`, `voz-sola`, `sin-musica` |
| `duracion` | El largo del video, en tramos de segundos | `0-15`, `15-30`, `30-60`, `60-90`, `90+` |

- **Un valor por clave**: no hay listas. Si toca dos temas, el principal.
- **Minúsculas, sin tildes, guiones en vez de espacios.** Se compara el texto exacto:
  `Pregunta` y `pregunta` son dos valores.
- **Tramos y categorías, no números exactos**: `"duracion": 42` no se agrupa con nada.
- **No anotes lo que no decidiste.** Una clave que falta cae en «sin <clave>», la vara contra
  la que se compara; un valor inventado la ensucia.
- **No uses `formato` ni `corte`**: el panel ya llama «formato» al tipo de post (Reel,
  Carrusel…), y «corte» al post mismo. Para eso están `estilo` y `ritmo`.
- **`pieza` sí significa algo**: los posts con el mismo valor son versiones de una misma
  pieza —dos hooks del mismo video, o el trial reel y el reel normal— y el panel los muestra
  lado a lado. No la uses como `serie`.

```json
"atributos": { "tema": "edicion", "hook": "error-comun", "estilo": "a-camara", "ritmo": "rapido", "musica": "tendencia", "duracion": "30-60", "fuente": "montserrat", "color": "calido" }
```

## 3. Frases de error literales

Toda fila rechazada trae la frase exacta, en `resultados[i].error` — comparar por igualdad,
no por subcadena parcial ni regex:

| Frase exacta | Campo que la provoca |
|---|---|
| `La fecha no se entendió (usa YYYY-MM-DD HH:MM).` | `fecha` con formato inválido |
| `Elige al menos una cuenta o una red.` | `redes` y `cuentas` ambas vacías o ausentes |
| `Escribe un texto o adjunta un archivo.` | `texto` vacío y `media` vacía |
| `Red desconocida o sin publicación: <red>.` | `redes` con un nombre que no existe |
| `Threads todavía no está disponible en Tu Parrilla: próximamente.` | `threads` en `redes`, o una cuenta de Threads en `cuentas`: está en «Próximamente» |
| `X / Twitter todavía no está disponible en Tu Parrilla: próximamente.` | `x` en `redes`, o una cuenta de X en `cuentas`: está en «Próximamente» |
| `Hay redes repetidas en la fila.` | `redes` con la misma red dos veces |
| `No se pudo leer una media de la fila.` | `media` o `portada`: descarga fallida, timeout, o tipo ajeno; el porqué viene en `motivo` (abajo) |
| `Al lote se le acabó el tiempo antes de terminar esta fila. Reenvíala.` | el lote llegó a su tiempo máximo (unos tres minutos) antes de terminar la fila; reenviarla con su `ref` es seguro |
| `La portada requiere un video en media.` | `portada` sin video en `media` |
| `La portada debe ser una imagen.` | `portada` resultó ser video u otra cosa |
| `La portada debe ser JPG o PNG.` | `portada` en gif/webp u otro formato |
| `Los atributos deben ser un objeto plano de valores simples.` | `atributos` con array, anidado, o más de 20 claves / 2000 caracteres |
| `El texto es demasiado largo para Instagram.` | `texto` sobre 2200 caracteres |
| `TikTok necesita que elijas la privacidad.` | un destino TikTok sin `opciones`, o `directo` sin `privacidad` válida |
| `Un contenido patrocinado no puede ser privado.` | `opciones` con `comercial: patrocinado` y `privacidad: SELF_ONLY` |
| `Las opciones de la red no se entendieron.` | `opciones` mal formado, o para un destino que no las pide |
| `TikTok recibe un video, o hasta 35 fotos JPG o WebP.` | `media` con dos videos, mezcla, más de 35 fotos, u otro formato |
| `Un trial reel es un solo video, sin fotos.` | `opciones.<destino>.trialReel: true` con fotos, carrusel, dos videos o sin ningún video en `media` |
| `@<cuenta> no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores, y esta no lo alcanza. Prográmalo como reel normal o en otra cuenta.` o `@<cuenta> no tiene trial reels disponibles, probablemente porque Instagram no le habilitó la función. Prográmalo como reel normal o en otra cuenta.` | no es un error de fila — la fila con `trialReel: true` se acepta al programar; esta frase aparece después, como el `error` de ese destino en `GET /api/schedule/posts`, porque Instagram solo revela la elegibilidad al publicar |
| `Una historia va solo a Instagram y Facebook, y todos sus destinos son historia.` | `opciones.<destino>.historia` en unos destinos y no en otros, o una historia hacia otra red (sección 5b) |
| `Una historia no lleva texto.` | una historia con `texto` |
| `Una historia es un solo archivo, foto o video.` | una historia con más de un archivo, o sin ninguno |
| `Instagram recibe la historia en foto solo en JPG.` | una historia hacia Instagram con una foto PNG, WebP u otro formato |
| `Una historia no tiene comentarios: no lleva palabra clave.` | una historia con `regla` |
| `Una historia no lleva portada.` | una historia con `portada` |
| `Una historia no puede ser trial reel.` | `opciones.instagram` con `historia` y `trialReel` a la vez |
| `Una historia no lleva música de Instagram.` | `opciones.instagram` con `historia` y `musica` a la vez |
| `La música de Instagram solo funciona en cuentas conectadas con Facebook, y esta se conectó con el login de Instagram.` | `opciones.<destino>.musica` para una cuenta de Instagram conectada con el login de Instagram (sección 5c) |
| `Con «historia» la fila no lleva «opciones»: la historia ya dice todo.` | el atajo `"historia": true` con `opciones` en la misma fila |
| `Una secuencia lleva hasta 30 historias.` | el atajo `"historia": true` con más de 30 archivos en `media` |
| `Una de las cuentas elegidas no es tuya.` | `cuentas` con un identificador que no es del dueño |
| `La cuenta <handle> no está conectada. Vuelve a conectarla en Los Fierros.` | `cuentas` con un identificador válido pero desconectado |
| `No hay una cuenta de <red> conectada.` | `redes` con un nombre sin ninguna cuenta conectada de esa red |
| `Tienes N cuentas de <red> (<handles>). Elige cuál con «cuentas».` | `redes` con un nombre ambiguo (dos o más cuentas conectadas) |
| `La palabra clave es una sola palabra, sin espacios, hasta 30 letras.` | `regla.palabra` vacía con mensaje, con espacios/símbolos, o `regla` que no es un objeto |
| `El mensaje del privado va de 1 a 1000 caracteres.` | `regla.mensaje` ausente, vacío o largo |
| `La respuesta pública va de 1 a 300 caracteres.` | `regla.respuestaPublica` larga |
| `El documento tiene que ser una URL absoluta a un PDF de hasta 25 MB.` | `regla.documentoUrl` no es una URL http/https absoluta, o al descargarla no resultó un PDF que quepa |
| `«ref» tiene que ser un texto de 1 a 100 caracteres.` | `ref` vacía, de puros espacios, de más de 100 caracteres, o que no es texto |
| `Máximo 50 posts por lote.` | `posts` con más de 50 elementos |
| `El cuerpo debe ser JSON con { posts: [...] }.` | el cuerpo entero no tiene la forma `{ posts: [...] }` |
| `No se pudo guardar la fila. Inténtalo de nuevo.` | fallo transitorio de base de datos; reintentar esa fila sola |

Además de `ok` y `postId` o `error`, cada resultado trae `ms` (lo que tardó la fila en el
servidor) y, si la fila llegó a su media, `bytes` (lo que esta fila bajó) y `origen`:
`descarga`; `cache` si no bajó nada pero algo venía de otra fila del mismo lote con la misma URL;
o `almacen` si toda estaba subida con `POST /api/media` (sección 3e). Una
fila cuya media no se pudo traer trae también `motivo`, una de estas: `sin respuesta` (30 s sin
contestar), `estancada` (dejó de llegar 30 s seguidos), `cortada`, `sin tiempo` (el lote llegó a
su máximo), `http <status>`, `tipo <content-type>` (`tipo text/html` es la página de Drive en vez
del archivo), `muy grande` (más de 500 MB), `vacía`, `redirecciones`, `url prohibida` o `no subido`
(un archivo de `POST /api/media` que no está: el `PUT` no terminó, o ya se borró). Las tres
primeras y los `http 5xx`/`http 429` ya se reintentaron una vez. Los resultados vuelven en el
orden de `posts`.

El lote baja cuatro filas a la vez, y la misma URL una sola vez por lote: un video para varias
cuentas en filas distintas va mejor en el mismo lote. Dos o tres lotes a la vez son seguros
(con `ref`, una fila no entra dos veces); más no suele acelerar.

`200` es la respuesta normal aunque haya filas rechazadas — el rechazo por fila es dato, no
fallo del endpoint. Corrige y reenvía las filas malas. Con `ref` en cada fila puedes reenviar
el lote entero (lo que ya entró vuelve con `"repetido": true`); sin `ref` no hay
deduplicación, y reenviar una fila ya programada la programa otra vez.

## 3b. Sacar un post programado

```bash
curl -X DELETE https://tu-parrilla.cl/api/schedule/posts/<id> \
  -H "Authorization: Bearer $LLAVE_PARRILLA"
```

`<id>` es el del post: el `postId` que `POST /api/schedule/batch` devolvió en esa fila, o el
`id` que lista `GET /api/schedule/posts`. Se borra el post **entero** —todos sus destinos, su
media y su regla—; no hay forma de sacar una sola cuenta de un post con varias.

| Respuesta | Cuándo |
|---|---|
| `200` `{ "ok": true, "id": "<id>" }` | Se borró. |
| `404` `{ "error": "Ese post no existe." }` | No hay un post con ese id para este dueño. No distingue «no existe» de «no es tuyo». |
| `409` `{ "error": "Ya se publicó (o está publicando): elimínalo en la red." }` | Algún destino ya salió o está saliendo, también uno que el publicador está intentando en ese momento. Borrar la fila no lo despublicaría, así que se rechaza en vez de mentir; se elimina desde la red. Si nada había salido todavía, en un minuto `GET /api/schedule/posts` dice cómo quedó. |

Un post en `failed` (algún destino falló y agotó sus intentos) **sí** se puede borrar: nada
salió. Si solo quieres que deje de pedir atención, archívalo (sección 3f): borrar se lleva el
error y los intentos. Un post con un destino publicado y otro programado **no**: el publicado manda. Los
archivos que subió quedan en el almacén hasta el barrido de huérfanos, que pasa cada hora; no
hay que hacer nada con ellos.

## 3c. Lo que pide atención

```bash
curl -s "https://tu-parrilla.cl/api/schedule/resumen" -H "Authorization: Bearer $LLAVE_PARRILLA"
```

Devuelve `{ generado, horas, dias, fallidos, cuentas, pista }`: los destinos que se quemaron en
las últimas `horas` y nadie archivó (con su `postId`, red, `cuentaId` y `error`), las cuentas que hay que
reconectar (`fierro` `frio` ya no publica; `enfriandose` vence en menos de siete días, con
`vence`) y las cuentas en uso con menos de `dias` días programados hacia adelante (`ultima`,
la hora de lo último que tienen por salir o `null`, y `dias`). Es lo mismo que el resumen que
le llega al dueño por correo cada mañana. Parámetros opcionales: `dias` de 1 a 30 (3 por
defecto) y `horas` de 1 a 168 (24 por defecto); fuera de rango, `400` con
`«dias» tiene que ser un entero de 1 a 30.` o `«horas» tiene que ser un entero de 1 a 168.`

Una cuenta fría no publica hasta que el dueño la reconecte en Los Fierros: si aparece, díselo
antes de programarle nada. Un rechazo de Instagram trae lo que dijo Meta, con la cuenta
delante: `Instagram rechazó la publicación en @<cuenta>: «<lo que dijo Meta>» (código <n>, subcódigo <n>).`. Léelo antes de reintentar: si Meta dice que la cuenta no puede hacer algo,
reintentar no lo cambia. Un destino de Instagram que espera con el `error`
`Instagram llegó a su tope de publicaciones por día: sale apenas se libere un cupo.` no está
fallido: sale solo cuando la cuenta recupere cupo, sin gastar intentos.

## 3d. Las cuentas y sus identificadores

```bash
curl -s "https://tu-parrilla.cl/api/schedule/cuentas" -H "Authorization: Bearer $LLAVE_PARRILLA"
```

Devuelve `{ cuentas }`: todas las del dueño, también las desconectadas, por red y de la más
antigua a la más nueva. Cada una trae:

- `id`: el identificador de Tu Parrilla, el que va en `cuentas`, como clave de `opciones` y en
  `cuenta=` de las métricas (el mismo `cuentaId` de `/api/schedule/posts` y del resumen);
- `red` y `handle` (`null` si la red no dio uno);
- `externalId`: el identificador que le da la red —la cuenta de Instagram, la página de
  Facebook, el canal de YouTube, el `open_id` de TikTok—, que ningún campo de esta API recibe;
- `conectada`, si tiene credencial, y `proximamente`, `true` en Threads y X;
- `fierro` (`al-rojo`, `enfriandose` o `frio`) y `vence` (ISO en la zona del dueño, o `null` en
  TikTok, YouTube y X, que lo renuevan solas, y en una cuenta sin credencial);
- `motivo`: `null` al rojo; si no, una de cuatro frases:
  `La conexión está por vencer; reconéctala antes.`, `La conexión falló; reconecta la cuenta.`,
  `La conexión venció; reconecta la cuenta.` o
  `La cuenta está desconectada; reconéctala para programarle.`;
- `trialReels`: en Instagram, `si` si un trial reel ya salió en esa cuenta, `no` si Meta rechazó
  uno por elegibilidad (con la frase del rechazo en `trialReelsMotivo`), y `null` mientras no se
  sepa; `null` también en las otras redes.

Programa solo hacia una con `conectada: true` y `proximamente: false`: las demás rechazan la
fila. Una con `fierro` `frio` y `conectada: true` acepta la fila, pero no publica hasta que el
dueño la reconecte en Los Fierros: díselo antes.

## 3e. Subir un archivo una vez, sin Drive

```bash
curl -X POST https://tu-parrilla.cl/api/media -H "Authorization: Bearer $LLAVE_PARRILLA" \
  -H "Content-Type: application/json" -d '{ "nombre": "video-01.mp4", "tipo": "video/mp4", "bytes": 41937210 }'
```

Devuelve `{ url, subir, cabeceras, mediaType, vence }`. Sube el archivo con un `PUT` a `subir`
con las dos `cabeceras` tal cual (`Content-Type` y `Cache-Control`: van firmadas, y cualquier
diferencia es `403`), antes de `vence` (una hora). Después pon `url` en el `media` (o en la
`portada`) de cada fila que lo lleve: el lote no lo vuelve a bajar, la fila vuelve con
`"origen": "almacen"` y el mismo archivo sirve para todas las filas. Nómbralo en un lote dentro
de la hora siguiente a subirlo, o se borra; un video se borra cuando salió el último post que
lo usa. Si no está, la fila trae `No se pudo leer una media de la fila.` con
`"motivo": "no subido"`. La `url` queda en la carpeta del dueño de la llave: solo los lotes de
ese mismo dueño la usan sin bajarla.

`tipo` es uno de `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`,
`video/quicktime`, `video/webm`; `bytes`, un número (`0` si no lo sabes), hasta 500 MB. Los
rechazos son `400` con `{ error }`: `Ese tipo de archivo no se puede publicar.`,
`El archivo supera los 500 MB.` o `El cuerpo no se entendió.`; sin llave válida, `401`.

## 3f. Archivar lo quemado, sin borrarlo

```bash
curl -X POST https://tu-parrilla.cl/api/schedule/posts/<id>/archivar \
  -H "Authorization: Bearer $LLAVE_PARRILLA" \
  -H "Content-Type: application/json" \
  -d '{ "cuentaId": "<cuentaId>" }'
```

Un destino quemado que ya no pide nada —lo programaste de nuevo aparte, o era una prueba— deja
de salir en `fallidos` del resumen, en «Se quemó» del panel y del teléfono, y en el correo del
día. No se borra: sigue `failed`, con su `error` y sus `intentos`, y en
`GET /api/schedule/posts` trae `archivado: true`. Con `cuentaId`, ese destino; sin cuerpo,
todos los quemados del post. Repetirlo no hace nada. `…/desarchivar`, con el mismo cuerpo, lo
devuelve. Si el dueño lo reprograma desde su panel, deja de estar archivado solo.

Para encontrar todo lo quemado sin bajar el calendario entero:
`GET /api/schedule/posts?estado=failed`. Con `estado` y sin `desde` ni `hasta` no hay ventana
de fechas; `estado` acepta `scheduled`, `publishing`, `published` y `failed`, y otro valor da
`400` con `«estado» tiene que ser scheduled, publishing, published o failed.`

| Respuesta | Cuándo |
|---|---|
| `200` `{ "ok": true, "id": "<id>", "archivados": <n> }` | Se archivó (`desarchivados` en `…/desarchivar`). `<n>` cuenta los destinos que cambiaron: `0` si ya estaban así, porque repetirlo no hace nada. |
| `400` `{ "error": "El cuerpo no se entendió." }` | El cuerpo no es un objeto JSON, o `cuentaId` no es texto. |
| `404` `{ "error": "Ese post no existe." }` | No hay un post con ese id para este dueño. No distingue «no existe» de «no es tuyo». |
| `404` `{ "error": "Ese post no tiene un destino en esa cuenta." }` | Ese `cuentaId` no es destino de ese post. |
| `409` `{ "error": "Ese post no tiene nada quemado." }` | Sin `cuentaId`, y ningún destino del post está quemado. |
| `409` `{ "error": "Ese destino no está quemado: solo lo quemado se archiva o se desarchiva." }` | El destino de ese `cuentaId` está programado, publicando o publicado. |

## 3g. Comprobar lo que quedó programado

```bash
curl https://tu-parrilla.cl/api/schedule/posts/<id>   -H "Authorization: Bearer $LLAVE_PARRILLA"
```

`<id>` es el `postId` que devolvió el lote. Responde el post con la misma forma que cada
elemento de `posts` en `GET /api/schedule/posts`: texto, `fecha`, media, `atributos`, `ref` y
`redes`, con el estado de cada destino y sus **`opciones`** tal como se guardaron. Úsalo justo
después de programar, en vez de decirle a la persona que lo revise en la red:

- TikTok en `directo` trae todas sus casillas explícitas —`privacidad`, `comentarios`, `duo`,
  `pegar`, `comercial`, `ia` y `musica`—, con `false` en las que no se encendieron. `musica` se
  guarda aunque el post sea un video, pero solo viaja con fotos: TikTok no deja ponerle música a
  un video por su API. Si con música les va mejor, lo dice `musica` en
  `/api/metrics/que-funciona` (sección 7). Una clave que
  mandaste y no está ahí no se guardó (TikTok ignora claves desconocidas).
- TikTok en `borrador` trae `{ "modo": "borrador" }`; un trial reel, `{ "trialReel": true }`;
  un reel con música de Instagram, `{ "musica": { "audioId", "titulo", "artista", "volumenMusica", "volumenVideo" } }`
  (más `"trialReel": true` si también lo es); YouTube con alguna opción,
  `{ "visibilidad", "ia", "playlist" }` con las tres explícitas (sección 5d), y `null` si sale como
  siempre; una red que no pide nada, `null`.
- Un destino `published` puede traer **`aviso`**: salió, pero algo de después quedó a medias. Hoy
  solo en YouTube, cuando el video no entró a la playlist elegida (sección 5d). No es un fallo ni
  se reintenta: díselo a la persona para que lo agregue en YouTube Studio. En todo lo demás es `null`.

Son las opciones que **Tu Parrilla le manda** a la red. Lo que la cuenta no permite (un dúo
deshabilitado en TikTok, por ejemplo) se manda apagado sin fallar, y eso solo se ve en la red.

| Respuesta | Cuándo |
|---|---|
| `200` con el post | Existe y es del dueño de la llave. |
| `404` `{ "error": "Ese post no existe." }` | No hay un post con ese id para este dueño. No distingue «no existe» de «no es tuyo». |

`GET /api/schedule/posts` (por fechas o por `estado`) trae las mismas `opciones` en cada destino.

## 3h. Guardar en la cámara de frío de La Cocina

La cámara de frío (de día, la nevera) guarda el material en bruto del dueño para el chef de la
casa: largos crudos, intros, outros, música, logos, fotos, tipografías. No vence y no se
programa: es lo que el dueño elige al pedir una comanda. Para programar un archivo, la sección
3e; para dejarlo en la cámara, esta. Si el dueño no tiene La Cocina encendida, todo es `403` con
`La Cocina no está encendida para tu cuenta.`

`GET /api/bodega` devuelve `{ camara: { cuantos, guardados, subiendo, cuota }, materiales }`
(bytes; libre es `cuota - guardados - subiendo`). Cada material trae `id`, `nombre`, `uso`, `bytes`,
`duracionS`, `tipoArchivo`, `clase`, `creadoEn` y `enMarcha`, sin URL. Léelo antes de subir.

Subir va por partes, en cuatro llamadas:

1. `POST /api/bodega/subidas` con
   `{ "nombre": "Intro de marca.mp4", "tipo": "video/mp4", "bytes": 83886080, "uso": "intro", "duracionS": 6.5, "derechos": true }`
   → `201` `{ id, tamanoParte, partes }`. `bytes` es el peso exacto. `uso` es opcional, uno de
   `crudo`, `intro`, `outro`, `broll`, `musica`, `logo`, `letras` u `otro`. `derechos: true` es
   obligatorio y afirma que el dueño tiene los derechos y el permiso de quienes aparecen: no lo
   mandes sin que el dueño te lo haya confirmado. Si `tipo` falta, vale la extensión del nombre.
   Topes: video 20 GB, audio 2 GB, imagen 50 MB, lo demás (tipografía, PDF, SRT, VTT, TXT, ZIP)
   500 MB.
2. `POST /api/bodega/subidas/{id}/partes` con `{ "partes": [1, 2] }` (hasta 50 por pedido) →
   `{ partes: [{ numero, url, bytes }], vence }`. Cada enlace vence en una hora.
3. `PUT` de cada tramo a su `url`: los bytes de la parte `n` van desde `(n - 1) * tamanoParte`,
   **sin cabeceras**.
4. `POST /api/bodega/subidas/{id}/cerrar` → `201` `{ material }`, o `200` con el mismo si ya se
   cerró.

Si se corta, `GET /api/bodega/subidas/{id}` trae `llegaron` (las partes que están): sube las que
faltan y cierra. `DELETE /api/bodega/subidas/{id}` la aborta. Una abierta más de un día se aborta
sola.

Frases literales (`{ error }`):
- `400`: `No entendimos el archivo: falta su nombre, su tipo o su tamaño.`,
  `Marca que tienes los derechos de este material y el permiso de quienes aparecen.`,
  `Ese uso no existe: elige uno de la lista, o ninguno.`,
  `«partes» es una lista de 1 a 50 números de parte de este archivo.`,
  `El cuerpo no se entendió.`, y las que nombran el archivo:
  `«<nombre>»: ese tipo de archivo no se guarda. …` o
  `«<nombre>» pesa más de 20 GB, el tope de un video.` (con el tope de su clase);
- `404`: `Esa subida no existe, o ya se abortó.`;
- `409`: `No hay espacio para «<nombre>»: …` (no cabe en la cuota; no reintentes, díselo al
  dueño), `Faltan <n> partes por subir: súbelas y vuelve a cerrar.` (o
  `Falta 1 parte por subir: súbela y vuelve a cerrar.`),
  `El archivo llegó con otro tamaño: súbelo de nuevo.` (la subida se borró: empieza otra) y
  `Esa subida ya se cerró: el archivo está arriba.`;
- `500`: `Falta configurar Cloudflare R2 (R2_*).`

Por API no se renombra, no se saca nada de la cámara y no se pide una comanda: eso lo hace el
dueño en su panel.

## 4. Lo que esta API no hace

- **No edita un post programado.** Para cambiar texto, hora, destinos o media hay que
  borrarlo (sección 3b) y programarlo de nuevo, o corregirlo a mano en `/admin/schedule`.
- **No es para responder sugerencias, salvo que seas el equipo de Tu Parrilla.**
  `POST /api/sugerencias/respuesta` (`{ "issue": 321, "respuesta": "…" }`) responde lo que alguien
  escribió en el libro de sugerencias, y solo con una llave del admin: con cualquier otra, `403`
  `Solo el admin responde sugerencias: esta llave es de otra cuenta.`. Si editas para un creador,
  no lo uses. Los detalles, en la sección 3e de `api-editor.md`.
- **No pide comandas a La Cocina.** Guarda en la cámara de frío (sección 3h), pero pedir una
  comanda, renombrar o sacar lo de la cámara lo hace el dueño en su panel.
- **No conecta cuentas.** Conectar, reconectar o quitar una cuenta lo hace el dueño en Los
  Fierros (`/admin/accounts`); la API solo las lee (sección 3d).
- **No manda nada de inmediato.** Todo lo que entra por `POST /api/schedule/batch` espera a su
  `fecha`; no existe una forma de publicar ahora mismo por esta vía.
- **Leen comentarios Instagram, Facebook y YouTube; Threads y TikTok, solo en las cuentas donde la
  instalación los abrió** (y, en TikTok, donde el dueño los activó en Los Fierros). Una `regla` en
  un post que va únicamente a una cuenta de TikTok sin comentarios **no hace nada** —no falla, no
  avisa: nunca se dispara, porque nadie lee esos comentarios—. Ante la duda, la regla vale la pena
  si el post sale a Instagram, Facebook o YouTube.
- **Instagram puede esconder el comentario que es solo la palabra.** Un `GUIA` suelto a veces
  queda visible solo para quien lo escribió: Instagram lo cuenta, pero no se lo entrega a la
  dueña ni a la API, y la regla nunca lo ve. Al escribir el texto del post, pide la palabra
  dentro de una frase («comenta "quiero la GUIA"») o usa una palabra distinta en cada post;
  la regla la reconoce igual dentro de la frase.
- **No dice qué hizo la red con las opciones.** `GET /api/schedule/posts/{id}` (sección 3g)
  muestra lo que quedó guardado y lo que se le va a mandar a la red, no lo que la red aplicó
  después: si TikTok le negó el dúo a esa cuenta o si un trial reel ya se graduó se ve en la red.

## 5. Trial reels de Instagram

```bash
curl -X POST https://tu-parrilla.cl/api/schedule/batch \
  -H "Authorization: Bearer $LLAVE_PARRILLA" \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "fecha": "2026-10-01 19:00",
        "texto": "Reel de prueba.",
        "redes": ["instagram"],
        "media": ["https://ej.com/reel.mp4"],
        "opciones": { "instagram": { "trialReel": true } }
      }
    ]
  }'
```

Tres cosas, en orden:

1. **Un video, nada más.** `media` tiene que resolver a exactamente un video y ninguna foto;
   si no, la fila se rechaza al programar con `Un trial reel es un solo video, sin fotos.`,
   antes de subir un byte.
2. **La elegibilidad se descubre al publicar, no al programar.** Instagram exige la función
   habilitada en esa cuenta (profesional, pública, con seguidores suficientes, según los
   términos de Meta); una fila aceptada acá puede fallar después en ese destino, y queda en
   fallo en esa misma corrida, sin los reintentos que sí recibe cualquier otro rechazo. El
   `error` empieza con la cuenta. Si faltan seguidores (una cuenta nueva):
   `@<cuenta> no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores, y esta no lo alcanza. Prográmalo como reel normal o en otra cuenta.`
   Por otro motivo, seguida de lo que Meta dijo:
   `@<cuenta> no tiene trial reels disponibles, probablemente porque Instagram no le habilitó la función. Prográmalo como reel normal o en otra cuenta.`
   Con cualquiera de las dos, los demás trial reels de esa cuenta van a fallar igual:
   pásalos a reels normales o a otra cuenta. Desde ese rechazo, `GET /api/schedule/cuentas` dice
   `trialReels: "no"` en esa cuenta (sección 3d): no le propongas trial reels mientras diga eso.
3. **No se sabe si se graduó, por API.** El dueño lo comparte con todos desde la app de
   Instagram cuando quiera; no hay endpoint que lo dispare ni que lo consulte.

## 5c. Música de Instagram en un reel

```json
"opciones": { "instagram": { "musica": { "audioId": "587784541076604", "titulo": "Tusa", "artista": "Karol G", "volumenMusica": 50, "volumenVideo": 100 } } }
```

- **El `audioId` no se busca por esta API**: sale de una canción ya elegida en el panel o el
  teléfono («Música de Instagram»). No inventes uno: Instagram rechazaría el reel.
- `titulo` es obligatorio; `artista` puede ser `null`. Los volúmenes son enteros de 1 a 100
  (canción y sonido propio del video); ausentes valen 100. Con voz en el video, una canción a 30–50
  no la tapa. Puede ir junto a `trialReel`, no con `historia`.
- **Solo viaja en un reel** (un video solo): con fotos o carrusel se guarda y no se manda.
- **Solo con cuentas conectadas con Facebook**: con el login de Instagram la fila se rechaza con
  `La música de Instagram solo funciona en cuentas conectadas con Facebook, y esta se conectó con el login de Instagram.`
- **No hay vista previa** del reel con la canción. Si Instagram la rechaza al publicar, el destino
  falla al tiro con `Instagram no aceptó la canción «<titulo>» de <artista> en <cuenta>. Instagram dice: «…». Borra esta publicación y prográmala de nuevo con otra canción o sin música.`

## 5d. YouTube: visibilidad, «Hecho con IA» y playlist

```json
"opciones": { "youtube": { "visibilidad": "unlisted", "ia": true, "playlist": "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG" } }
```

- Todo es opcional. Sin `opciones`, el video sale **público**, sin la declaración de IA y sin
  playlist, como siempre.
- `visibilidad`: `public`, `unlisted` (solo con el link) o `private` (solo el dueño). No uses los
  valores de TikTok (`PUBLIC_TO_EVERYONE`…): se rechazan.
- `ia: true` declara el video como contenido alterado o sintético. Ponlo cuando algo realista —una
  persona, un lugar, un hecho— se hizo o se cambió con IA y podría pasar por real; no para una
  animación evidente ni un filtro. Si no sabes, pregúntale a la persona.
- `playlist`: el id de una playlist **del canal**, o `null`. Esta API no lista playlists: pídeselo
  a la persona —es lo que va después de `list=` en el link de la playlist— y no inventes uno. Se
  aceptan letras, números, `_` y `-`; un link entero se rechaza: manda solo el id.
- Una clave distinta de esas tres se rechaza con `Las opciones de la red no se entendieron.`
- **La playlist se agrega cuando el video ya salió.** Si YouTube no lo deja (la playlist se borró,
  no es del canal), el destino queda `published` igual y trae un `aviso` en
  `GET /api/schedule/posts/{id}`:
  `Salió en YouTube, pero YouTube no lo agregó a la playlist que elegiste. Agrégalo tú desde YouTube Studio.`
  o `Salió en YouTube, pero la playlist que elegiste ya no está en el canal. Si quieres, agrégalo a otra desde YouTube Studio.`
  No reprogrames por eso: el video ya está en el canal, y reprogramarlo lo subiría otra vez.

## 5b. Historias de Instagram y Facebook

Una historia es un post con **un solo archivo** (foto o video) que sale como historia en
Instagram, en la página de Facebook, o en las dos. Se pide por destino, igual que el trial reel:

```json
{
  "fecha": "2026-11-02 19:00",
  "texto": "",
  "redes": ["instagram", "facebook"],
  "media": ["https://ej.com/historia.jpg"],
  "opciones": { "instagram": { "historia": true }, "facebook": { "historia": true } }
}
```

Para una **secuencia** —varias historias que salen en orden—, el atajo: `"historia": true` en
la fila y varios archivos en `media`. La fila se expande en una historia por archivo, en ese
orden, a la misma `fecha`; cada una espera a que salga la anterior en la misma cuenta. Su
resultado trae `postIds`, un id por historia en su orden (`null` la que no entró), y `postId`
es el de la primera. Con `ref`, cada historia guarda `<ref>#1`, `<ref>#2`…, y reenviar la
fila devuelve las que ya entraron.

```json
{
  "fecha": "2026-11-02 19:00",
  "texto": "",
  "redes": ["instagram"],
  "media": ["https://ej.com/1.jpg", "https://ej.com/2.mp4", "https://ej.com/3.jpg"],
  "historia": true
}
```

Lo que una historia no lleva, con la frase con que se rechaza la fila:

- **Texto:** `Una historia no lleva texto.` Manda `texto` vacío.
- **Otro tipo de destino:** `Una historia va solo a Instagram y Facebook, y todos sus destinos son historia.`
  Un reel en Instagram y una historia en Facebook son dos filas.
- **Más de un archivo** (sin el atajo): `Una historia es un solo archivo, foto o video.`
- **Foto que no sea JPG, si va a Instagram:** `Instagram recibe la historia en foto solo en JPG.`
  Facebook acepta PNG.
- **Palabra clave:** `Una historia no tiene comentarios: no lleva palabra clave.`
- **Portada:** `Una historia no lleva portada.`
- **Trial reel a la vez:** `Una historia no puede ser trial reel.`
- **El atajo con `opciones` propias:** `Con «historia» la fila no lleva «opciones»: la historia ya dice todo.`
- **El atajo con más de 30 archivos:** `Una secuencia lleva hasta 30 historias.`

Antes de proponer una historia:

1. **Vertical y corta.** El servidor no mide el archivo. Un video de más de 60 segundos o que
   no sea vertical se acepta al programar, y si Meta lo rechaza, el destino falla con lo que
   Meta dijo.
2. **Solo cuentas de empresa en Instagram.** Instagram ha rechazado historias por API desde
   cuentas de creador. Si pasa, el destino falla al publicar, sin reintentos, con
   `@<cuenta> no puede publicar historias por API: Instagram solo lo permite a cuentas de empresa (Business). Cámbiala en Instagram o publica la historia desde la app.`
3. **Sin enlaces, stickers ni encuestas.** La API de Meta no los permite.
4. **Sin métricas ni comentarios.** Una historia no aparece en las métricas de Tu Parrilla
   ni en La Mesa.

## 6. Lo que Meta no permite (léelo antes de proponer mandar el PDF adjunto)

El documento de `regla.documentoUrl` **nunca viaja como adjunto**. Se concatena como enlace al
final de `mensaje`, separado por una línea en blanco. La razón es una restricción de Meta, no
una limitación técnica de este sistema — cítala si alguien propone lo contrario:

> «Only one message can be sent to the Instagram user who commented.»
>
> «Only when the Instagram user responds to the private message can you continue the
> conversation within the 24-hour messaging window.»
>
> — Documentación de Meta, respuestas privadas en Instagram.

Una sola respuesta privada por comentario, y ningún segundo mensaje hasta que la persona
responda. Con eso descartado, la única forma de entregar el PDF es un enlace dentro del único
mensaje que sí se puede enviar — nunca dos envíos (texto y luego archivo).

**Estado de hoy, y lo que cambia:** el envío por mensaje privado está construido, y apagado
mientras Meta revisa `instagram_manage_messages` y `pages_messaging` (solo la cuenta de
revisión lo tiene encendido). Mientras esté apagado, todo — el `mensaje` completo, con el
enlace del documento si lo hay — sale como **respuesta pública** al comentario, nunca por DM.
Encendido, en Instagram y Facebook `mensaje` (con el documento) va por DM, una vez por persona
en cada post, y `respuestaPublica` queda como la respuesta pública corta; en las demás redes, o
si ya pasaron más de 7 días desde que se publicó el post, sigue siendo público. El
documento en sí no cambia de forma con este interruptor: siempre es un enlace, nunca un
adjunto — eso lo impone Meta, no la bandera.

**El documento es público por URL.** El PDF copiado al almacenamiento propio no tiene control
de acceso ni caducidad: quien consiga el enlace —lo intercepte, lo reenvíe, lo adivine— puede
abrirlo, sin sesión ni credencial. Es una decisión de producto para este caso de uso (una
guía que se regala a cambio de un comentario), no un descuido ni algo pendiente de arreglar.

## 7. Leer cómo le fue: métricas, el mejor X % y qué funciona

Tres endpoints de lectura, con la misma llave. El detalle de cada número está en
`api-editor.md`, secciones 2, 2b y 2c; esto es lo que hace falta para pedirlos bien.

- `GET /api/metrics/posts?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` — una fila por publicación
  **publicada** en el rango (no por actividad en él), con sus métricas. Cada fila trae
  `cuenta` (`id`, `red`, `nombre`). En TikTok, los `atributos` de un post del calendario
  llegan desde la sincronización siguiente a su publicación (la diaria, o «Sincronizar
  ahora»): TikTok no siempre da el id del video al publicar y es la sincronización la que lo
  cruza por texto y hora. Antes de eso, el post sale con `atributos: null`.
  Los números de una publicación de los últimos 10 días son de hoy o ayer; los de una más
  vieja se leen cada vez más espaciado (una vez por semana hasta el mes, cada dos semanas
  hasta los tres meses, cada cuatro después), así que pueden ir hasta esas semanas atrás.
  Dos métricas comparan a la misma edad: `viewsA7Dias`, el contador una semana después de
  publicar, y `contraSuCuenta`, eso dividido por la mediana de su cuenta en el rango (`2` es
  el doble de lo normal de esa cuenta). Lo de los últimos 7 días todavía no las tiene.
- `GET /api/metrics/mejores?desde=…&hasta=…&metrica=viewsGanadas&percentil=10` — el mejor X %
  de lo publicado en el rango: `corte` (lo que había que sacar para entrar), `compiten`,
  `mejores` (filas como las de arriba, con `puesto` y `valor`), `medianas` de arriba contra
  el resto, `rinden` (cuántas veces más rinde la mediana de arriba) y `enComun` (lo que se
  repite más entre las de arriba: un atributo, la red, el formato, el día o la franja
  horaria, con `veces`). Con `lado=peor`, el peor X %: las mismas claves con «peores» en vez
  de «mejores» (`peores`, `medianas.peores`, y `enPeores` y `peores` en `enComun`), de la
  peor a la menos mala, y `corte` es lo más que sacó una de las que entraron.
- `GET /api/metrics/que-funciona?desde=…&hasta=…` — qué `tema`, qué `estilo` y qué `formato`
  (el de la red: Reel, Carrusel, Foto, Video…) anduvieron mejor en lo publicado en el rango,
  contra lo normal de cada cuenta, y si la `musica` hizo diferencia. Una clave por cada uno, con `estado` (`gana`, `parejo`,
  `faltan` o `sinValor`), la `frase` que muestra el panel —úsala tal cual para contárselo al
  dueño—, `primero` y `segundo`, y `valores` con `publicaciones`, `medidas` (de cuántas sale
  la mediana) y `contraSuCuenta`. Solo hay `gana` con al menos dos valores de 10 publicaciones
  medidas y el mejor en ×1,2 o más: con `faltan`, no declares un ganador por tu cuenta.
  Trae además **`musica`**: con música contra sin música, para decidir si recomendarla. Cuenta
  la música que Tu Parrilla le pidió a la red al publicar —hoy, `opciones.musica: true` en las
  fotos de TikTok en `directo`—, no el atributo `musica` ni la que ya trae el video. Forma:
  `{ estado, frase, sinSaber, grupos: [{ red, formato, estado, frase, primero, segundo,
  valores, canciones }] }`, un grupo por red y formato donde algo llevó música (las fotos de
  TikTok: `red: "tiktok"`, `formato: "Foto"`), con `valores` `"con música"` y `"sin música"`
  y la forma de las demás. Lo subido directo en la red y lo mandado a la bandeja de TikTok no
  entran —no se sabe si llevaron música—: `sinSaber` los cuenta. Un lado gana con 10 medidas
  por lado y ×1,2 **o más de lo que sacó el otro**, y puede ganar `"sin música"`. `canciones`
  agrupa lo que llevó música por título, sin veredicto, cuando la red da el título (TikTok no:
  ahí va vacío). Recomienda música solo con `gana` en el grupo del formato que vas a publicar.
  Ejemplo: `"musica": { "estado": "gana", "frase": "Las fotos de TikTok anduvieron mejor con
  música: ×1,4 las views normales de su cuenta a los 7 días (12 publicaciones), contra ×0,8 sin
  música (10 publicaciones).", "sinSaber": 18, "grupos": [{ "red": "tiktok", "formato": "Foto",
  "estado": "gana", "frase": "…", "primero": { "valor": "con música", "publicaciones": 13,
  "medidas": 12, "contraSuCuenta": 1.4 }, "segundo": { "valor": "sin música", "publicaciones":
  10, "medidas": 10, "contraSuCuenta": 0.8 }, "valores": [ … ], "canciones": [] }] }`. Sin
  ningún grupo: `{ "estado": "sinValor", "frase": "Nada de lo publicado desde Tu Parrilla en el
  período llevó música de la red (como «Música de TikTok» en las fotos).", "sinSaber": …,
  "grupos": [] }`. El detalle, en `api-editor.md`, sección 2c, «La música».

Filtros que valen en los tres: `red`, y `cuenta` —su `id` (el de la sección 3d) o su nombre en
la red, con o sin «@»—. Para «el mejor 10 % de esta cuenta», pasa `cuenta`: sin ella, la cuenta más grande
llena la tajada de arriba, salvo con `metrica=contraSuCuenta`, que mide a cada una contra lo
suyo. Solo de `mejores`:

- `metrica`: `viewsGanadas` (por defecto), `contraSuCuenta`, `viewsA7Dias`, `visitas`,
  `clicks`, `interacciones` o `arrastre`.
- `percentil`: un entero de 1 a 50 (por defecto 10).
- `lado`: `mejor` (por defecto) o `peor`.
- `recientes`: `si` (por defecto) o `no`. Con `no`, en las métricas que no son a igual edad
  no compite lo que tenía menos de 7 días al cierre del rango: casi no tuvo tiempo de sumar,
  y en el peor X % llenaría la tajada. `fueraPorRecientes` dice cuántas quedaron fuera.

Frases de error (`400`):

| Frase | Causa |
|---|---|
| `El rango de fechas no se entendió (usa YYYY-MM-DD).` | `desde`/`hasta` ilegibles o invertidos |
| `Red desconocida: <valor>.` | `red` que no es una de las seis |
| `Cuenta desconocida: <valor>.` | ninguna cuenta del dueño tiene ese id ni ese nombre |
| `Hay más de una cuenta llamada <valor>: usa su id, o agrega red=.` | el nombre se repite en dos redes |
| `La métrica no se entendió (usa contraSuCuenta, viewsA7Dias, viewsGanadas, visitas, clicks, interacciones o arrastre).` | `metrica` desconocida |
| `El percentil tiene que ser un entero entre 1 y 50.` | `percentil` fuera de rango o con decimales |
| `El lado no se entendió (usa mejor o peor).` | `lado` desconocido |
| `recientes va con si o no.` | `recientes` con otro valor |

Cuatro reglas que cambian la lectura:

- **Un `null` es «no se sabe», nunca cero**, y no compite en el mejor X %.
- **Para comparar publicaciones entre sí, `contraSuCuenta`.** `viewsGanadas` le da ventaja a
  lo que salió al principio del rango, y entre cuentas, a la más grande; `contraSuCuenta`
  mide a todas a los 7 días y contra lo normal de su propia cuenta. Una cuenta con menos de 5
  publicaciones del rango con `viewsA7Dias` no la tiene. Para «qué tema, estilo o formato
  funciona» y «¿le pongo música?», `/api/metrics/que-funciona` ya lo responde; para otro atributo (el `hook`, la
  `serie`), agrupa por atributo las filas de `/api/metrics/posts` y compara las medianas de
  `contraSuCuenta`.
- **YouTube no entra en `viewsGanadas`, `viewsA7Dias`, `contraSuCuenta`, `interacciones` ni
  `arrastre`**: sus políticas no permiten calcular métricas con sus datos. Sí entra en
  `visitas` y `clicks`, que mide Tu Parrilla.
- **Facebook llega hoy sin `views` ni `alcance`** (y sin lo que sale de ellas: `viewsGanadas`,
  `viewsA7Dias`, `contraSuCuenta`, `arrastre`), en todas sus publicaciones, reels incluidos:
  Meta los da solo con un permiso que Tu Parrilla todavía no tiene. `likes`, `comentarios` y
  `compartidos` sí llegan. Deja Facebook fuera de cualquier comparación de views en vez de
  leer esos `null` como «nadie lo vio».
- **`pocas: true`** (compiten menos de 20) quiere decir que el mejor 10 % son una o dos
  publicaciones: no concluyas nada; amplía el rango o sube `percentil`.
