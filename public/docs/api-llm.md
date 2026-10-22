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

Cinco endpoints de escritura: `POST /api/schedule/batch` programa, `DELETE /api/schedule/posts/{id}` saca lo programado (sección 3b), `POST /api/schedule/posts/{id}/archivar` y `…/desarchivar` archivan lo quemado sin borrarlo (sección 3f), y `POST /api/media` sube un archivo una vez para nombrarlo en varias filas (sección 3e). Autenticación en todos los
endpoints:

```
Authorization: Bearer <tu llave>
```

La llave te la da la persona dueña de las cuentas, que la genera en su panel, en Tu IA
(`/admin/ia`; las que salen de ahí empiezan con `tp_`). Todo lo que hagas con ella es a su nombre: sus cuentas, sus posts, su zona horaria.
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
  `La cuenta está desconectada; reconéctala para programarle.`

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

## 4. Lo que esta API no hace

- **No edita un post programado.** Para cambiar texto, hora, destinos o media hay que
  borrarlo (sección 3b) y programarlo de nuevo, o corregirlo a mano en `/admin/schedule`.
- **No conecta cuentas.** Conectar, reconectar o quitar una cuenta lo hace el dueño en Los
  Fierros (`/admin/accounts`); la API solo las lee (sección 3d).
- **No manda nada de inmediato.** Todo lo que entra por `POST /api/schedule/batch` espera a su
  `fecha`; no existe una forma de publicar ahora mismo por esta vía.
- **Solo tres redes leen comentarios: Instagram, Facebook y YouTube.** Una `regla` en un post que
  va únicamente a TikTok **no hace nada** —no falla, no avisa: nunca se dispara,
  porque nadie lee esos comentarios—. La regla vale la pena solo si el post sale a alguna de esas
  tres.
- **No devuelve las opciones de un post ya programado.** `GET /api/schedule/posts` no trae
  `opciones` por destino, así que un trial reel programado por esta vía no se puede verificar
  después por API — ni que se aceptó como trial, ni si ya se graduó.

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
   pásalos a reels normales o a otra cuenta.
3. **No se sabe si se graduó, por API.** El dueño lo comparte con todos desde la app de
   Instagram cuando quiera; no hay endpoint que lo dispare ni que lo consulte.

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

**Estado de hoy, y lo que cambia:** el envío por mensaje privado está construido pero apagado
en este despliegue (falta el App Review de Meta para `instagram_manage_messages` y
`pages_messaging`). Mientras esté apagado, todo — el `mensaje` completo, con el enlace del
documento si lo hay — sale como **respuesta pública** al comentario, nunca por DM. Cuando el
privado se encienda, en Instagram y Facebook `mensaje` (con el documento) pasará a ir por DM y
`respuestaPublica` quedará como la respuesta pública corta; en las demás redes, o si ya
pasaron más de 7 días desde que se publicó el post, seguirá siendo público igual que hoy. El
documento en sí no cambia de forma con este interruptor: siempre es un enlace, nunca un
adjunto — eso lo impone Meta, no la bandera.

**El documento es público por URL.** El PDF copiado al almacenamiento propio no tiene control
de acceso ni caducidad: quien consiga el enlace —lo intercepte, lo reenvíe, lo adivine— puede
abrirlo, sin sesión ni credencial. Es una decisión de producto para este caso de uso (una
guía que se regala a cambio de un comentario), no un descuido ni algo pendiente de arreglar.

## 7. Leer cómo le fue: métricas y el mejor X %

Dos endpoints de lectura, con la misma llave. El detalle de cada número está en
`api-editor.md`, secciones 2 y 2b; esto es lo que hace falta para pedirlos bien.

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

Filtros que valen en los dos: `red`, y `cuenta` —su `id` (el de la sección 3d) o su nombre en
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
  publicaciones del rango con `viewsA7Dias` no la tiene. Para «qué hook funciona», agrupa
  por atributo las filas de `/api/metrics/posts` y compara las medianas de `contraSuCuenta`.
- **YouTube no entra en `viewsGanadas`, `viewsA7Dias`, `contraSuCuenta`, `interacciones` ni
  `arrastre`**: sus políticas no permiten calcular métricas con sus datos. Sí entra en
  `visitas` y `clicks`, que mide Tu Parrilla.
- **`pocas: true`** (compiten menos de 20) quiere decir que el mejor 10 % son una o dos
  publicaciones: no concluyas nada; amplía el rango o sube `percentil`.
