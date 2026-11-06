# La API de La Cocina: cómo habla el chef con Tu Parrilla

Para quien escribe el lado del chef: el cliente de esta API en `marca-personal`. En la fase 0 es
una herramienta de línea de comandos que maneja una persona; el servicio que toma, cocina y
entrega solo se está escribiendo (VicentePareja/marca-personal#22), y lo que necesita de este lado
—las preguntas con plazo y el latido que dice si toma solo— existe desde el 2026-11-06. El porqué de cada cosa está en el diseño,
`docs/superpowers/specs/2026-10-22-la-cocina-design.md`; esto es el contrato de lo que ya existe.

**Lo que existe hoy son las tablas, estas rutas y la pestaña del panel.** En el panel:

- el admin le enciende la cocina a una cuenta en Los Maestros;
- el usuario guarda su material en bruto en la cámara de frío de La Cocina (la bodega), y pide
  eligiendo de ahí: el mismo material sirve para varias comandas;
- sigue su comanda en La Cocina;
- contesta lo que el chef le pregunta, en La Cocina del panel o del teléfono (desde el 2026-11-06);
- lo que el chef entrega espera en el mesón, donde el usuario lo programa o lo descarta.

Lo que está en la cámara no vence: lo saca el usuario. Lo que nadie programa en 30 días en el mesón
se borra solo.

## Cómo se habla

**El chef le pregunta a Tu Parrilla; Tu Parrilla nunca llama al chef.** El servidor del chef no
expone ningún puerto: toma lo que hay, lo cocina y lo informa. Un corte de luz o de red en la
cocina no pierde nada, porque la comanda espera.

Todas las rutas van bajo `https://tu-parrilla.cl/api/cocina/` y piden la **credencial de la
cocina**:

```
Authorization: Bearer <COCINA_SECRET>
```

La conocen solo el despliegue y el servidor del chef. Sin ella, o con otra: `401` con el cuerpo
`No autorizado`. No es la llave de ningún usuario.

**Lo que la credencial alcanza:**

- Solo las comandas de usuarios con La Cocina encendida, y solo lo que esas comandas entregan: sus
  insumos y sus creativos.
- No lee posts, cuentas ni métricas de nadie.
- No programa ni borra nada.

Lo cocinado llega al mesón del dueño, y lo programa él.

Las respuestas son JSON. Un error es `{ "error": "<frase>" }`, con la frase en palabras. Los `404`
no distinguen «no existe» de «no es de alguien con la cocina».

## El ciclo de una comanda

```
recibida ──tomar──▶ revisando ──▶ en_preparacion ──▶ en_el_horno ──▶ sirviendo ──▶ lista
                       │                │                 │             │ (3 de 5…)
                       ▼                ▼                 ▼             ▼
                   rechazada         fallida           fallida       fallida

revisando ──preguntar──▶ pregunta ──respuesta o plazo──▶ revisando
en_preparacion ──preguntar──▶ pregunta ──respuesta o plazo──▶ en_preparacion
```

`pregunta` vuelve siempre al estado de donde salió: lo devuelve la respuesta del dueño, o el plazo.

- **`tomar`** saca a una comanda de `recibida`: la pasa a `revisando` y la deja a nombre de un
  trabajador.
- **Desde ahí, el chef informa cada cambio** con `estado`. Las transiciones que existen:

  | Desde | A |
  |---|---|
  | `revisando` | `en_preparacion`, `en_el_horno`, `rechazada`, `fallida` |
  | `en_preparacion` | `en_el_horno`, `sirviendo`, `fallida` |
  | `en_el_horno` | `sirviendo`, `lista`, `fallida` |
  | `sirviendo` | `sirviendo` (otra tanda), `lista`, `fallida` |

- **Rechazar** es para lo que está fuera de alcance, y se hace al revisar: un video en otro idioma,
  sin persona a cámara.
- **`fallida`** es cuando algo se rompió y no se pudo terminar.

  Los dos piden `motivo`, en palabras para el usuario, porque es lo que lee.
- **`servida` y `cancelada` son del usuario:** el chef no lleva una comanda a ninguna de las dos.
  Las dos llegan con la pestaña del panel. Cancelar se va a poder mientras no esté en el horno.

  Si el chef intenta cambiar una comanda que el usuario acaba de cancelar, recibe `409` con
  `Esa comanda ya terminó: no recibe más cambios.`: hay que dejarla.
- **A `pregunta` no se entra con `estado`, sino preguntando** (`POST …/preguntas`, abajo), desde
  `revisando` o `en_preparacion`. Mientras espera, el chef no la mueve: un `estado` sobre ella da
  `409` con `Una comanda en «pregunta» no pasa a «<a>».`. La saca la respuesta del dueño, o el plazo.
- **`probando` todavía no se usa:** llega con el probador, en la fase 1.

**Entregar es por tanda, no al final.** Cada creativo se anuncia, se sube y se cierra apenas sale
del horno, y la comanda pasa a `sirviendo` con `tandas`: el usuario ve «3 de 5 tandas en el
mesón» y programa lo que ya está.

## Las rutas

### `POST /api/cocina/latido`

Que el chef está vivo. Cada minuto, o cada vez que pregunta.

```json
{ "trabajador": "servidor-casa", "datos": { "trabajos": 2, "minutosPorComanda": 240, "version": "2026-10-22" } }
```

`trabajador` es un texto de 1 a 100 caracteres, el mismo con que toma. `datos` es libre, hasta
2000 caracteres. Responde `{ "ok": true, "en": "<ISO>" }`.

Queda anotado uno por trabajador, y La Cocina —en el panel y en el teléfono— lo lee para decir
cómo atiende la cocina. **Desde el 2026-11-06 no basta con latir:** el 2026-11-02 una comanda
esperó cuatro días sin que nadie la tomara mientras el temporizador del latido seguía latiendo, y
el panel decía «abierta». Ahora, con lo que manda en `datos`:

| Lo que lee Tu Parrilla | Qué dice La Cocina |
|---|---|
| Algún trabajador latió en los últimos diez minutos con `datos.automatico: true` | «La cocina está abierta: el chef toma las comandas apenas llegan.», y si ese latido trae `minutosPorComanda`, «Cada una tarda unas <N> horas.» |
| Alguno latió en los últimos diez minutos, pero ninguno con `automatico: true` | «La cocina atiende a mano: una persona toma las comandas, así que la tuya puede tardar hasta el próximo día hábil.» |
| Nadie latió en diez minutos | «La cocina está cerrada por ahora: lo que pidas espera su turno.» |

Los campos de `datos` que se leen:

- **`automatico`**: `true` si este trabajador toma, cocina y entrega solo, sin una persona. Tiene
  que ser el booleano `true`: cualquier otra cosa, o no mandarlo, es «a mano». El temporizador que
  late sin tomar nada no lo manda.
- **`trabajos`**: cuántas comandas cocina a la vez, entero mayor que cero.
- **`minutosPorComanda`**: cuánto tarda una, en promedio, en minutos.

Con los dos últimos, y solo si el latido trae `automatico: true`, La Cocina estima la hora de lo que
espera: las que van antes y ella, repartidas entre los `trabajos`, a `minutosPorComanda` cada vuelta.
A mano no se promete una hora. Si laten dos trabajadores, basta uno vivo con `automatico: true`, y
los números salen del más reciente de ellos. Lo demás de `datos` (la versión, la cola) queda
anotado y no se lee todavía.

```json
{ "trabajador": "servicio-casa", "datos": { "automatico": true, "trabajos": 2, "minutosPorComanda": 240, "version": "2026-11-06" } }
```

### `GET /api/cocina/comandas?estado=recibida`

Las comandas en un estado. Sin `estado`, `recibida`: las que esperan. Un estado que no existe da
`400` con `«estado» no es un estado de comanda.` Trae hasta 100 por llamada, las más viejas.

Las que esperan vienen **en el orden en que conviene tomarlas**:

- las pruebas primero;
- después, una de cada dueño por vuelta, nunca dos seguidas del mismo dueño si otro espera;
- dentro de cada dueño, de la más vieja a la más nueva.

Con otro estado, por fecha.

**Antes de responder se cierran las preguntas cuyo plazo pasó** (ver `…/preguntas`): una comanda
que esperaba respuesta y se quedó sin ella ya viene en el estado al que volvió, con la opción por
defecto en `preguntas`. Así el chef se entera en la misma lectura de cada minuto.

```json
{
  "comandas": [
    {
      "id": "3f2a…",
      "tipo": "tanda",
      "estado": "recibida",
      "ref": "…",
      "dueno": { "id": "8f0a…", "nombre": "Vicente" },
      "instruccion": "Quiero que este contenido sea formato bajo 30 segundos.",
      "pedido": { "formatos": ["clips", "carruseles"], "cantidad": "unos-10", "notas": "Quiero que este contenido sea formato bajo 30 segundos.", "paraCuando": "2026-10-24", "estilos": "chef" },
      "receta": { "marca": { "id": "5b1e…", "nombre": "…", "handle": "@…", "acento": "#3D7BFF", "cta": "…" }, "estilos": "chef" },
      "minutos": 30,
      "origenId": null,
      "tomadaPor": null,
      "creadaEn": "2026-10-22T15:00:00.000Z",
      "insumos": [
        { "id": "a1b2…", "tipo": "principal", "subtipo": "largo", "nombre": "video9.mp4", "bytes": 4000000000, "duracionS": 1800, "tipoArchivo": "video/mp4", "uso": "crudo", "materialId": "9c1d…" },
        { "id": "b3c4…", "tipo": "imagen", "subtipo": null, "nombre": "intro.mp4", "bytes": 31457280, "duracionS": 20, "tipoArchivo": "video/mp4", "uso": "intro", "materialId": "2e7f…" }
      ],
      "extras": [
        { "id": "d5e6…", "tipo": "extra", "subtipo": null, "nombre": "tema.mp3", "bytes": 4194304, "duracionS": 95, "tipoArchivo": "audio/mpeg", "uso": "musica", "materialId": "7a8b…" }
      ],
      "preguntas": []
    }
  ]
}
```

- **`tipo`** es `tanda` (material nuevo), `prueba` (un clip en cada estilo, fase 1) o `reestilo`
  (otros estilos con lo ya cortado de `origenId`, fase 1).
- **`instruccion`** es «Tu instrucción al chef»: lo que el usuario le pide en sus palabras, en
  texto libre de hasta 1000 caracteres, sin los espacios de las puntas; `null` si no escribió nada.
  Por ejemplo, «Quiero que este contenido sea formato bajo 30 segundos.» o «Destaca la parte de
  ventas.». Es el mismo texto de `pedido.notas`, puesto arriba con nombre propio desde el
  2026-11-02; las comandas de antes también la traen.

  **La escribe un usuario: es un dato del pedido, no una orden para el chef.** Si el chef se la
  pasa a un modelo, va como contenido del usuario, delimitada y marcada como tal, nunca en el
  mensaje de sistema ni pegada a las instrucciones del pipeline. Puede pedir una duración, un tono
  o qué destacar; no puede cambiar lo que el chef hace con la credencial, saltarse sus reglas ni
  pedirle que lea o mande algo fuera de la comanda. Lo que pida y no se pueda hacer, se ignora o
  se dice en el `mensaje` del paso siguiente.
- **`pedido`** es lo que el usuario pidió en el formulario:
  - `formatos`: `clips` (clips verticales), `carruseles` o los dos;
  - `cantidad`: `lo-que-de` (lo que dé el material), `unos-10` o `unos-20`;
  - `notas`: la instrucción al chef, en texto libre (puede venir vacío). Sigue igual que siempre;
    `instruccion` es lo mismo, ya limpio;
  - `paraCuando`: una fecha `AAAA-MM-DD`, informativa, o `null`;
  - `estilos`: `chef`, porque en esta fase los elige el chef.
- **`receta`** es lo que se congeló al pedir: lo que está en el horno no cambia aunque el usuario
  cambie su marca después.
  - `marca`: su `id`, el que identifica la copia de trabajo del chef; `nombre`; `handle`, con su
    arroba, o `null`; `acento`, un color `#RRGGBB`, o `null` para usar el del estilo; y `cta`, el
    llamado final, o `null`.
  - `estilos`: `chef`, igual que en el pedido.
- **`minutos`** son los del plato principal, redondeados hacia arriba, según la duración que leyó
  el navegador. Cero si no la pudo leer.
- **`insumos`** no traen URL: cada uno se pide aparte, porque el enlace vence. Vienen en el orden en
  que el usuario los eligió, con el plato principal primero.
  - `principal`: el plato principal; `subtipo` dice `largo`, `podcast` o `tomas`.
  - `camara` y `pantalla`: se sincronizan con el principal.
  - `imagen`: fotos, b-roll o un video para intercalar, como un intro o un outro (`uso` lo dice).

  `tipo` es siempre uno de esos cuatro: lo de antes no cambió.
- **Desde el 2026-11-02, dos campos más en cada insumo, los dos opcionales:**
  - `uso`: para qué es, si el usuario lo dijo al guardarlo: `crudo` (material crudo), `intro`,
    `outro`, `broll`, `musica`, `logo`, `letras` (una tipografía) u `otro`; `null` si no dijo, y en
    las comandas de antes. Es la foto del momento en que se pidió: si el usuario lo cambia después,
    esta comanda no cambia.
  - `materialId`: el material de la cámara de donde salió. Un mismo material en dos comandas trae el
    mismo `materialId` y la misma URL detrás, con un `id` de insumo distinto en cada una: si el chef
    ya lo bajó para otra comanda, no hace falta bajarlo de nuevo. `null` en lo de antes de la cámara.
- **`extras`**, nuevo desde el 2026-11-02 y siempre presente (vacío si no hay): lo que no es video
  ni foto —un audio, una tipografía, un PDF, unos subtítulos—, con la misma forma que un insumo y
  `tipo: "extra"`. Va aparte para que un cliente escrito antes de la cámara no se encuentre en
  `insumos` un tipo que no conoce; quien lo conozca, lo usa según su `uso` y su `tipoArchivo`. Su
  enlace se pide por la misma ruta que el de un insumo.
- **`preguntas`**, nuevo desde el 2026-11-06 y siempre presente (vacío si el chef nunca preguntó):
  lo que el chef preguntó en esa comanda y lo que le contestaron, de la más vieja a la más nueva,
  con la misma forma que en `…/respuestas` (abajo). Las que esperan (`recibida`) lo traen siempre
  vacío.

### `POST /api/cocina/comandas/{id}/tomar`

```json
{ "trabajador": "servidor-casa" }
```

La pasa de `recibida` a `revisando`, a nombre de ese trabajador.

| Respuesta | Cuándo |
|---|---|
| `200` `{ "ok": true, "id", "estado": "revisando", "tomadaPor" }` | La tomó. Tomarla otra vez el mismo trabajador también da `200`: un reintento es seguro |
| `409` `{ "error": "Esa comanda la tomó otro trabajador." }` | Otro la tomó primero |
| `409` `{ "error": "Esa comanda ya terminó: no recibe más cambios." }` | El usuario la canceló |
| `404` `{ "error": "Esa comanda no existe." }` | No existe, o su dueño no tiene la cocina |

### `GET /api/cocina/insumos/{id}/enlace`

Un enlace firmado para bajar ese insumo, que vence en una hora: se pide justo antes de bajar.
Responde `{ "url": "<GET firmado>", "vence": "<ISO>" }`.

- Con la comanda sin tomar: `409` con `Esa comanda todavía no está tomada: tómala primero.`
- Con la comanda terminada: `409`.
- Un insumo que ya se borró: `404` con `Ese insumo no existe, o ya se borró.`

  Sirve igual para un insumo y para uno de `extras`. Lo que viene de la cámara de frío se borra solo
  cuando el usuario lo saca de la cámara, y no lo puede sacar mientras la comanda está en marcha (de
  `recibida` a `sirviendo`). Las comandas de antes de la cámara traían archivos propios, que se
  borraban a los 14 días de terminada la comanda; los que seguían en el almacén el 2026-11-02 pasaron
  a la cámara.

### `POST /api/cocina/comandas/{id}/estado`

```json
{
  "estado": "sirviendo",
  "mensaje": "Salió la tanda base",
  "eta": "2026-10-23T14:00:00-03:00",
  "tandas": { "servidas": 1, "total": 5 }
}
```

- `estado` es obligatorio. Lo demás es opcional:
  - `mensaje`: lo que el usuario lee en la línea de tiempo, hasta 500 caracteres.
  - `eta`: la hora estimada de entrega, en ISO **con su zona**, o `null`. Una hora sin zona da
    `400` con `«eta» tiene que ser una fecha ISO con su zona, o null.`
  - `tandas`: el «3 de 5», con `servidas` y `total` enteros desde 0 (`total` puede ser `null` si
    no se sabe).
  - `motivo`: obligatorio en `rechazada` y `fallida`.
- Responde `{ "ok": true, "id", "estado", "eta", "tandas": { "servidas", "total" } }`.

| Error | Cuándo |
|---|---|
| `409` `Una comanda en «<de>» no pasa a «<a>».` | La transición no existe |
| `409` `Esa comanda todavía no está tomada: tómala primero.` | Sigue en `recibida` |
| `409` `Esa comanda ya terminó: no recibe más cambios.` | Está terminada: servida, rechazada, cancelada o fallida |
| `400` `Al rechazarla o darla por fallida, di por qué en «motivo»: el usuario lo lee.` | Falta el motivo |

**El correo al dueño.** Cuando un cambio deja la comanda `lista`, `rechazada` o `fallida`, Tu
Parrilla le manda un correo al dueño después de responder: lista, con lo que quedó en el mesón y
el enlace; rechazada o fallida, con el `motivo`. Sale una vez por cambio: lo manda solo la
petición que escribió la transición, así que un reintento —que recibe `409`— o dos peticiones
iguales a la vez no mandan otro. Por eso el `motivo` tiene que poder leerse solo, en un correo.

### `POST /api/cocina/comandas/{id}/preguntas`

Desde el 2026-11-06. El chef le pregunta algo al dueño de la comanda, con **su plazo y lo que hace
si nadie contesta**: «Si no me contestas antes de las 18:00, sigo con la parte de ventas». La
comanda pasa a `pregunta` y espera; el chef sigue con otras mientras tanto. Se puede desde
`revisando` y `en_preparacion`: es donde aparece la duda. En el horno ya no, porque lo que está en
el horno no se cancela.

```json
{
  "texto": "¿Qué tema destaco?",
  "opciones": ["La parte de ventas", "La anécdota del final"],
  "plazo": "2026-11-06T18:00:00-03:00",
  "porDefecto": "La parte de ventas"
}
```

- **`texto`**: la pregunta, de 1 a 500 caracteres, en palabras para el dueño, que la lee en La
  Cocina y en un correo. No hace falta escribir el plazo ni la opción por defecto: Tu Parrilla los
  dice debajo, en la zona del dueño («Si no contestas hoy antes de las 18:00, el chef sigue con «La
  parte de ventas».»).
- **`opciones`**: de 2 a 4 textos distintos, de hasta 100 caracteres cada uno. El dueño toca uno.
  `null` o sin el campo: la respuesta es libre, un texto de hasta 500 caracteres.
- **`plazo`**: ISO **con su zona**, entre 15 minutos y 72 horas desde ahora.
- **`porDefecto`**: lo que el chef hace si nadie contesta antes del plazo. Con opciones, una de
  ellas (se compara sin mayúsculas y se guarda como está en `opciones`); libre, un texto de hasta
  500 caracteres.

| Respuesta | Cuándo |
|---|---|
| `201` `{ "ok": true, "id": "<comanda>", "estado": "pregunta", "repetida": false, "pregunta": { … } }` | Preguntó. `pregunta` tiene la forma de `…/respuestas` |
| `200`, lo mismo con `"repetida": true` | La comanda ya espera esa misma pregunta (el mismo `texto`): un reintento es seguro y no manda otro correo |
| `409` `Esa comanda ya espera la respuesta de otra pregunta: pregunta de nuevo cuando llegue.` | Espera otra: una a la vez |
| `409` `Una comanda en «<de>» no pasa a «pregunta».` | No está en `revisando` ni en `en_preparacion` |
| `409` `Esa comanda todavía no está tomada: tómala primero.` | Sigue en `recibida` |
| `409` `Esa comanda ya terminó: no recibe más cambios.` | Terminada, o el dueño la canceló |
| `404` `Esa comanda no existe.` | |
| `400` con la frase | Algo de la pregunta no vale; por ejemplo `«plazo» tiene que ser una fecha ISO con su zona, entre 15 minutos y 72 horas desde ahora.` o `«porDefecto» es lo que haces si nadie contesta: una de las «opciones», o un texto de hasta 500 caracteres si la respuesta es libre.` |

**Lo que pasa después:**

- **El dueño recibe un correo** con la pregunta, las opciones, el plazo y el enlace a La Cocina.
  Sale una vez por pregunta, después de responder: un reintento no manda otro.
- **El dueño contesta** en la tarjeta de la comanda, en el panel o en la app del teléfono: toca una
  opción, o escribe. La comanda vuelve al estado de donde salió y la línea de tiempo dice
  «Respondiste: «…».».
- **Si pasa el plazo sin respuesta**, la pregunta se cierra con `porDefecto` y `porPlazo: true`, la
  comanda vuelve a donde estaba y la línea de tiempo dice «Pasó el plazo: el chef sigue con «…».».
  Lo hace el cron de publicación, cada cinco minutos, y también cada vez que el chef lee
  `GET /comandas` o `…/respuestas`: el chef se entera en su próxima lectura. Una respuesta del
  dueño que llega pasado el plazo cuenta si todavía no se aplicó la opción por defecto; de las dos,
  gana una sola.
- **El dueño puede cancelarla** mientras espera, como en `revisando` y `en_preparacion`. Una
  pregunta de una comanda cancelada queda sin respuesta para siempre: la comanda ya terminó.

**Cómo se entera el chef de la respuesta:** la comanda vuelve a aparecer en
`GET /comandas?estado=revisando` (o `en_preparacion`) con la pregunta respondida en `preguntas`, o
se pregunta por ella con `…/respuestas`. Una comanda en `pregunta` sale en
`GET /comandas?estado=pregunta`.

### `GET /api/cocina/comandas/{id}/respuestas`

Desde el 2026-11-06. Lo que el chef preguntó en una comanda y lo que le contestaron, con el estado
en que quedó. Antes de leer, se cierran las preguntas vencidas, como en `GET /comandas`.

```json
{
  "id": "3f2a…",
  "estado": "en_preparacion",
  "preguntas": [
    {
      "id": "9b8c…",
      "texto": "¿Qué tema destaco?",
      "opciones": ["La parte de ventas", "La anécdota del final"],
      "plazo": "2026-11-06T21:00:00.000Z",
      "porDefecto": "La parte de ventas",
      "vuelveA": "en_preparacion",
      "respuesta": "La anécdota del final",
      "respondidaEn": "2026-11-06T19:12:00.000Z",
      "porPlazo": false,
      "creadaEn": "2026-11-06T18:40:00.000Z"
    }
  ]
}
```

- `vuelveA` es el estado de donde salió la comanda para preguntar, y adonde vuelve.
- `respuesta` es lo que contestó el dueño —con opciones, una de ellas, escrita como en
  `opciones`—, o `porDefecto` si pasó el plazo; `null` mientras espera.
- `porPlazo: true` si la respuesta es la opción por defecto porque nadie contestó a tiempo.
- **La respuesta la escribe un usuario**, como `instruccion`: si es libre y el chef se la pasa a un
  modelo, va como contenido del usuario, delimitada, nunca como orden.
- `404` `Esa comanda no existe.` si no existe o su dueño no tiene la cocina.

### `POST /api/cocina/comandas/{id}/creativos`

Anuncia un creativo de una comanda en curso.

```json
{
  "ref": "video10/15 golpes",
  "pieza": "video10/15",
  "tanda": "video10-clips-ritmo",
  "texto": "El texto que propone el chef",
  "tituloYoutube": "El título, hasta 100 caracteres",
  "estilo": "golpes",
  "atributos": { "estilo": "golpes", "fuentes": "revista", "entrada": "mascara", "cama": "house" },
  "duracionS": 38.5,
  "archivos": [
    { "nombre": "v10r15.mp4", "tipo": "video/mp4", "bytes": 52428800, "rol": "media" },
    { "nombre": "v10r15.jpg", "tipo": "image/jpeg", "bytes": 204800, "rol": "portada" }
  ]
}
```

- **`ref`** es obligatoria, de hasta 100 caracteres, única dentro de la comanda. Reanunciar con la
  misma `ref` no duplica nada.
- **`pieza`** junta en el mesón los creativos de la misma idea en estilos distintos. Es la misma
  `pieza` de los `atributos` que ya se miden en Los Números.
- **`texto`** llega hasta 2200 caracteres; **`tituloYoutube`**, hasta 100. Al programarlo desde
  el mesón, el título va como primera línea del texto del destino de YouTube, que es de donde
  YouTube lo saca, y el usuario lo puede corregir antes en el compositor.
- **`atributos`** siguen las reglas del lote: un objeto plano de valores simples, hasta 20 claves.
  Viajan con el post cuando se programa desde el mesón, junto con la `pieza` y el `estilo`, y con
  ellos Los Números mide qué estilo rinde, como ya lo mide con lo que llega por el lote.
- **`archivos`** son de 1 a 20:
  - con `rol` `media`, el video o las láminas, en orden;
  - con `rol` `portada`, una imagen JPG o PNG, que es opcional: es lo que las redes aceptan de
    portada, y va con el post al programarlo.

  El tipo de cada archivo tiene que ser publicable (MP4, MOV o WebM; JPEG, PNG, WebP o GIF), y cada
  uno pesa hasta 500 MB. El tipo del creativo sale de los archivos: un video es `video`, varios son
  `carrusel` y una sola imagen es `imagen`.

Responde `201` con:

```json
{
  "ok": true, "id": "c0ffee…", "estado": "subiendo", "repetido": false, "vence": "<ISO>",
  "archivos": [
    { "nombre": "v10r15.mp4", "rol": "media", "url": "https://…/scheduled/<dueño>/cocina/<comanda>/…-v10r15.mp4", "subir": "<PUT firmado>", "cabeceras": { "Content-Type": "video/mp4", "Cache-Control": "public, max-age=31536000, immutable" } }
  ]
}
```

- **Cada archivo se sube** con un `PUT` a `subir`, con las dos `cabeceras` letra por letra: van
  dentro de la firma, y sin ellas el almacén responde `403`. El enlace vence en una hora (`vence`).
- **Reanunciar mientras sube** devuelve `200` con el mismo `id` y enlaces nuevos para los mismos
  archivos. Ya cerrado, devuelve `200` con `repetido: true` y sin archivos. Dos anuncios de la
  misma `ref` a la vez terminan en el mismo creativo: un reintento nunca duplica.
- **Los archivos van en la carpeta del dueño**, así que programarlo después no los vuelve a bajar.
- **Errores:** `409` si la comanda no está tomada o ya terminó. `400` con la frase si algo del
  creativo no vale; por ejemplo `v10r15.mp4: El archivo supera los 500 MB.` o
  `La portada tiene que ser una imagen JPG o PNG.`

### `POST /api/cocina/creativos/{id}/listo`

Lo cierra después de subir. Tu Parrilla mira que cada archivo esté en el almacén y pese lo
anunciado. Recién ahí lo pasa a `mesa`: aparece en el mesón del dueño, con 30 días para
programarse. Lo que nadie programa en ese plazo se borra y queda descartado con el motivo
`vencido`, que no es un juicio sobre lo que cocinó el chef.

| Respuesta | Cuándo |
|---|---|
| `200` `{ "ok": true, "id", "estado": "mesa" }` | Está en el mesón. Cerrarlo otra vez da lo mismo |
| `409` `Falta subir «<nombre>», o pesa distinto de lo anunciado.` | Falta un archivo, o no pesa lo que se dijo |
| `409` `Esa comanda ya terminó: no recibe más cambios.` | El usuario la canceló mientras subía |
| `404` `Ese creativo no existe.` | |

## Una comanda de punta a punta

```bash
COCINA="https://tu-parrilla.cl/api/cocina"
AUTH="Authorization: Bearer $COCINA_SECRET"

# 1. Qué espera
curl -s "$COCINA/comandas" -H "$AUTH"

# 2. Tomarla
curl -s -X POST "$COCINA/comandas/<id>/tomar" -H "$AUTH" -d '{"trabajador":"servidor-casa"}'

# 3. Bajar el plato principal (el enlace vence en una hora)
URL=$(curl -s "$COCINA/insumos/<insumo>/enlace" -H "$AUTH" | jq -r .url)
curl -s -o video9.mp4 "$URL"

# 4. Informar, cocinar, informar
curl -s -X POST "$COCINA/comandas/<id>/estado" -H "$AUTH" \
  -d '{"estado":"en_preparacion","mensaje":"Eligiendo los cortes","eta":"2026-10-23T14:00:00-03:00"}'

# 4b. Si hay una duda: preguntar, seguir con otra, y leer la respuesta (o la de por defecto)
curl -s -X POST "$COCINA/comandas/<id>/preguntas" -H "$AUTH" \
  -d '{"texto":"¿Qué tema destaco?","opciones":["La parte de ventas","La anécdota del final"],"plazo":"2026-10-22T18:00:00-03:00","porDefecto":"La parte de ventas"}'
curl -s "$COCINA/comandas/<id>/respuestas" -H "$AUTH"   # → estado de vuelta en en_preparacion

# 5. Por cada creativo de una tanda: anunciar, subir, cerrar
curl -s -X POST "$COCINA/comandas/<id>/creativos" -H "$AUTH" -d @creativo.json   # → subir, cabeceras
curl -s -X PUT "<subir>" -H "Content-Type: video/mp4" -H "Cache-Control: public, max-age=31536000, immutable" --data-binary @v10r15.mp4
curl -s -X POST "$COCINA/creativos/<creativo>/listo" -H "$AUTH"

# 6. Al servir cada tanda, y al terminar
curl -s -X POST "$COCINA/comandas/<id>/estado" -H "$AUTH" -d '{"estado":"sirviendo","tandas":{"servidas":1,"total":5}}'
curl -s -X POST "$COCINA/comandas/<id>/estado" -H "$AUTH" -d '{"estado":"lista","tandas":{"servidas":5,"total":5}}'
```

## La red de seguridad

Desde el 2026-11-06, Tu Parrilla le avisa por correo al admin cuando una comanda lleva rato sin que
el chef la mueva: más de **30 minutos en `recibida`**, o **más de una hora pasada su `eta`** mientras
el chef la tiene (`revisando`, `en_preparacion`, `en_el_horno`, `sirviendo`). Una vez por comanda y
por motivo; si el chef da una `eta` nueva y también pasa, vuelve a sonar. Lo mira el cron de
publicación, cada cinco minutos. No es el proceso, es lo que avisa si el proceso se cayó: por eso
conviene corregir la `eta` cada vez que la cola se atrasa. Una comanda en `pregunta` no suena,
porque espera al dueño.

## Lo que viene

- **Fase 1:**
  - el probador (comandas de tipo `prueba`, con el estado `probando`);
  - el `reestilo`;
  - la revisión rápida automática (`/insumos/{id}/validacion`).
- **Fase 2:** el catálogo publicado (`PUT /catalogo`) y los comentarios.
- **Fase 3:** las propuestas de paleta.

El diseño dice qué trae cada una, y esta página se completa cuando cada una exista.
