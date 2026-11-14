# El Pase — la crítica de los shorts, de vuelta al editor

`/admin/pase`, la pestaña que va después de La Cocina en la barra de arriba. **Solo la ve el
admin.** Lo de adentro de cada pase no está en el panel sino en una dirección propia,
`https://tu-parrilla.cl/pase/<código>`, que se abre sin cuenta.

Un pase junta shorts o imágenes hechos por un editor —una persona, el chef de La Cocina u otra
IA— para que alguien los critique, pegando cada crítica al momento y al lugar del cuadro, y el
editor los arregle y suba la versión siguiente. En la cocina de un restaurante, el pase es el
mesón donde el jefe mira cada plato antes de que salga y devuelve lo que no está bien.

## Cómo se llega

- El admin: la pestaña **«El Pase»**, en la barra de arriba del panel.
- Quien revisa: el **enlace de revisar** que le mandó el admin, `https://tu-parrilla.cl/pase/rev_…`.
- Quien edita: el **enlace de editar**, `https://tu-parrilla.cl/pase/edi_…`.

Cada pase tiene esos dos enlaces. El código del enlace es la llave: quien lo tiene entra sin
cuenta y sin contraseña, y lo que puede hacer depende de cuál tiene. No hay que iniciar sesión.

## Qué se ve

### En el panel (`/admin/pase`)

Arriba, «El Pase» y «la crítica de los shorts, de vuelta al editor», y un párrafo que explica
qué es un pase y sus dos enlaces.

A la izquierda, una tarjeta por pase, primero los vivos y al final los archivados (más
apagados). Cada una tiene:

- el título y, a la derecha, «<N> piezas · <N> críticas abiertas · desde el <fecha>»;
- lo que tiene que mirar quien revisa, si se escribió;
- dos filas con su enlace completo y un botón **«Copiar»** («Copiado» al tocarlo): **«Revisar»**
  y **«Editar»**. Archivado, en su lugar dice «Sus enlaces no abren mientras esté archivado.»;
- **«Abrir para revisar ↗»** y **«Abrir para editar ↗»**, que lo abren en otra pestaña;
- **«Cambiar los enlaces»**, que pregunta «¿Cambiar los dos enlaces? Los de ahora dejan de abrir
  el pase para quien los tenga.», y **«Archivar»** (o **«Desarchivar»**).

Sin pases: «Todavía no hay pases. Crea el primero y mándale los enlaces a quien revisa y a quien
edita.».

A la derecha, **«Nuevo pase»**: «Título» (obligatorio), «Lo que tiene que mirar quien revisa
(opcional)» y el botón **«Crear el pase»** («Creando…» mientras tanto). Debajo, una nota: el
enlace de editar sirve también como API para una IA, con la guía en `/docs/pase-api.md`.

### Adentro de un pase (`/pase/<código>`)

Va siempre de noche. Arriba, la marca de Tu Parrilla con «El Pase», el título del pase y una
etiqueta: **«Revisas»** con el enlace de revisar, **«Editas»** con el de editar. Quien revisa ve
al lado «como <su nombre>» (tocarlo lo borra, para escribir otro). Quien edita ve **«Para tu
IA»**. Si el admin escribió qué mirar, va debajo: «Lo que importa: …».

**Las piezas**, en una fila que se desliza: una tarjeta por creativo, con su última versión
(«v2 A · 2 versiones»), el título, el veredicto («En revisión», «Aprobada», «Pide cambios» o
«Descartada») y un número con las críticas abiertas. Quien edita tiene al final **«Pieza
nueva»**. Sin piezas: «Todavía no hay nada en el pase», y para quien edita, «Subir la primera
pieza».

**La pieza elegida**, a la izquierda:

- arriba, las versiones de ese creativo («v1», «v2 A», «v2 B»…) y, si hay más de una,
  **«Comparar con…»**, que pone otra versión al lado, empezando en el mismo momento; la de la
  derecha va sin sonido, y la ✕ deja de comparar;
- lo que el editor dijo de esa versión: «El editor, en esta versión: …»;
- el video, con **la hora siempre arriba a la izquierda** («0:20.3 / 0:45.0»: minutos, segundos y
  décimas). Un toque sobre el video lo pausa o lo sigue. Las zonas de las críticas aparecen
  dibujadas mientras pasa su momento, y la de la crítica elegida, en ámbar y con su hora;
- debajo, **la línea de tiempo**: se toca o se arrastra para ir; cada crítica es un punto
  naranjo (un momento) o una barra (un tramo), verde si ya está hecha. Tocar uno elige esa crítica;
- los controles: reproducir o pausar, «−1 s», «‹ cuadro», «cuadro ›», «+1 s» y la velocidad
  («1×», «½×», «¼×»). Una imagen no tiene línea de tiempo ni controles.

Para quien revisa, debajo: **«Marcar una zona»** (mientras tanto, «Dibujando la zona…», y sobre el
video «Arrastra para marcar la zona»), **«Desde acá»** y **«Hasta acá»**, que marcan un tramo, y
el **veredicto**: «Aprobada», «Pide cambios» y «Descartada» (tocar el elegido lo quita). Para
quien edita, el veredicto en palabras con quién lo dio, y **«Subir la v<N>»**.

**A la derecha, para quien revisa: «Tu crítica».** La primera vez, «Tu nombre, para que el editor
sepa quién lo dijo». Después, dónde va pegada: el momento («0:20.3»), o el tramo («0:20.3–0:22.0»,
con ✕ para quitarlo), «Zona marcada» (con ✕), y la casilla **«De toda la pieza»**, que la despega
del tiempo. Las etiquetas: «Ritmo y cortes», «Transición», «Subtítulos y texto», «Audio y
música», «Encuadre», «Color y luz» y «Otro». El texto («¿Qué está mal acá, y cómo lo
arreglarías?»), los atajos y **«Dejar crítica»** («Dejando…»). Empezar a escribir pausa el video y
pega la crítica al momento en que está.

**Debajo, la crítica de la pieza**: «La crítica de esta pieza» para quien revisa, «Lo que hay que
arreglar» para quien edita, con cuántas están abiertas y cuántas hechas. Primero las abiertas, en
orden de tiempo. Cada una tiene su momento («Toda la pieza» si es general; tocarlo lleva el video
ahí), la etiqueta, «con zona» si tiene una, el texto, quién la dejó y la respuesta del editor
(«El editor: …»). Las hechas van tachadas, con «Hecha» en verde.

- Quien edita: **«Hecho»**, **«Responder»** (o «Cambiar respuesta»), que abre un campo con
  «Guardar respuesta» y «Cancelar», y en las hechas **«No estaba hecha»**.
- Quien revisa: en las hechas, **«No quedó: reabrir»**, y el tacho para borrarla, que pregunta
  «¿Borrar esta crítica? No se puede deshacer.».

Sin críticas: «Pausa el video donde algo no va y escribe arriba.» (quien revisa) o «Todavía nadie
critica esta pieza.» (quien edita).

**«Subir la v<N>»** y **«Pieza nueva»** abren una ventana: elegir el video o la imagen («MP4, MOV o
WebM hasta 500 MB; JPG, PNG, WebP o GIF hasta 50 MB»), o «O una URL pública (se copia)», el
«Título», y para una versión: «¿Es una de varias para comparar?» (la única, o la variante A, B…;
si esa versión ya existe, la primera letra libre), «Qué cambiaste» y **«Esta versión arregla:»**
con las críticas abiertas de ese creativo, para marcarlas. Mientras sube, una barra con «Subiendo…
<N> %» y después «Guardando…».

**«Para tu IA»** abre una ventana con la dirección de la API («es la llave: no la publiques») y la
crítica entera como lista de tareas, cada una con su botón «Copiar».

## Qué se puede hacer

### Para crear un pase y mandar los enlaces (el admin)

1. Pestaña «El Pase» → «Nuevo pase»: el título y, si se quiere, qué mirar.
2. «Crear el pase».
3. En su tarjeta, «Copiar» en «Revisar» y mandarlo a quien critica; «Copiar» en «Editar» y
   mandarlo a quien edita (o dárselo a la IA que edita).

### Para criticar un short (quien revisa)

1. Abrir el enlace de revisar y elegir la pieza arriba.
2. Pausar donde algo no va (o tocar la línea de tiempo). Para un tramo, «Desde acá» al empezar y
   «Hasta acá» al terminar. Para señalar un lugar del cuadro, «Marcar una zona» y arrastrar.
3. Elegir la etiqueta, escribir qué está mal y cómo se arreglaría, y «Dejar crítica».
4. Al terminar la pieza, el veredicto: «Aprobada», «Pide cambios» o «Descartada».

Atajos de teclado, fuera de los campos: espacio (reproducir o pausar), ← y → (un segundo; con
mayúscula, un cuadro), I y O (el tramo), Z (la zona), C (escribir) y Escape (soltar).

### Para comparar dos versiones

1. Elegir la pieza y una de sus versiones.
2. «Comparar con…» → la otra versión. Las dos quedan lado a lado; espacio reproduce las dos.

### Para arreglar lo que se criticó (quien edita)

1. Abrir el enlace de editar y elegir la pieza: «Lo que hay que arreglar» es la lista de tareas.
2. Tocar el momento de cada una para verla en el video, con su zona.
3. Contestar si hace falta («Responder») y marcar «Hecho» lo que ya está.
4. «Subir la v<N>» con el archivo nuevo, decir qué cambió y marcar qué críticas arregla. Para
   proponer dos alternativas, subir dos variantes (A y B) de la misma versión.

### Para pasarle la crítica a una IA

«Para tu IA» → «Copiar» la crítica y pegarla en su prompt, o darle la dirección de la API con la
guía `https://tu-parrilla.cl/docs/pase-api.md`.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Este enlace no abre» con «Este enlace ya no sirve: pídele uno nuevo a quien te lo mandó.» | El admin cambió los enlaces o archivó el pase, o el enlace está mal copiado. | Pedirle el enlace de nuevo a quien lo mandó. |
| «Escribe tu nombre (hasta 60 letras): así el editor sabe quién lo dijo.» | Se intentó dejar una crítica sin nombre. | Escribir el nombre arriba de «Tu crítica». |
| «Ese archivo no se puede revisar acá: sube MP4, MOV o WebM, o JPG, PNG, WebP o GIF.» | El archivo es de otro tipo. | Exportarlo en uno de esos formatos. |
| «El archivo es muy grande: hasta 500 MB un video y 50 MB una imagen.» | Pasa el tope. | Exportarlo más liviano. |
| «Esa versión ya tiene esa variante: usa otra letra.» | Ya hay una versión con esa letra. | Elegir otra letra. |
| «La subida se cortó. Revisa tu conexión e inténtalo de nuevo.» | El archivo no terminó de llegar al almacén. | Volver a subirlo con buena señal. |
| «El archivo no se pudo traer: revisa que la subida haya terminado o que la URL sea pública.» | La URL no se pudo bajar (privada, rota) o la subida no terminó. | Revisar la URL o subir el archivo. |

## Si el humano dice…

- «No veo la pestaña El Pase» → solo la ve el admin. Quien revisa o edita entra con su enlace, sin
  panel.
- «¿Cómo le paso esto al editor?» → en el panel, «Copiar» en la fila «Editar» de ese pase, y
  mandárselo.
- «El enlace dejó de funcionar» → el admin cambió los enlaces o archivó el pase: hay que pedirle
  el nuevo.
- «¿Dónde está el veredicto?» → debajo del video, a la derecha: «Aprobada», «Pide cambios»,
  «Descartada». Solo con el enlace de revisar.
- «Quiero comparar la versión nueva con la vieja» → «Comparar con…», arriba a la derecha del
  video.
- «El video no se ve» → en algunos navegadores un MOV no se reproduce: pedirle al editor que lo
  suba en MP4.

## Lo que esta pantalla no hace

- No tiene cuentas para quien revisa: el nombre se escribe y no se comprueba.
- No avisa por correo ni al teléfono cuando llega una crítica o una versión nueva.
- No dibuja a mano alzada, flechas ni notas de voz: la zona es un rectángulo.
- No tiene modo día adentro de un pase.
- No programa nada: lo aprobado se programa aparte, en La Parrilla.

## Para quien mantiene esta página

- `src/app/admin/(dash)/pase/page.tsx`, `src/app/admin/(dash)/pase/formularios.tsx` y `src/app/admin/pase-actions.ts` (el panel)
- `src/app/pase/[codigo]/page.tsx` y `src/components/pase/el-pase.tsx` (adentro de un pase)
- `src/components/pase/reproductor.tsx` (el video, la línea de tiempo y las zonas)
- `src/components/pase/criticas.tsx` (la crítica, el veredicto y la lista)
- `src/components/pase/subir.tsx` (subir una pieza o una versión)
- `src/lib/pase/reglas.ts` (las etiquetas, los estados y las frases)
- `src/lib/pase/pase.ts` (lo que se guarda)

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
