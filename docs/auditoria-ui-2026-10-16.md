# Auditoría de la interfaz contra el corte — 16 de octubre de 2026

El corte dibujado (`src/components/corte.tsx`) es lo que más cariño tiene en Tu Parrilla, y
no por lindo: cada propiedad del dibujo dice una sola cosa —la silueta el formato, la carne
la cocción, una marca por destino, el humo que algo sale, el halo y la banderita que algo se
quemó— y se lee sin leer. Esta auditoría recorrió las pantallas del panel, lo público y la
app del teléfono, elemento por elemento, preguntando dónde la interfaz ya habla así y dónde
todavía habla como un formulario cualquiera.

Se hizo con el panel corriendo en local y datos de prueba, a 1280 y a 390 px, y con la app
en su versión web. La versión con capturas y maquetas que se pueden tocar es un artifact
privado del dueño («Tu Parrilla, pantalla por pantalla»); este documento guarda lo necesario
para trabajar sin él.

## Las reglas que salen del corte

Cada propuesta de abajo aplica una o varias.

1. **Una propiedad, un significado.** La forma dice qué es, el color en qué estado está, el
   movimiento que algo pasa ahora. Nunca un color porque sí.
2. **El fuego, solo cuando algo pasa.** Humo, latido y brillo existen mientras algo ocurre.
   Con «reducir movimiento», todo quieto y con la misma información.
3. **Lo quemado se ve igual en todas partes:** halo, banderita, la frase de qué pasó y el
   botón que lo arregla.
4. **Lo crudo espera tu mano:** un borrador, un comentario sin responder, la bandeja de
   TikTok.
5. **Lo frío es vacío o apagado:** una parrilla sin brasa es un día sin nada.
6. **Siempre con palabras al lado.** El dibujo va oculto para el lector de pantalla; nada
   reemplaza una palabra por un dibujo.

La paleta de los gráficos evita el naranjo a propósito (`src/components/charts/theme.ts`)
para no confundirlo con lo accionable, y para las series por red eso sigue valiendo. La
excepción que se propone es la intensidad —cuándo te visitan, cuánto se pasó un post—, que
mide calor, que es justo lo que la brasa significa; la escala sube en luminosidad, así que
se lee también con daltonismo.

## Defectos

Arreglados en el PR #190 (2026-10-16): el ícono de Ajustes se leía como una X o como
herramientas, y en el teléfono la pestaña activa quedaba debajo del botón de Ajustes.

Por arreglar:

1. ~~**Editar post no dice qué destino falló ni por qué.** Solo muestra el aviso verde del que
   salió («Ya publicado en Instagram»). El editor recibe los destinos sin `lastError`.
   `src/app/admin/(dash)/schedule/[id]/editor.tsx`.~~ **Resuelto el 2026-10-16**: arriba del
   editor, una línea por destino con su marca, su motivo y su arreglo
   (`schedule/[id]/destinos.tsx`).
2. ~~**Los gráficos de línea cortan las cifras del eje vertical** («)00» por «2000»): margen
   izquierdo negativo con un eje de 44 px. `src/components/charts/traffic-chart.tsx`.~~
   **Resuelto el 2026-10-16**: el eje mide lo que su cifra más larga, abreviada desde diez mil.
3. ~~**Dos series de escalas distintas comparten eje** —visitas al perfil contra alcance,
   views contra visitas— y la chica queda plana en cero. Mismo archivo.~~ **Resuelto el
   2026-10-16**: esas dos van cada una en su gráfico, uno debajo del otro (`separadas`).
4. ~~**«Todas las etiquetas» repite el mismo título** en filas seguidas sin decir de qué red
   es cada una. `src/components/charts/campaign-table.tsx`.~~ **Resuelto el 2026-10-16**:
   cada fila lleva el ícono de su red y su cuenta.
5. ~~**Tus publicaciones, a 390 px, pierde la columna de views** y «SE PASÓ» se corta en el
   borde. `src/app/admin/(dash)/analytics/publicaciones/post-table.tsx`.~~ **Resuelto el
   2026-10-16**: en el teléfono las cifras van debajo del título, con dos botones para ordenar.
6. ~~**Los Números, a 390 px: «En las redes» queda en una columna de una palabra por
   renglón**, apretada por el selector de cuentas. `src/app/admin/(dash)/analytics/page.tsx`.~~
   **Resuelto el 2026-10-16**: el título baja a su línea, y lo mismo en los paneles («Lo que
   más creció» con sus tres enlaces) y en las listas con barra, cuya nota baja bajo el texto.
7. ~~**La Parrilla, a 390 px, abre la semana en el lunes** y hoy queda fuera de la pantalla.
   `src/app/admin/(dash)/schedule/calendar.tsx`.~~ **Resuelto el 2026-10-16**: abre corrida
   hasta hoy (`schedule/desplazar-a-hoy.tsx`).
8. ~~**La misma fecha se escribe de tres formas**: «15-10-2026, 1:00 p. m.» en la lista,
   «jue 15 de oct · 20:00» en Se quemó y «15 oct · 20:00» en la app.~~ **Resuelto el
   2026-10-16**: la lista la escribe como Se quemó, siempre con el día (`diaYHora`, en
   `src/lib/schedule-week.ts`), y la app también (`cuandoQuemado`, en
   `mobile/src/lib/agenda.ts`).
9. ~~**Un «—» suelto bajo Visitas, Clicks, Únicos y CTR** cuando no hay período anterior para
   comparar. `src/components/charts/stat-tile.tsx`.~~ **Resuelto el 2026-10-16**: dice «Nada
   en el período anterior para comparar».
10. **Por revisar en el teléfono:** en la versión web de la app, las etiquetas de la barra de
    pestañas se cortan por abajo. Puede ser solo la web.

Encontrado y resuelto al arreglar el primero, el 2026-10-16: a 390 px el editor medía 464 px y
la página se corría de lado, porque un `<fieldset>` crece por defecto hasta su línea más larga
(el resumen de las opciones de TikTok, una URL).

## Lo que más comunica, en tandas

Cada tanda se puede publicar sola. Los tiempos son a ojo.

**Tanda 1, lo roto y lo que casi no cuesta.** Hecha el 2026-10-16, salvo el defecto 10, que
hay que mirar en el teléfono: los defectos de arriba; en La Parrilla del panel, Se quemó
plegado con sus corticos quemados en fila y el arreglo junto a la frase del error
(«Reconectar», «Cambiar el archivo»; `schedule/arreglo.ts`), el aviso de reintento del
calendario en un renglón, la vista Lista con el corte chico en cada fila, y «Eliminar» que
pregunta antes; en la app, Se quemó con su corte quemado, y las fichas y los botones
secundarios con borde (eran texto gris sobre nada y no se veía que se tocaban).

**Tanda 2, el corte en los flujos (3 a 5 días).** El compositor (Nueva publicación y
Borrador) es la distancia más grande del producto entre el cariño del corte y el de la
pantalla: casillas y selectores del navegador, y nada que muestre qué se está armando. La
propuesta: los archivos en una tabla de miniaturas en el orden del carrusel, que llegan como
carne cruda que se completa mientras sube y se quema si falla (la subida tiene que pasar de
`fetch` a `XMLHttpRequest` para contar bytes, `src/lib/subida-directa.ts`; la app ya cuenta
el porcentaje); los fierros como fichas con su temperatura y un aviso si la cuenta vence
antes de la fecha elegida; la semana en chico con el fuego de cada día y la hora más
caliente marcada; la vista previa del corte armándose, y al programar, el corte cayendo en
su día del calendario que se ve detrás. Además: la parrilla fría para los días vacíos, el
esqueleto de carga con la forma de cada pantalla y un pulso tibio, y La Mesa como
conversación —lo que te dijeron a un lado, tu respuesta al otro— con el estado de cada
respuesta en la gramática del corte y el número de pendientes en su pestaña. Hecho el 2026-10-16:
los archivos del compositor, que llegan como carne cruda con su porcentaje y se quedan con
«Reintentar» si no llegan (la subida ya cuenta bytes, por `XMLHttpRequest`), y «Así va a
quedar», el corte del post armándose sobre la parrilla de su día. También del mismo día: las
cuentas como fichas con su fierro y el aviso de que el permiso vence antes de la hora elegida
(`schedule/vence.ts`), la semana en chico con el fuego de cada día para elegirlo, y el corte
que cae en su día al programar, encendido un momento. La hora caliente sigue esperando a la
tanda 4. Y también: la parrilla fría —un día vacío con los fierros en ceniza, sin frase a la
vista y con «Poner algo» al pasar el mouse—, y la carga con la forma de La Parrilla (semana,
día, lista y editor), La Mesa, Los Números y Los Fierros, con el título de verdad y un pulso
tibio (`src/components/esqueleto.tsx`). En la app, el día vacío sigue con su frase: sin mouse
ni parrilla dibujada, es la frase lo que dice que está vacío. Quedan La Mesa como
conversación y las cuentas del editor de un post, que siguen siendo casillas mientras el
compositor ya tiene fichas.

**Tanda 3, se asa mientras sale (2 a 3 días; toca el publicador).** Hoy la carne salta de
cruda a sellada cuando empieza a salir. La propuesta es guardar la etapa de cada destino
(contenedor creado, subiendo con su porcentaje, procesando, publicado) y sellar la carne al
ritmo de lo que cada red confirma, en el panel y en la app; si una etapa falla, se quema ahí.
No es un progreso inventado: sin etapa nueva, la carne espera.

**Tanda 4, Los Números con fuego (2 a 3 días).** «Cuándo te visitan» en brasas, con la hora
más caliente dicha en palabras y usada como sugerencia en el compositor; «El corte» de Tu
mejor 10 % dibujado —los posts como puntos, el cuchillo en el umbral, los de arriba
encendidos—; las cifras grandes con su curva; «se pasó ×6» en vez de sí o no; las barras de
«Lo que más creció» del color de la carne, como ya hace la app.

**Tanda 5, la puerta (1 a 2 días).** Entrar con la marca y el código en seis casillas que se
encienden como brasas (con un solo campo de verdad y `autocomplete="one-time-code"`); el
error y el 404 con la gramática del corte; la portada con cortes sobre su semana. La portada
tiene que seguir diciendo qué hace la app y enlazando Privacidad y Términos: es lo que miró
Google para verificar la marca. La portada quedó hecha el 2026-10-17: la semana del inicio con
cortes de verdad sobre sus parrillas, un corte que se arma tocándolo, la subida que llega como
carne cruda, los fierros, lo quemado, lo que trajo cada corte, La Mesa, tu página y qué se
conecta y para qué, cada sección con la pieza del panel y no con un dibujo que se parece
(`src/components/landing.tsx`); la imagen para compartirla dibuja la misma semana. Arriba
lleva la marca —el bife a punto del ícono de la app—, cada sección dice sobre su título la
pantalla del panel donde vive, y cierra con la invitación junto a una parrilla llena. Lo que lo
exige Google lo cuida `src/components/landing.test.ts`. Quedan la entrada con el código en
casillas, y el error y el 404.

**Tanda 6, con el próximo build nativo.** `react-native-svg` para que los cortes de la app
tengan las curvas del panel, y una vibración corta cuando algo sale o se quema (ya anotado en
`docs/pendientes.md`, «La propuesta de diseño 2.1»).

## Lo que queda como está

Los cortes del calendario, el fuego de cada día, las filas de Se quemó, Los Fierros desde
#189, la vista previa de La Vitrina, «Ese día ya tiene un corte.» del compositor, «El corte»
como nombre del umbral de Tu mejor 10 % y la página pública del creador, que es suya y no
lleva asado.
