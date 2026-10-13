# La Mesa — lo que te responden y tus respuestas

`/admin/comments`, pestaña «La Mesa» de la barra del panel.

La Mesa (en llano: los comentarios) es la cola de los comentarios que la gente deja en las publicaciones de Instagram, Facebook y YouTube. Cada comentario nuevo llega con una respuesta propuesta por una IA (el «borrador»): se corrige si hace falta y se manda con un botón. Nada sale sin que alguien apriete «Enviar», salvo la respuesta automática por palabra clave, que se configura al programar una publicación. Arriba de la cola están las instrucciones que sigue la IA para escribir los borradores.

Los comentarios llegan solos: cada cinco minutos Tu Parrilla revisa las publicaciones de los últimos siete días de cada cuenta conectada de Instagram y Facebook; las de YouTube, cada media hora. Para eso la cuenta tiene que estar conectada en [Los Fierros](los-fierros.md). Los comentarios que deja la propia cuenta no entran a la cola.

## Cómo se llega

1. En la barra de arriba del panel, aprieta la pestaña «La Mesa» (entre «Los Cortes» y «Los Números»). En un teléfono la fila de pestañas se desliza hacia el lado si no cabe entera.

También se entra directo a `https://tu-parrilla.cl/admin/comments`. Sin sesión abierta, primero hay que entrar (ver [Ingresar](ingresar.md)).

## Qué se ve

Los títulos se ven en mayúsculas; aquí van como están escritos.

### Arriba

- El título «La Mesa» y debajo «lo que te responden y tus respuestas».
- Una línea con cuántos esperan: «No hay nada esperando respuesta.», «Un comentario espera tu respuesta.» o «5 comentarios esperan tu respuesta.» (con el número que corresponda). Cuenta los pendientes de la red elegida en el filtro, sin importar qué estado esté elegido.

### Instrucciones para el modelo

Un recuadro con el título «Instrucciones para el modelo» y debajo «Se guardan en la base y rigen desde el siguiente borrador.». Adentro:

- El campo «Cómo responde el modelo», un cuadro de texto de hasta 2000 caracteres. Trae las instrucciones guardadas o, si nunca se cambiaron, las de la casa: «Responde en español, en primera persona, breve y cálido: una o dos frases. Agradece cuando el comentario es un elogio, responde la pregunta cuando la hay, y si preguntan por precios o por trabajar juntos, invita a escribir por mensaje directo sin dar cifras. No inventes datos que no estén en la publicación. No uses hashtags. Un emoji como máximo, y solo si el comentario tiene uno.»
- El botón «Guardar» (dice «Guardando…» mientras trabaja) y, al terminar, «Guardado.».

### Los filtros

Una fila de botones redondeados; el elegido se ve resaltado.

- Por estado: «Pendientes» (el que viene elegido), «Enviados», «Automáticas», «Descartados», «Todos».
  - «Pendientes»: los que esperan respuesta, incluidos los que se intentaron mandar y fallaron.
  - «Enviados»: los ya respondidos, a mano o por la respuesta automática.
  - «Automáticas»: los que tomó la respuesta automática por palabra clave, en cualquier estado.
  - «Descartados»: los que se decidió no responder.
  - «Todos»: todo lo anterior junto.
- Después de un «·», por red: «Todas» (la que viene elegida), «Instagram», «Facebook», «YouTube».

Se ven hasta 200 comentarios por filtro, los más nuevos.

### La cola

Los comentarios van agrupados por publicación, lo más nuevo primero. Cada grupo empieza con:

- la miniatura de la publicación, si la hay;
- la red y la cuenta, en letra chica y mayúsculas: «Instagram · @cuenta»;
- las primeras líneas del texto de la publicación, o «(sin texto)». Si la red dio el enlace, al apretarlo se abre la publicación en la red, en otra pestaña;
- solo si la publicación tiene respuesta automática: «Palabra clave: GUIA» (con la palabra de esa publicación, en mayúsculas).

Debajo, una tarjeta por comentario. Si el filtro no tiene nada: «No hay comentarios aquí.», y en «Pendientes» y «Todos» además «Los nuevos llegan cada cinco minutos.».

### La tarjeta de un comentario pendiente (o que falló)

De arriba abajo:

1. Quién comentó (o «Alguien», si la red no dio el nombre) y hace cuánto: «recién», «hace 3 horas», «ayer», «anteayer», «hace 5 días».
2. El texto del comentario.
3. Solo si la IA no pudo escribir el borrador, en rojo: «No se pudo redactar la respuesta.»
4. Solo si la respuesta automática lo intentó y la red no la aceptó: «La regla de palabra clave intentó responder y la red no aceptó; «Enviar» lo reintenta.»
5. El cuadro de la respuesta, con el borrador ya escrito. Está vacío si todavía no hay borrador.
6. Solo si un envío anterior falló, en rojo, el motivo: «La red no aceptó la respuesta. Inténtalo de nuevo.» o «Esa cuenta ya no está conectada.»
7. Los botones: «Enviar» (el principal), «Descartar» y, solo cuando la IA no ha dejado borrador, «Reintentar borrador». Mientras cualquiera de ellos trabaja, los tres se apagan y «Enviar» dice «Enviando…». Si algo falla, el error aparece en rojo al lado de los botones.

### La tarjeta de un comentario ya resuelto

No tiene botones.

- Respondido: «Respondido:» y el texto que salió. Si lo mandó la respuesta automática, al lado una etiqueta «Automática».
- Descartado: «Descartado», o «Descartado · El comentario ya no está en la red.» si se descartó solo porque su autor lo borró.
- Solo si la instalación tiene encendidos los mensajes privados (vienen apagados), una línea más en Instagram y Facebook: «Privado: pendiente», «Privado: enviado» o «Privado: no salió», a veces seguida de « · No se pudo mandar el privado.».

### Lo que hace la respuesta automática por palabra clave

Se configura por publicación al programarla en [La Parrilla](la-parrilla.md), en el bloque «Respuesta automática por palabra clave» del compositor. Solo existe en publicaciones que salieron desde Tu Parrilla, y solo en Instagram, Facebook y YouTube.

- Cuando alguien comenta la palabra, Tu Parrilla responde solo en la revisión siguiente (hasta cinco minutos en Instagram y Facebook, hasta media hora en YouTube), sin pasar por «Enviar». Cuenta la palabra entera, sin importar mayúsculas ni tildes: para la palabra «guia», «#GUÍA!» cuenta y «guiar» no.
- Hoy la respuesta es el «Mensaje» de la regla, con su enlace, publicado como respuesta pública al comentario; si la regla trae un documento, su enlace va al final. El mensaje privado todavía no existe. Si el enlace es del sitio propio, sus visitas se cuentan aparte en [Los Números](los-numeros.md).
- Mientras espera la revisión, ese comentario aparece en «Pendientes» sin borrador: la IA no le escribe uno. Si alguien lo responde a mano antes de esa revisión, la respuesta automática ya no lo toma.
- Si salió bien: «Respondido: <el mensaje>» con la etiqueta «Automática».
- Si la red no la aceptó: se queda en «Pendientes» con «La regla de palabra clave intentó responder y la red no aceptó; «Enviar» lo reintenta.» y el mensaje en el cuadro. Al mandarlo con «Enviar» cuenta como respuesta a mano: pierde la etiqueta «Automática» y sale del filtro «Automáticas».
- Si el autor borró el comentario: pasa a «Descartados» con «Descartado · El comentario ya no está en la red.».

## Qué se puede hacer

### Para responder un comentario

1. En «Pendientes», busca el comentario.
2. Lee el borrador en el cuadro y corrígelo o reescríbelo si hace falta.
3. Aprieta «Enviar». Mientras sale dice «Enviando…».
4. La respuesta se publica en la red como respuesta a ese comentario, a nombre de la cuenta conectada. El comentario sale de «Pendientes» y aparece en «Enviados» como «Respondido: …».

Apretar dos veces no manda dos respuestas. El largo máximo depende de la red: 2200 caracteres en Instagram, 8000 en Facebook y 10000 en YouTube.

### Para responder uno que llegó sin borrador

1. Escribe la respuesta en el cuadro vacío y aprieta «Enviar».
2. O aprieta «Reintentar borrador» para pedírselo de nuevo a la IA: el cuadro se llena con el borrador nuevo, o aparece «No se pudo redactar la respuesta.» y queda escribirlo a mano.

Un borrador que ya existe no se puede pedir de nuevo: se corrige a mano.

### Para descartar un comentario

1. Aprieta «Descartar».
2. El navegador pregunta «¿Descartar este comentario? No se va a responder.». Acepta.
3. Pasa a «Descartados». No se publica nada y el comentario sigue en la red.

No se puede deshacer desde el panel.

### Para reintentar una respuesta que falló

Lo que falló se queda en «Pendientes» con el motivo en rojo.

1. Si dice «Esa cuenta ya no está conectada.», primero reconecta la cuenta en [Los Fierros](los-fierros.md).
2. Aprieta «Enviar» otra vez.

### Para cambiar cómo escribe la IA

1. En el recuadro «Instrucciones para el modelo», escribe en el campo «Cómo responde el modelo» cómo quieres que responda: el tono, qué decir y qué no.
2. Aprieta «Guardar» y espera «Guardado.».

Rige desde el siguiente borrador: los que ya están escritos no cambian. Si se borra todo y se guarda, vuelven las instrucciones de la casa. Para escribir cada borrador la IA recibe, además de estas instrucciones, solo el texto de la publicación, el del comentario y el nombre de quien lo dejó.

### Para ver lo que respondió la respuesta automática

Aprieta el filtro «Automáticas». Ahí están todos los que tomó, también los que fallaron; en «Enviados» los que salieron llevan la etiqueta «Automática».

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «No hay nada esperando respuesta.» | No hay comentarios pendientes en la red elegida. | Nada. |
| «Un comentario espera tu respuesta.» / «5 comentarios esperan tu respuesta.» | Cuántos hay en «Pendientes», para la red elegida. | Responderlos o descartarlos. |
| «No hay comentarios aquí.» / «No hay comentarios aquí. Los nuevos llegan cada cinco minutos.» | El filtro elegido está vacío. | Probar con «Todos» y «Todas». Los de YouTube llegan cada media hora. |
| «No se pudo redactar la respuesta.» | La IA no pudo escribir el borrador, o la instalación no tiene IA configurada. | Escribir la respuesta a mano, o «Reintentar borrador». |
| «Escribe una respuesta.» | Se apretó «Enviar» con el cuadro vacío. | Escribir algo. |
| «La respuesta no puede pasar de <N> caracteres.» | La respuesta es más larga de lo que acepta la red. | Acortarla. |
| «Esa cuenta ya no está conectada.» | La cuenta de ese comentario se desconectó o perdió el permiso. | Reconectarla en [Los Fierros](los-fierros.md) y volver a «Enviar». |
| «La red no aceptó la respuesta. Inténtalo de nuevo.» | La red rechazó la respuesta. | «Enviar» de nuevo. Si se repite, apretar «Reconectar» en la tarjeta de la cuenta en [Los Fierros](los-fierros.md), por si le falta el permiso de comentarios. |
| «El comentario ya no está en la red.» | Su autor lo borró; se pasó a «Descartados». | Nada. |
| «La regla de palabra clave intentó responder y la red no aceptó; «Enviar» lo reintenta.» | Falló la respuesta automática. | Revisar el texto del cuadro y apretar «Enviar». |
| «¿Descartar este comentario? No se va a responder.» | Confirmación antes de descartar. | Aceptar para descartar, cancelar para dejarlo. |
| «Guardado.» | Se guardaron las instrucciones. | Nada. |
| «Privado: no salió · No se pudo mandar el privado.» | Solo con los privados encendidos: la respuesta pública salió, el privado no. | Nada que hacer desde aquí. |

## Si el humano dice…

- **«¿Cómo respondo comentarios?»** → Pestaña «La Mesa» → filtro «Pendientes» → corregir el borrador → «Enviar».
- **«No me aparecen comentarios»** → Revisar, en orden: que sean de Instagram, Facebook o YouTube; que la publicación tenga siete días o menos; que la cuenta esté conectada en [Los Fierros](los-fierros.md) (si se conectó antes de que existieran los comentarios, hay que apretar «Reconectar» una vez para dar ese permiso); que hayan pasado cinco minutos (media hora en YouTube); y que los filtros estén en «Todos» y «Todas». Los comentarios de la propia cuenta no aparecen nunca.
- **«No veo los comentarios de TikTok, Threads o X»** → Esas redes no tienen cola de comentarios.
- **«El cuadro de respuesta está vacío»** → La IA todavía no escribió el borrador, la instalación no tiene IA, o el comentario dice la palabra clave de la publicación y está esperando la respuesta automática. Se puede escribir a mano o apretar «Reintentar borrador».
- **«Cambié las instrucciones y el borrador sigue igual»** → Las instrucciones rigen desde el siguiente borrador; los ya escritos se corrigen a mano.
- **«Descarté uno por error»** → No se deshace desde el panel; se puede responder directamente en la app de la red.
- **«Se me perdió un comentario de la cola»** → Mirar en «Enviados» y «Descartados» (si su autor lo borró, aparece ahí con «El comentario ya no está en la red.»). Los de YouTube se borran solos a los 30 días. Cada filtro muestra solo los 200 más nuevos.
- **«La respuesta automática no respondió»** → La palabra tiene que ir entera; la regla solo existe en publicaciones programadas desde Tu Parrilla con el bloque «Respuesta automática por palabra clave»; hay que esperar la revisión siguiente; y si la red la rechazó, está en «Pendientes» con su aviso.
- **«La respuesta automática publicó el enlace en público»** → Es lo esperado hoy: el mensaje privado todavía no existe.
- **«¿Dónde pongo la palabra clave?»** → Al programar la publicación en [La Parrilla](la-parrilla.md), bloque «Respuesta automática por palabra clave».
- **«El botón dice "Enviando…" y yo apreté Descartar»** → «Enviar» dice «Enviando…» mientras cualquier botón de esa tarjeta trabaja; hay que esperar a que termine.
- **«¿Puedo responder desde el teléfono?»** → No: la app del teléfono no tiene esta cola (ver [la app del teléfono](app-movil.md)).

## Lo que esta pantalla no hace

- No trae comentarios de TikTok, Threads ni X, ni de publicaciones de más de siete días.
- No da «me gusta», no oculta ni borra comentarios en la red.
- No edita ni borra una respuesta ya enviada, y no deshace un descarte.
- No vuelve a escribir un borrador que ya existe.
- No responde sola, salvo la respuesta automática por palabra clave, y esa no se configura aquí sino en [La Parrilla](la-parrilla.md).
- No manda mensajes privados: vienen apagados y no tienen botón.
- No existe en la app del teléfono.

## Para quien mantiene esta página

Lo que describe sale de:

- `src/app/admin/(dash)/comments/page.tsx`
- `src/app/admin/(dash)/comments/cola.tsx`
- `src/app/admin/(dash)/comments/instrucciones.tsx`
- `src/app/admin/actions.ts` (`responderComentario`, `descartarComentario`, `reintentarBorrador`, `guardarInstruccionesComentarios`)
- `src/lib/comentarios-cola.ts` (los filtros, el tope de 200)
- `src/lib/social/comentarios/comentarista.ts` (las frases de fallo)
- `src/lib/social/comentarios/responder.ts`
- `src/lib/social/comentarios/validar.ts`
- `src/lib/social/comentarios/redaccion.ts` y `src/lib/social/comentarios/modelo.ts` (el borrador y su frase de fallo)
- `src/lib/social/comentarios/prompt.ts` (lo que recibe la IA)
- `src/lib/social/comentarios/instrucciones.ts` (las instrucciones de la casa, el tope de 2000)
- `src/lib/social/comentarios/reglas.ts` y `src/lib/social/comentarios/automatico.ts` (la respuesta automática)
- `src/lib/social/comentarios/privado.ts` (el privado, apagado)
- `src/lib/social/comentarios/ventana.ts` y `src/lib/social/comentarios/run.ts` (cada cuánto, los siete días, los comentarios propios)
- `src/lib/social/comentarios/agrupar.ts`
- `src/lib/social/retencion-youtube.ts` (los comentarios de YouTube se borran a los 30 días)
- `src/lib/social/comentarios/index.ts`, `src/lib/social/comentarios/instagram.ts`, `src/lib/social/comentarios/facebook.ts` y `src/lib/social/comentarios/youtube.ts` (qué redes, el largo máximo de cada una)
- `src/app/admin/(dash)/schedule/regla-clave.tsx` (el nombre del bloque de la palabra clave)
- `src/lib/vocabulario.ts`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
