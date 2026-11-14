# El Pase — revisar shorts e imágenes y devolverle al editor la crítica ordenada

Pedido del dueño el 2026-11-13: poder ver muchos shorts o imágenes hechos por un editor —una
persona, el chef de La Cocina u otra IA— y que otra persona los critique de forma estructurada,
pegada al momento y al lugar del cuadro, para que el editor arregle y devuelva una versión 2, o
varias para comparar. Reemplaza la entrada «Por explorar: un visor de videos para criticarlos» de
`docs/pendientes.md`.

## El nombre

En la cocina de un restaurante, **el pase** es el mesón donde el jefe mira cada plato antes de
que salga a la mesa y devuelve a la línea lo que no está bien. Es exactamente esto: el revisor
está en el pase, el editor en la línea. Se llama igual de día.

## Quién entra, y cómo (el parche de permisos)

El dueño todavía no decide de quién es un pase ni quién puede crearlo. Mientras tanto:

- **Crea pases solo el admin**, en el panel (`/admin/pase`, una pestaña que solo ve el admin).
  Cada pase es del admin que lo creó (`owner_id`), como todo en Tu Parrilla, así que cuando se
  abra a los demás usuarios el modelo ya aguanta.
- **Cada pase tiene dos enlaces con código**, uno para revisar (`rev_…`) y otro para editar
  (`edi_…`), en `https://tu-parrilla.cl/pase/<código>`. Quien tiene el enlace entra sin cuenta.
  El de revisar deja ver, comentar y dar el veredicto; el de editar deja ver la crítica,
  contestarla, marcarla hecha y subir piezas y versiones. El admin los copia, los cambia
  («Cambiar los enlaces» deja sin entrada a quien tenía los de antes) o archiva el pase.
- **La API usa el mismo código**: `https://tu-parrilla.cl/api/pase/<código>`. Para una IA es
  una sola dirección que lo dice todo.
- Quien comenta escribe su nombre una vez (queda en su navegador); no hay cuentas. Es un
  parche: el nombre no está verificado.

Cuando se decida el modelo de verdad (pases de cada usuario, revisores con cuenta), los códigos
pueden quedar como enlaces para invitados.

## Qué se guarda

- `pases`: título, instrucciones para quien revisa, los dos códigos, archivado.
- `pase_piezas`: cada archivo (video o imagen) con su título. Las versiones de un mismo creativo
  comparten `grupo`; `version` es 1, 2, 3…; `variante` (A, B…) separa las alternativas de una
  misma versión, para comparar. `responde_a` es la pieza que esta versión corrige, y `notas`, lo
  que el editor dice que cambió. `estado` es el veredicto del revisor: en revisión, aprobada,
  pide cambios o descartada.
- `pase_comentarios`: la crítica. Cada uno es de una pieza y puede tener un **momento**
  (`desde_ms`), un **tramo** (`desde_ms` y `hasta_ms`), una **zona** del cuadro (`zona`, con `x`,
  `y`, `ancho` y `alto` entre 0 y 1, independiente de la resolución) o nada de eso (general). Lleva
  una **etiqueta** de una lista corta (ritmo, transición, subtítulos, audio, encuadre, color,
  otro), el texto, el autor, el **estado** (abierto o resuelto) y, si el editor contestó, su
  respuesta y la versión que lo resolvió.

Los archivos van al almacén (R2), en `pase/<pase>/`, y el barrido de huérfanos los cuida.

## Las pantallas

**El revisor** (`/pase/rev_…`). A la izquierda el video, con la hora siempre a la vista
(`0:20.3`), y debajo una línea de tiempo con las marcas de cada comentario. Pausar es comentar:
el comentario nace pegado al segundo en que está el video. Se puede marcar un tramo (desde y
hasta), dibujar una zona sobre el cuadro, o las dos cosas. A la derecha, la etiqueta, el texto y
la lista de comentarios de esa pieza en orden de tiempo; tocar uno lleva el video a ese momento y
muestra su zona. Atajos: espacio, flechas (un segundo; con mayúscula, un cuadro), `I` y `O` para
el tramo, `Z` para la zona, `C` para escribir. Arriba, las piezas del pase; sobre el video, las
versiones de esa pieza y **«Comparar»**, que pone dos lado a lado y las reproduce juntas. El
veredicto de la pieza, con un toque.

**El editor** (`/pase/edi_…`). La misma pantalla, pensada para leer: la crítica de cada pieza
como una lista de tareas en orden de tiempo, con su momento (que lleva el video ahí), su zona
dibujada, la etiqueta y quién la dejó. Cada una se contesta y se marca **«Hecho»**. **«Subir
versión»** sube la siguiente (o varias variantes para comparar) y marca qué críticas resuelve.
**«Para tu IA»** da la crítica en texto y la dirección de la API.

**El admin** (`/admin/pase`). La lista de pases con cuántas piezas y críticas abiertas tiene cada
uno, crear uno nuevo, copiar los dos enlaces, cambiarlos y archivar.

## Para una IA (el chef, u otra)

- `GET /api/pase/<código>`: el pase entero en JSON, con cada pieza, sus versiones y sus
  comentarios. Los tiempos van en segundos y como texto (`"0:20.3"`), la zona en fracciones.
- `GET /api/pase/<código>?formato=texto`: lo mismo como una lista de tareas en Markdown, por pieza
  y en orden de tiempo, lista para pegar en un prompt.
- `POST /api/pase/<código>/subidas`: un enlace firmado para subir un archivo al almacén.
- `POST /api/pase/<código>/piezas`: una pieza nueva o la versión siguiente de una
  (`responde_a`), con `variante`, `notas` y `resuelve` (los comentarios que arregla). Acepta la
  URL de una subida o una URL pública, que copia.
- `PATCH /api/pase/<código>/comentarios/<id>`: contestar o marcar hecho.

La guía para un LLM está en `public/docs/pase-api.md`.

## Lo que no entra todavía

- Cuentas para revisores, permisos por usuario y pases de los demás usuarios.
- Avisos (correo o teléfono) cuando llega una crítica o una versión nueva.
- Que el chef de La Cocina lea su crítica solo: hoy se le pasa el enlace de editar.
- Dibujar a mano alzada, flechas o notas de voz; la zona es un rectángulo.
- El modo día: la pantalla pública va de noche.
