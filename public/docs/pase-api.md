# El Pase — guía para una IA que edita

El Pase es donde una persona critica los shorts o las imágenes que hiciste, pegando cada crítica
al momento y al lugar del cuadro, y donde tú devuelves la versión siguiente. Esta guía es para el
editor: tú.

Te dieron un **enlace de editar**, `https://tu-parrilla.cl/pase/edi_…`. El código es la llave:
`https://tu-parrilla.cl/api/pase/edi_…` es tu API, sin otra autenticación. No lo publiques.
(El enlace de revisar, `rev_…`, es para quien critica: con él no puedes subir ni contestar.)

## El ciclo

1. **Lee la crítica**: `GET /api/pase/<código>?formato=texto` (una lista de tareas para tu prompt)
   o `GET /api/pase/<código>` (el JSON, para trabajar con los datos).
2. **Arregla** cada pieza, en orden de tiempo.
3. **Sube la versión siguiente**: `POST …/subidas` para el enlace, `PUT` del archivo, y
   `POST …/piezas` con `responde_a` (la pieza que corriges) y `resuelve` (las críticas que
   arreglaste).
4. **Contesta** lo que no hiciste o necesita explicación: `PATCH …/comentarios/<id>`.

La persona ve la versión nueva al lado de la anterior, comprueba y vuelve a criticar. Si propones
dos alternativas, súbelas como variantes (`"variante": "A"` y `"B"`) de la misma versión.

## Leer el pase

```bash
curl https://tu-parrilla.cl/api/pase/edi_XXXXXXXXXXXXXXXXXXXX
```

```json
{
  "rol": "editor",
  "titulo": "Shorts de la semana del 17",
  "instrucciones": "Que se entienda sin sonido, y que el gancho llegue antes del segundo 3.",
  "piezas": [
    {
      "id": "a6be…", "grupo": "4f1c…", "version": 1, "variante": null,
      "titulo": "La visa secreta de los chilenos", "tipo": "video",
      "url": "https://…/pase/…/v1.mp4", "notas": "", "respondeA": null,
      "estado": "cambios", "estadoPor": "Vicente", "creadaEn": "2026-11-13T10:00:00-03:00",
      "comentarios": [
        {
          "id": "39d9…", "autor": "Vicente", "etiqueta": "subtitulos",
          "texto": "El subtítulo tapa la cara: súbelo al tercio de arriba.",
          "desde": 6.0, "hasta": 8.5, "cuando": "0:06.0–0:08.5",
          "zona": { "x": 0.08, "y": 0.74, "ancho": 0.84, "alto": 0.1 },
          "estado": "abierto", "respuesta": null, "resueltoEn": null,
          "creadoEn": "2026-11-13T10:05:00-03:00"
        }
      ]
    }
  ]
}
```

- **Las piezas** van en el orden en que llegaron. Las versiones de un mismo creativo comparten
  `grupo`; `version` cuenta desde 1 y `variante` separa alternativas de una misma versión.
  `respondeA` es la pieza que esa versión corrige, y `notas`, lo que dijo el editor.
- **`estado`** es el veredicto de quien revisa: `en_revision`, `aprobada`, `cambios` (pide
  cambios) o `descartada`. No trabajes las aprobadas ni las descartadas.
- **Cada crítica** tiene:
  - `desde` y `hasta` en segundos: un momento (`hasta` null), un tramo, o nada si es de la pieza
    entera; `cuando` es lo mismo en texto;
  - `zona`, el rectángulo del cuadro en fracciones del ancho y el alto (0 a 1, desde arriba a la
    izquierda), o null;
  - `etiqueta`: `ritmo`, `transicion`, `subtitulos`, `audio`, `encuadre`, `color` u `otro`;
  - `estado`: `abierto` o `resuelto`; `respuesta`, lo que contestó el editor; `resueltoEn`, la
    pieza que la arregló.

Con `?formato=texto`, lo mismo como Markdown, por pieza, lo abierto primero y en orden de tiempo,
con la zona en palabras («zona abajo, centro (x 8 %, y 74 %…)») y el id de cada crítica:

```
## «La visa secreta de los chilenos» v1 — Pide cambios
Pieza a6be… · video · https://…/v1.mp4
- [ ] [0:02.3] (Ritmo y cortes) El gancho llega tarde: corta el silencio del principio. — Vicente · id e775…
- [ ] [0:06.0–0:08.5] zona abajo, centro (x 8 %, y 74 %, 84 % de ancho y 10 % de alto) (Subtítulos y texto) El subtítulo tapa la cara… — Vicente · id 39d9…
```

## Subir la versión siguiente

**1. Pide un enlace para subir** (o salta al paso 3 con una URL pública, que se copia):

```bash
curl -X POST https://tu-parrilla.cl/api/pase/edi_XXXX/subidas \
  -H "Content-Type: application/json" \
  -d '{ "tipo": "video/mp4", "bytes": 48213004 }'
```

Responde `{ "subir": "<URL firmada>", "url": "<la del archivo>", "contentType": "video/mp4" }`.
Tipos: `video/mp4`, `video/quicktime`, `video/webm` (hasta 500 MB), `image/jpeg`, `image/png`,
`image/webp`, `image/gif` (hasta 50 MB). El enlace vale una hora.

**2. Sube el archivo**, con ese `Content-Type` y esa caché:

```bash
curl -X PUT "<subir>" -H "Content-Type: video/mp4" \
  -H "Cache-Control: public, max-age=31536000, immutable" --data-binary @v2.mp4
```

**3. Crea la pieza:**

```bash
curl -X POST https://tu-parrilla.cl/api/pase/edi_XXXX/piezas \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<url del paso 1, o una URL pública>",
    "responde_a": "a6be…",
    "variante": "A",
    "notas": "Corté el silencio del principio y subí los subtítulos al tercio de arriba.",
    "resuelve": ["e775…", "39d9…"]
  }'
```

- Sin `responde_a`, es una pieza nueva (versión 1), y `titulo` es obligatorio. Con él, es la
  versión siguiente de esa pieza, con su mismo título si no mandas otro.
- `variante` es una letra mayúscula, solo si propones más de una alternativa de esa versión. Si
  la versión siguiente ya existe, tiene que llevar una letra que no esté usada.
- `resuelve` marca hechas esas críticas, de cualquier versión anterior del mismo creativo, y
  dice que las resolvió esta pieza. Las que no nombres siguen abiertas.

Responde `201` con `{ "ok": true, "id", "grupo", "version", "variante", "url", "resueltas" }`.

## Contestar una crítica

```bash
curl -X PATCH https://tu-parrilla.cl/api/pase/edi_XXXX/comentarios/39d9… \
  -H "Content-Type: application/json" \
  -d '{ "respuesta": "Lo subí al tercio de arriba en la v2 A.", "estado": "resuelto" }'
```

Con el enlace de editar se cambia solo `respuesta` (texto, o null para borrarla) y `estado`
(`resuelto` es «Hecho»; `abierto` la vuelve a abrir). Contesta cuando no hiciste lo pedido, y
por qué: quien revisa lo lee al lado de su crítica.

## Las frases de error

| Código | Frase | Qué hacer |
|---|---|---|
| `404` | `Este enlace ya no sirve: pídele uno nuevo a quien te lo mandó.` | Cambiaron los enlaces o archivaron el pase. Pide el nuevo. |
| `403` | `Esto lo hace quien edita: tu enlace es para revisar.` | Estás usando el enlace de revisar. |
| `404` | `Esa pieza no está en este pase.` / `Ese comentario no está en este pase.` | El id no es de este pase. Vuelve a leerlo. |
| `400` | `Ese archivo no se puede revisar acá: sube MP4, MOV o WebM, o JPG, PNG, WebP o GIF.` | Otro formato. |
| `400` | `El archivo es muy grande: hasta 500 MB un video y 50 MB una imagen.` | Exporta más liviano. |
| `400` | `El archivo no se pudo traer: revisa que la subida haya terminado o que la URL sea pública.` | El `PUT` no terminó o la URL no se puede bajar. |
| `400` | `Esa versión ya existe: ponle una variante (A, B…) para compararlas.` / `Esa versión ya tiene esa variante: usa otra letra.` | Usa otra letra. |
| `400` | `La variante es una letra mayúscula: A, B, C…` | |
| `400` | `Ponle un título (hasta 120 letras).` | Una pieza nueva necesita `titulo`. |
| `400` | `Con este enlace se cambia solo «estado», «respuesta».` | Mandaste un campo que tu rol no cambia. |
| `400` | `Un pase lleva hasta 300 piezas: abre otro.` | |

## Quien revisa (para saber qué te van a mandar)

Con el enlace de revisar, `POST /api/pase/<código>/comentarios` deja una crítica
(`{ pieza, autor, texto, etiqueta?, desde?, hasta?, zona? }`, los tiempos en segundos),
`PATCH …/comentarios/<id>` corrige su `texto` o `etiqueta` o la reabre, `DELETE` la borra, y
`PUT …/piezas/<id>/estado` (`{ estado, autor }`) da el veredicto. Normalmente lo hace una persona
desde la pantalla.
