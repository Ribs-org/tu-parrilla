# La API de La Cocina: cómo habla el chef con Tu Parrilla

Para quien escribe el lado del chef: el cliente de esta API en `marca-personal`, que todavía no
existe. En la fase 0 es una herramienta de línea de comandos; después, un servicio que pregunta
solo. El porqué de cada cosa está en el diseño,
`docs/superpowers/specs/2026-10-22-la-cocina-design.md`; esto es el contrato de lo que ya existe.

**Lo que existe hoy son las tablas, estas rutas y la pestaña del panel.** En el panel:

- el admin le enciende la cocina a una cuenta en Los Maestros;
- el usuario sube su material, pide y sigue su comanda en La Cocina;
- lo que el chef entrega espera en el mesón, donde el usuario lo programa o lo descarta.

Lo que falta es el barrido que borra lo vencido.

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
```

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
- **`probando` y `pregunta` todavía no se usan:** llegan con el probador y las preguntas con plazo,
  en la fase 1.

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

Hoy el latido solo queda anotado, uno por trabajador. La pestaña del panel lo va a leer para dos
cosas:

- decir si la cocina está abierta: con diez minutos sin latido, «cerrada por ahora»;
- estimar cuándo sale lo que espera, con `trabajos` y `minutosPorComanda`.

Por eso conviene mandar esos dos datos desde ya.

### `GET /api/cocina/comandas?estado=recibida`

Las comandas en un estado. Sin `estado`, `recibida`: las que esperan. Un estado que no existe da
`400` con `«estado» no es un estado de comanda.` Trae hasta 100 por llamada, las más viejas.

Las que esperan vienen **en el orden en que conviene tomarlas**:

- las pruebas primero;
- después, una de cada dueño por vuelta, nunca dos seguidas del mismo dueño si otro espera;
- dentro de cada dueño, de la más vieja a la más nueva.

Con otro estado, por fecha.

```json
{
  "comandas": [
    {
      "id": "3f2a…",
      "tipo": "tanda",
      "estado": "recibida",
      "ref": "…",
      "dueno": { "id": "8f0a…", "nombre": "Vicente" },
      "pedido": { "formatos": ["clips", "carruseles"], "cantidad": "unos-10", "notas": "la parte de ventas", "paraCuando": "2026-10-24", "estilos": "chef" },
      "receta": { "marca": { "id": "5b1e…", "nombre": "…", "handle": "@…", "acento": "#3D7BFF", "cta": "…" }, "estilos": "chef" },
      "minutos": 30,
      "origenId": null,
      "tomadaPor": null,
      "creadaEn": "2026-10-22T15:00:00.000Z",
      "insumos": [
        { "id": "a1b2…", "tipo": "principal", "subtipo": "largo", "nombre": "video9.mp4", "bytes": 4000000000, "duracionS": 1800, "tipoArchivo": "video/mp4" }
      ]
    }
  ]
}
```

- **`tipo`** es `tanda` (material nuevo), `prueba` (un clip en cada estilo, fase 1) o `reestilo`
  (otros estilos con lo ya cortado de `origenId`, fase 1).
- **`pedido`** es lo que el usuario pidió en el formulario:
  - `formatos`: `clips` (clips verticales), `carruseles` o los dos;
  - `cantidad`: `lo-que-de` (lo que dé el material), `unos-10` o `unos-20`;
  - `notas`: qué destacar o qué evitar, en texto libre (puede venir vacío);
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
- **`insumos`** no traen URL: cada uno se pide aparte, porque el enlace vence.
  - `principal`: el plato principal; `subtipo` dice `largo`, `podcast` o `tomas`.
  - `camara` y `pantalla`: se sincronizan con el principal.
  - `imagen`: fotos o b-roll.

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

  Hoy nada los borra. El barrido que falta los va a borrar a los 14 días de terminada la
  comanda.

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
anunciado. Recién ahí lo pasa a `mesa`: aparece en el mesón del dueño, con vencimiento a 30
días. El barrido que cumple ese vencimiento todavía no existe.

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

# 5. Por cada creativo de una tanda: anunciar, subir, cerrar
curl -s -X POST "$COCINA/comandas/<id>/creativos" -H "$AUTH" -d @creativo.json   # → subir, cabeceras
curl -s -X PUT "<subir>" -H "Content-Type: video/mp4" -H "Cache-Control: public, max-age=31536000, immutable" --data-binary @v10r15.mp4
curl -s -X POST "$COCINA/creativos/<creativo>/listo" -H "$AUTH"

# 6. Al servir cada tanda, y al terminar
curl -s -X POST "$COCINA/comandas/<id>/estado" -H "$AUTH" -d '{"estado":"sirviendo","tandas":{"servidas":1,"total":5}}'
curl -s -X POST "$COCINA/comandas/<id>/estado" -H "$AUTH" -d '{"estado":"lista","tandas":{"servidas":5,"total":5}}'
```

## Lo que viene

- **Fase 1:**
  - las preguntas con plazo y opción por defecto (`/preguntas`, `/respuestas`);
  - el probador (comandas de tipo `prueba`, con el estado `probando`);
  - el `reestilo`;
  - la revisión rápida automática (`/insumos/{id}/validacion`).
- **Fase 2:** el catálogo publicado (`PUT /catalogo`) y los comentarios.
- **Fase 3:** las propuestas de paleta.

El diseño dice qué trae cada una, y esta página se completa cuando cada una exista.
