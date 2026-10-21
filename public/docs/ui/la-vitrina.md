# La Vitrina — tus páginas públicas

`/admin/profiles` está dentro del botón «Ajustes» del panel web y la ven todos los usuarios, no solo el admin. El editor de cada página vive en `/admin/profiles/<id>`.

La Vitrina es donde se arma la página pública de links (lo que en otras partes llaman «link en la bio»): una foto, un nombre, una bajada, una bio, un color y la lista de links que ve cualquiera que entre a tu dirección. Todo usuario nace con una página, su página principal, que ya está publicada con una dirección sacada de su correo; se pueden crear más, por ejemplo una privada que solo se comparte a mano. Las visitas y los clics que juntan estas páginas se miran en [Los Números](los-numeros.md).

## Cómo se llega

1. En el panel, abre el botón «Ajustes», a la derecha de la barra de pestañas. En pantallas angostas se ve solo el ícono, un trinche y un cuchillo, lado a lado (de día, dos palillos), sin la palabra.
2. En el menú que se despliega, elige «La Vitrina» (debajo dice «tus páginas públicas»).
3. Para editar una página, aprieta «Editar» en su tarjeta.

Si la persona no ha entrado al panel, primero tiene que ingresar: ver [Entrar al panel](ingresar.md).

## Qué se ve

Los títulos de pantalla y de bloque, los rótulos de los campos y las etiquetas chicas se ven en mayúsculas por diseño; aquí van escritos como están en el código.

### La lista de páginas (`/admin/profiles`)

- Arriba, el título «La Vitrina» con «tus páginas públicas» debajo, y a la derecha el botón «Nuevo perfil» (mientras trabaja dice «Creando…»).
- Debajo, la frase «El perfil principal se sirve en /. El resto vive en su propia URL.» Ojo: eso solo es cierto para el dueño del sitio en su dominio propio. En tu-parrilla.cl la raíz es la portada del producto, y la página principal de cualquier usuario —incluida la del dueño— vive en su propia dirección, como las demás.
- Una tarjeta por página, de la más antigua a la más nueva. Cada una tiene:
  - una franja vertical del color de acento de la página;
  - el nombre de la página;
  - la etiqueta «principal», si es la página principal;
  - la etiqueta «borrador», si no está publicada;
  - su dirección, por ejemplo `/juan-perez`;
  - cuántos links tiene («1 link», «3 links», contando los apagados), y « · oculto a buscadores» si tiene esa opción encendida;
  - los botones «Editar» (abre el editor) y «Abrir» (abre la página pública en una pestaña nueva);
  - solo en las páginas que no son la principal, el botón «Hacer principal» (al pasar el mouse dice «Servir este perfil en /»; mientras trabaja, «Cambiando…»).

### El editor de una página (`/admin/profiles/<id>`)

Arriba: una flecha para volver a La Vitrina, el nombre de la página como título y, a la derecha, «Ver página», que abre la página pública en una pestaña nueva.

Debajo, cuatro bloques en este orden. En pantallas anchas hay además una columna a la derecha, «Vista previa», con la página dibujada como un teléfono.

**Bloque «Perfil»** (debajo del título: «Los cambios se ven al instante en la vista previa»). Nada de este bloque queda guardado hasta apretar «Guardar perfil», ni siquiera la foto.

- «Foto de perfil»: un círculo y el botón «Subir imagen» (o «Cambiar», si ya hay foto); con foto aparece también «Quitar». Tocar el círculo hace lo mismo que «Subir imagen».
- «Nombre».
- «Bajada», con el ejemplo «Creador · Builder» y la ayuda «Sale arriba del nombre, en mayúsculas».
- «Bio», un cuadro de texto de varias líneas.
- «URL»: una barra `/` seguida del campo con la dirección. Debajo puede salir una ayuda:
  - en la página principal: «Esta es tu página principal, por eso su dirección no se edita aquí. Para cambiarla, haz principal a otra página primero.» (el campo aparece gris y no se puede escribir);
  - si la página se sirve en la raíz de la dirección donde está abierto el panel: «Este perfil se sirve en la raíz del sitio.» En tu-parrilla.cl esto no aparece nunca.
- «Color de acento»: ocho círculos de colores (el elegido lleva un anillo blanco) y un cuadrito más para elegir cualquier color.
- Dos interruptores con texto:
  - «Publicado», con la ayuda «Si lo apagas, la URL responde 404»;
  - «Ocultar de buscadores», con la ayuda «Recomendado para el perfil privado».
- El botón «Guardar perfil» (mientras guarda, «Guardando…»; al terminar aparece al lado «Guardado», en verde). Si algo falla, el mensaje sale en rojo justo arriba del botón.

**Bloque «Links»** (debajo del título: «Arrastra para reordenar. El orden se guarda solo.»). En pantallas angostas, donde no hay columna de vista previa, este bloque tiene el botón «Ver» —a la derecha del título, o debajo en un teléfono—, que abre la vista previa a pantalla completa; se cierra con la X de arriba a la derecha.

- La lista de links. Cada fila, de izquierda a derecha:
  - un asa de seis puntitos para arrastrar;
  - el nombre del link (o «Sin nombre») y, debajo, su tipo y el destino, por ejemplo «Link normal · instagram.com/juan»;
  - una flechita que despliega la fila para editarla;
  - un interruptor que prende o apaga el link. Los links apagados se ven desteñidos.
- Si no hay ninguno: «Sin links todavía. Agrega el primero abajo.»
- Abajo, el formulario para agregar uno: «Tipo» (una lista con «Link normal», «Destacado», «Red social» y «Agendar»), «Nombre» (ejemplo: «Mi proyecto»), «URL» (ejemplo: «ejemplo.com») y el botón «Agregar link». «Nombre» y «URL» son obligatorios.

Una fila desplegada muestra:

- «Tipo», con las mismas cuatro opciones pero con nombres más largos: «Link normal», «Destacado con imagen», «Red social (icono arriba)» y «Agendar (bloque especial)».
- «Icono», con la ayuda «Un nombre conocido o cualquier emoji» y el ejemplo «instagram, github, 🎧…». Al escribir se sugieren los nombres conocidos: instagram, tiktok, x, github, linkedin, youtube, facebook, threads, twitch, spotify, telegram, whatsapp, mail, web, calendar, music, photo, blog, substack, project, entre otros. Cualquier otra cosa se muestra tal cual, por eso sirve un emoji.
- «Nombre».
- «Descripción corta», con el ejemplo «Opcional».
- «URL».
- Solo en los tipos «Link normal» y «Destacado con imagen»: «Imagen», con «Subir imagen» / «Cambiar» / «Quitar» como la foto de perfil. La ayuda dice «Se muestra grande, ideal 16:9» en el destacado y «Reemplaza al icono» en el link normal.
- «Programar visibilidad», una sección plegada que al abrirse muestra dos campos de fecha y hora: «Aparece desde» y «Desaparece». Las horas se leen en la zona horaria de [Tu Cuenta](tu-cuenta.md).
- Los botones «Guardar link» (mientras guarda, «Guardando…»; al terminar, «Guardado») y, a la derecha, «Borrar».

Cómo sale cada tipo en la página pública:

| Tipo (al agregar / al editar) | Cómo se ve |
|---|---|
| «Link normal» / «Link normal» | Un botón con un ícono chico a la izquierda (o la imagen, si se subió una), el nombre, la descripción corta y el dominio de destino. Sin ícono ni imagen, lleva un globo. |
| «Destacado» / «Destacado con imagen» | Una tarjeta más grande, con la imagen ancha arriba (si tiene) y debajo el nombre, la descripción y el dominio. |
| «Red social» / «Red social (icono arriba)» | Solo un ícono cuadrado, sin texto, en una fila de íconos que va debajo de la bio y arriba de todos los demás links. Si el campo «Icono» está vacío, el ícono se elige por el nombre del link (un link llamado «Instagram» lleva el logo de Instagram); si el nombre no es uno conocido, sale el nombre mismo apretado en el cuadrito, así que conviene llenar «Icono». |
| «Agendar» / «Agendar (bloque especial)» | Un bloque teñido con el color de acento, con un ícono de calendario, el nombre, la descripción y el dominio. |

**Bloque «Compartir»**: la dirección completa de la página (por ejemplo `https://tu-parrilla.cl/juan-perez`) y el botón «Copiar», que por un momento cambia a «Copiado». Debajo: «Para saber qué contenido te trae tráfico, agrega ?s=lo-que-sea al final: …?s=reel-agosto. Cada etiqueta aparece por separado en Los Números.», con la dirección de la página en lugar de los puntos suspensivos.

**Bloque «Zona peligrosa»**:

- «Cambiar la URL secreta»: solo en las páginas que no son la principal.
- «Borrar perfil»: solo si la página no es la principal y tienes más de una. Si no se puede, en su lugar aparece la razón:
  - «No puedes borrar tu única página: todo usuario necesita al menos una.»
  - «No puedes borrar tu página principal: primero haz principal a otra página, desde «La Vitrina».»

**«Vista previa»**: la página como la vería un visitante, con lo que se está escribiendo aunque no se haya guardado. Muestra todos los links prendidos, incluso los que por «Programar visibilidad» todavía no aparecen, o ya desaparecieron, en la página real. Lo que pasa en la vista previa no cuenta como visita ni como clic.

## Qué se puede hacer

### Para cambiar la foto

1. Abre la página en el editor («Editar» en su tarjeta).
2. En «Foto de perfil», aprieta «Subir imagen» (o «Cambiar»).
3. Elige una imagen JPG, PNG, WebP, GIF o AVIF de hasta 8 MB. Mientras sube, el círculo muestra una ruedita; después aparece la foto en el círculo y en la vista previa.
4. Aprieta «Guardar perfil». Hasta ese momento la página pública sigue con la foto anterior.

Para dejarla sin foto: «Quitar» y después «Guardar perfil». Sin foto, la página muestra la inicial del nombre.

### Para cambiar el nombre, la bajada o la bio

1. Escribe en «Nombre», «Bajada» o «Bio». La vista previa cambia mientras escribes.
2. Aprieta «Guardar perfil» y espera «Guardado».

### Para cambiar el color

1. Toca uno de los ocho círculos de «Color de acento», o el cuadrito del final para elegir cualquier color.
2. Aprieta «Guardar perfil».

El color tiñe la bajada, el anillo de la foto, el bloque «Agendar» y los resplandores del fondo. No hay otro ajuste de diseño: ni imagen de fondo, ni tipografía, ni plantillas.

### Para cambiar la dirección de una página que no es la principal

1. En «URL», escribe la dirección nueva (lo que va después de la barra).
2. Aprieta «Guardar perfil».
3. La dirección real queda en el bloque «Compartir». Al guardar se pasa a minúsculas, se le quitan las tildes y los espacios y signos se vuelven guiones (máximo 60 caracteres): `Mi Página` queda `mi-pagina`. El campo «URL» sigue mostrando lo que escribiste hasta que recargues la página.

Si dejas «URL» vacío, la dirección se arma con el nombre. La dirección anterior deja de funcionar en el acto: quien la tenga guardada verá «No encontramos esa página».

### Para cambiar la dirección de la página principal

La principal no deja editar su dirección. El camino es:

1. En La Vitrina, aprieta «Hacer principal» en otra página y acepta.
2. Edita la que era principal y cámbiale la dirección como cualquier otra.
3. Si quieres, vuelve a hacerla principal.

### Para publicar u ocultar una página

1. En el editor, prende o apaga «Publicado».
2. Aprieta «Guardar perfil».

Apagada, su dirección muestra la página «No encontramos esa página» y en La Vitrina la tarjeta lleva la etiqueta «borrador».

### Para que Google y otros buscadores no la muestren

1. Prende «Ocultar de buscadores».
2. Aprieta «Guardar perfil».

La página sigue abierta para quien tenga la dirección; solo se les pide a los buscadores que no la indexen. Las páginas creadas con «Nuevo perfil» nacen con esta opción encendida; la principal con que nace cada usuario, apagada.

### Para agregar un link

1. En el bloque «Links», abajo, elige el «Tipo».
2. Escribe el «Nombre» (es el texto del botón) y la «URL». No hace falta el `https://`: si falta, se agrega solo. También sirven `mailto:correo@ejemplo.com` para un correo y `tel:+56912345678` para un teléfono.
3. Aprieta «Agregar link». Queda al final de la lista y ya prendido: sale de inmediato en la página pública si la página está publicada.
4. Para ponerle ícono, descripción o imagen, despliégalo tocando su nombre en la lista (ver la tarea siguiente).

### Para editar un link

1. Toca el nombre del link en la lista: la fila se despliega.
2. Cambia lo que haga falta: «Tipo», «Icono», «Nombre», «Descripción corta», «URL» o «Imagen».
3. Aprieta «Guardar link» y espera «Guardado». La vista previa ya mostraba el cambio, pero la página pública no lo tiene hasta este paso.

### Para que un link aparezca o desaparezca solo en ciertas fechas

1. Despliega el link y abre «Programar visibilidad».
2. Llena «Aparece desde», «Desaparece», o los dos. Un campo vacío significa sin límite por ese lado. La hora se entiende en la zona horaria de [Tu Cuenta](tu-cuenta.md).
3. Aprieta «Guardar link».

El link además tiene que estar prendido. La lista del editor no marca qué links tienen fechas y la vista previa los muestra igual: para comprobar si un link está visible ahora, hay que abrir la página real con «Ver página».

### Para apagar o prender un link sin borrarlo

1. Toca el interruptor a la derecha de su fila. Se guarda solo, sin apretar nada más.

Ojo: el interruptor guarda también lo que se haya cambiado en ese link sin apretar «Guardar link». Si en ese momento el nombre o la URL del link están vacíos, no se guarda nada y no aparece ningún aviso.

### Para cambiar el orden de los links

1. Toma un link por el asa de seis puntitos de la izquierda y arrástralo a su lugar (con el mouse o con el dedo).
2. Suéltalo. El orden se guarda solo.

Los links de tipo «Red social» siempre salen juntos en la fila de íconos de arriba, entre ellos en el orden de la lista; el orden solo mueve los demás entre sí.

### Para borrar un link

1. Despliega el link.
2. Aprieta «Borrar» (abajo a la derecha) y acepta la pregunta «¿Borrar "<nombre del link>"?».

No se puede deshacer. Para sacarlo solo por un tiempo, mejor apágalo.

### Para ver cómo queda

- En pantallas anchas, la «Vista previa» está siempre a la derecha.
- En pantallas angostas, aprieta «Ver» en el bloque «Links»; ciérrala con la X.
- Para ver la página real tal como está guardada, aprieta «Ver página» (arriba, en el editor) o «Abrir» (en la tarjeta de La Vitrina).

### Para compartir la página y saber qué publicación trae visitas

1. En el bloque «Compartir», aprieta «Copiar».
2. Pega la dirección donde haga falta (la bio de Instagram, un mensaje).
3. Para distinguir de dónde viene cada visita, agrega al final `?s=` y una etiqueta, por ejemplo `…/juan-perez?s=reel-agosto`. Cada etiqueta aparece por separado en [Los Números](los-numeros.md).

### Para crear otra página

1. En La Vitrina, aprieta «Nuevo perfil».
2. Se abre el editor de la página nueva: se llama «Perfil nuevo», tiene una dirección al azar del estilo `perfil-a1b2c3`, no está publicada y está oculta a buscadores.
3. Ponle nombre, foto, links y lo que quieras.
4. Cuando esté lista, prende «Publicado» y aprieta «Guardar perfil».

### Para hacer principal otra página

1. En La Vitrina, aprieta «Hacer principal» en la tarjeta de esa página.
2. Acepta la pregunta. Si la página estaba como borrador, queda publicada.

Qué significa ser principal: para el dueño del sitio, es la página que sale en la raíz de su dominio propio. Para cualquier otro usuario no cambia nada de lo que ve el público; solo significa que esa página no se puede borrar ni cambiarle la dirección desde el editor.

### Para cambiar la URL secreta de una página

Sirve cuando una dirección privada circuló más de la cuenta.

1. En el editor, en «Zona peligrosa», aprieta «Cambiar la URL secreta».
2. Acepta la pregunta. La dirección queda con un final nuevo al azar (por ejemplo `circulo-9f8e7d6c`) y la anterior deja de funcionar. La nueva sale en «Compartir».
3. Recarga la página del navegador antes de volver a apretar «Guardar perfil»: el campo «URL» sigue mostrando la dirección vieja, y guardar sin recargar la devuelve a la anterior.

### Para borrar una página

1. Si es la principal, primero haz principal a otra (ver arriba).
2. En su editor, en «Zona peligrosa», aprieta «Borrar perfil».
3. Acepta la pregunta. Se borran la página, sus links y sus métricas, y vuelves a La Vitrina. No se puede deshacer.

## Mensajes que puede ver

| Lo que dice la pantalla | Qué significa | Qué hacer |
|---|---|---|
| «Guardado» | El perfil o el link quedó guardado. | Nada. |
| «El nombre no puede quedar vacío.» | Se intentó guardar el perfil con «Nombre» vacío. | Escribir un nombre y volver a guardar. |
| ««x» es una dirección reservada del sistema: elige otro nombre o escribe una URL distinta.» (con la dirección en lugar de x) | Esa dirección la usa el propio sitio (por ejemplo `admin`, `api`, `ingresar`, `docs`, `privacidad`, `terminos`). Puede pasar también con «URL» vacío, si el nombre produce una de esas palabras. | Escribir otra dirección en «URL». |
| «La URL /x ya está en uso por otro perfil.» | Otra página, tuya o de otra persona, ya tiene esa dirección. | Elegir otra, por ejemplo agregándole algo al final. |
| «No se pudo guardar. Intenta de nuevo.» | Falla del servidor al guardar. | Volver a apretar «Guardar perfil»; si sigue, esperar un rato. |
| «La imagen supera los 8 MB.» | La foto o imagen es muy pesada. | Usar una más liviana. |
| «Formato no soportado.» | No es JPG, PNG, WebP, GIF ni AVIF (por ejemplo, una foto HEIC de iPhone). | Convertirla o elegir otra. |
| «No se pudo preparar la subida. (<código>)» o «No se pudo subir el archivo. (<código>)» | La imagen no alcanzó a subir: falló la conexión o el almacenamiento. | Volver a elegir la imagen; si se repite, reintentar más tarde. |
| «No se pudo subir la imagen.» | Falló la subida sin un motivo que mostrar. | Reintentar más tarde. |
| «Falta configurar Cloudflare R2 (R2_*).» | El sitio no tiene configurado dónde guardar imágenes. | Avisar a quien administra el sitio; la persona no lo puede arreglar. |
| «Ponle un nombre al link.» | Se intentó guardar un link sin «Nombre». | Escribir el nombre. |
| «Falta la URL.» | Se intentó guardar un link sin «URL». | Escribir la dirección. |
| «El perfil ya no existe.» | La página se borró (por ejemplo, desde otra pestaña). | Volver a La Vitrina. |
| «Sin links todavía. Agrega el primero abajo.» | La página no tiene links. | Usar el formulario de abajo y «Agregar link». |
| ««nombre» se servirá en / y el perfil principal de ahora pasará a su propia URL. Si era borrador, queda publicado. ¿Seguir?» | Pregunta de «Hacer principal». Lo de «se servirá en /» solo vale para el dueño del sitio en su dominio propio. | «Aceptar» para seguir, «Cancelar» para no hacer nada. |
| «¿Borrar "nombre"?» | Pregunta antes de borrar un link. | Aceptar solo si se quiere borrar para siempre. |
| «Se generará una URL nueva y la actual dejará de funcionar.» | Pregunta de «Cambiar la URL secreta». | Aceptar si se quiere invalidar la dirección actual. |
| «Se borra "nombre" con sus links y métricas. ¿Seguir?» | Pregunta de «Borrar perfil». | Aceptar solo si se quiere perder todo eso. |
| «No puedes borrar tu única página: todo usuario necesita al menos una.» | Es la única página de la persona. | Se puede vaciar o despublicar, pero no borrar. |
| «No puedes borrar tu página principal: primero haz principal a otra página, desde «La Vitrina».» | Es la principal. | Hacer principal a otra en La Vitrina y después borrar esta. |
| «Esta es tu página principal, por eso su dirección no se edita aquí. Para cambiarla, haz principal a otra página primero.» | Explica por qué el campo «URL» está gris. | Ver más arriba cómo cambiar la dirección de la página principal. |
| «No encontramos esa página» / «La dirección no existe, o la página dejó de estar publicada.» (en la página pública) | La dirección está mal escrita, cambió, o la página tiene «Publicado» apagado. | Copiar la dirección de «Compartir» y revisar «Publicado». |
| «Todavía no hay links acá.» (en la página pública) | La página no tiene ningún link visible ahora: no hay, están apagados o fuera de sus fechas. | Agregar o prender links. |

## Si el humano dice…

- «No encuentro dónde se edita mi página» → botón «Ajustes», «La Vitrina», «Editar».
- «Cambié la foto y no sale» → falta apretar «Guardar perfil» después de subirla. La vista previa la muestra antes de guardar; la página real no.
- «Edité un link y en la página sigue igual» → falta «Guardar link» en ese link.
- «No puedo cambiar la URL, está gris» → es la página principal; ver más arriba cómo cambiar la dirección de la página principal.
- «Puse la URL con mayúsculas y tildes y quedó distinta» → se normaliza al guardar; la dirección que vale es la de «Compartir».
- «Mi página dice No encontramos esa página» → revisar que «Publicado» esté prendido y guardado, y que la dirección sea la de «Compartir» (si se cambió la dirección o la URL secreta, la vieja ya no sirve).
- «Un link no aparece en mi página» → revisar que su interruptor esté prendido y, en «Programar visibilidad», que la fecha de hoy quede dentro de «Aparece desde» y «Desaparece». La vista previa no sirve para esto: muestra el link igual.
- «El link de Instagram sale solo como un ícono, sin texto» → es de tipo «Red social»; para un botón con texto, cambiar el «Tipo» a «Link normal» y «Guardar link».
- «Quiero que un link resalte» → tipo «Destacado con imagen» con una imagen ancha, o «Agendar (bloque especial)».
- «No encuentro el botón para borrar la página» → no aparece en la principal ni si es la única; el bloque «Zona peligrosa» dice la razón.
- «No encuentro "Hacer principal"» → está en las tarjetas de La Vitrina, no en el editor, y no aparece en la que ya es principal.
- «No encuentro "Cambiar la URL secreta"» → no existe para la página principal.
- «Hice principal otra página y mi dirección sigue mostrando la misma» → para un usuario que no es el dueño del sitio, ser principal no cambia qué se ve en cada dirección: cada página sigue en la suya.
- «¿Dónde veo cuánta gente entró?» → en [Los Números](los-numeros.md).
- «Quiero poner un fondo o cambiar la letra» → no se puede; solo el «Color de acento».
- «Quiero un link a WhatsApp» → tipo «Link normal», URL `wa.me/` seguido del número con código de país, y en «Icono» escribir `whatsapp`.

## Lo que esta pantalla no hace

- No tiene imagen de fondo, tipografías ni plantillas: el único ajuste de diseño es el color de acento.
- No tiene un campo para la imagen que aparece al compartir el link en WhatsApp u otras apps: se usa la foto de perfil.
- No muestra visitas ni clics: eso está en [Los Números](los-numeros.md).
- No conecta redes sociales: un link de tipo «Red social» es solo un link. Las redes se conectan en [Los Fierros](los-fierros.md).
- No guarda versiones ni deshace: lo guardado sale de inmediato en la página publicada, y lo borrado no vuelve.
- No duplica páginas ni copia links de una página a otra.
- No se puede usar por API ni desde [la app del teléfono](app-movil.md): las páginas y sus links solo se editan aquí.
- No elige qué se ve en la raíz de tu-parrilla.cl: ahí siempre está la portada del producto.

## La página pública

Lo que ve un visitante al abrir la dirección de una página, de arriba abajo:

- Un fondo oscuro con resplandores difusos del color de acento.
- La foto en un círculo con un anillo animado del color de acento; sin foto, la inicial del nombre.
- La bajada, en mayúsculas y del color de acento, arriba del nombre.
- El nombre, grande, y debajo la bio.
- La fila de íconos de los links «Red social», sin texto.
- Los demás links, uno debajo del otro en el orden del editor, cada uno con el estilo de su tipo (ver la tabla de tipos) y el dominio de destino en letra chica. Todos se abren en una pestaña nueva.
- Solo salen los links prendidos que estén dentro de sus fechas. Si no queda ninguno, sale «Todavía no hay links acá.».

La pestaña del navegador dice el nombre, o «nombre · bajada» si hay bajada. Al compartir la dirección, la vista previa usa la foto de perfil y la bio. Cada visita y cada clic en un link se cuentan para [Los Números](los-numeros.md).

Dónde vive cada página:

- En tu-parrilla.cl, toda página está en `tu-parrilla.cl/<dirección>`, sea o no la principal. La raíz `tu-parrilla.cl` es la portada del producto.
- El dueño del sitio puede tener además su propio dominio. Ahí la raíz `/` muestra su página principal, y `/<dirección>` solo sus páginas; la dirección de cualquier otro usuario da «No encontramos esa página» en ese dominio. En esa raíz, la principal del dueño sale aunque tenga «Publicado» apagado.
- Una página con «Publicado» apagado, una dirección que no existe o una dirección vieja muestran «No encontramos esa página», «La dirección no existe, o la página dejó de estar publicada.» y el botón «Ir al inicio».

## Para quien mantiene esta página

Lo que describe sale de estos archivos:

- `src/app/admin/(dash)/profiles/page.tsx`
- `src/app/admin/(dash)/profiles/[id]/page.tsx`
- `src/app/admin/(dash)/profiles/[id]/editor.tsx`
- `src/app/admin/(dash)/profiles/[id]/link-row.tsx`
- `src/app/admin/actions.ts` (perfiles, links y subida de imágenes, con sus frases de error)
- `src/app/admin/(dash)/nav.tsx`
- `src/lib/vocabulario.ts`
- `src/components/ui.tsx`
- `src/components/image-field.tsx`
- `src/lib/subida-directa.ts` y `src/app/api/admin/upload-url/route.ts` (la subida directa al almacén, con destino «imagen»)
- `src/components/profile-view.tsx`
- `src/components/icon.tsx`
- `src/lib/slugs.ts`
- `src/lib/utils.ts`
- `src/lib/storage.ts`
- `src/lib/profiles.ts`
- `src/lib/serve-profile.tsx`
- `src/app/[slug]/page.tsx`
- `src/app/page.tsx`
- `src/app/not-found.tsx`

Si cambias lo que se ve en alguno de ellos, actualiza esta página en el mismo commit.
