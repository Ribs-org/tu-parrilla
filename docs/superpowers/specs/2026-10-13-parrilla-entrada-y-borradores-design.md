# La Parrilla como entrada, y borradores — diseño

**Fecha:** 2026-10-13.

**En una frase:** El Fuego se funde en La Parrilla, que pasa a ser la entrada del panel; el
calendario es la vista por defecto; el compositor se abre con un botón en un panel lateral, y
lo que se escribe se guarda solo como borrador, como un correo.

**Lo que pidió el dueño (2026-10-13):** la vista de lista no debería ser la de entrada —el
calendario es lo importante—; que programar sea un plegable es raro (mejor un botón, o algo
con borradores como Gmail), y no queda claro qué aporta El Fuego: tal vez debería ser parte
de La Parrilla.

Reemplaza el §3 («La entrada: El Fuego») de `2026-09-29-panel-poco-a-priori-design.md`. El
principio de ese documento sigue —lo que pide una acción va primero, lo demás un clic más
adentro—; lo que cambia es dónde se cumple.

## 1. Por qué El Fuego se fue

El Fuego tenía cinco cosas. Tres repetían La Parrilla: el termómetro de siete días era el
calendario en chico, «Ahora en la parrilla» era la columna de hoy, y «Poner al fuego» era un
enlace al compositor de La Parrilla. Las otras dos —«Se quemó» y el pie de ayer— son lo único
suyo, y caben arriba y abajo del calendario. Una pantalla de entrada que manda a otra para
hacer cualquier cosa es un clic de más en cada visita.

- `/admin` redirige a `/admin/schedule`. La ruta no se borra: es adonde llega quien entra con
  su código y adonde apuntan enlaces viejos.
- Cuatro pestañas; La Parrilla, primera.
- Arriba del calendario, «Se quemó» (solo si hay algo) y, sin ninguna red conectada, la
  tarjeta «Conecta tu primera red». Abajo, «Ayer: N cortes servidos».
- Se fueron el termómetro, «Ahora en la parrilla», el aviso del siguiente corte y las lecturas
  que solo ellos usaban (`cargaPorDia`, `cortesEntre`, `quemadosDe`).

## 2. El calendario primero

La vista por defecto es la semana; la lista queda a un clic (`?vista=lista`). Cada día de hoy
en adelante lleva un «+» que abre el compositor con ese día puesto: ese día a las 9, o la hora
en punto siguiente si es hoy (`fechaParaDia`). Las tarjetas ya no hacen prefetch de su editor:
una semana cargada eran decenas de pedidos por adelantado (`docs/pendientes.md`).

## 3. El compositor en un panel lateral

«+ Nueva publicación» abre el compositor en un panel que se desliza desde la derecha (pantalla
completa en el teléfono), con el calendario atenuado detrás. Es un `<dialog>` modal, como el de
«Reprogramar». Lo abre la URL (`?componer=1`, `?borrador=…`, `?panel=borradores|csv`), así
que cerrarlo es navegar sin esos parámetros, que son de un solo uso (`enlace.ts`). La carga por
CSV y la lista de borradores usan el mismo panel.

## 4. Borradores

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Tablas propias (`borradores`, `borrador_media`) | Un estado «borrador» en `scheduled_posts` o en sus destinos | Un borrador es estado del formulario, no una publicación: así el publicador, la API, la cocción y `TargetStatus` no se enteran de que existe |
| Guardar los valores del formulario tal cual (`campos`, nombre → valores) | Columnas por campo | El formulario ya es el contrato de `createScheduledPost`; restaurar es devolverle sus valores. Una columna por campo se desincroniza con cada opción nueva de una red |
| La media en su propia tabla | Las URLs dentro de `campos` | El barrido de huérfanos solo protege lo que una columna nombra; dentro de un JSON se borrarían a la hora |
| Subir cada archivo al elegirlo | Subir al programar, como antes | Un borrador tiene que conservar sus archivos. Lo que se abandona sin borrador queda huérfano y el barrido lo borra |
| Guardar un segundo después de la última tecla, sin `revalidatePath` | Guardar al cerrar; revalidar en cada guardado | Cerrar la pestaña no avisa. Revalidar en cada pausa repintaría la parrilla entera a cada rato; se pone al día al cerrar el panel, que navega |
| `fecha` resuelta en la zona del dueño al guardar | Leer `campos.scheduledAt` al dibujar | El calendario necesita un instante para ponerlo en su día, igual que un post |
| Un id que ya no existe vuelve «perdido» y no se recrea | Recrearlo | Si se programó o se descartó en otra pestaña, recrearlo resucitaría lo que alguien ya sacó |

Un borrador nace solo cuando hay texto, un archivo o una palabra clave: abrir el compositor
y cerrarlo no deja uno vacío. «Programar» espera el guardado en curso, programa y borra el
borrador en la misma acción. «Descartar» lo borra. La lista de borradores está en
«Borradores (N)»; los que tienen fecha aparecen además en su día del calendario, con borde
punteado, sin contar para el calor.

## 5. Lo que no cambia

El editor de un post programado, la lista, los estados de cada destino, las validaciones,
«Subir ahora» y «Reprogramar». La API no ve los borradores, y la app del teléfono tampoco.
