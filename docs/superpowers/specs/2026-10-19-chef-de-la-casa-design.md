# El chef de la casa: un agente nuestro que cocina el material de cada cliente

Fecha: 2026-10-19. **Diseño, nada implementado.** Espera el servidor, que el dueño está
montando. Fija la idea, lo que ya existe y sirve, lo que faltaría construir y en qué orden,
para que el día que el servidor esté listo no se parta de cero.

## La idea

En Tu IA cada usuario conecta **su chef**: un programa suyo que usa la API con una llave. El de
Vicente es un Claude con skills de edición (el repositorio privado
`VicentePareja/marca-personal`): baja el material crudo, lo transcribe, propone los cortes, arma
verticales con subtítulos y la marca de quien los encarga, los renderiza y los programa en la
parrilla con `atributos` para medir qué gancho funcionó.

**El chef de la casa** es ese mismo oficio corriendo en nuestro servidor, para cualquier usuario
que lo contrate. Va levemente personalizado: cada cliente tiene su receta, con su marca (letras,
colores, sonidos, música, el llamado a comentar y su @), su voz y sus temas. Es un servicio
pagado, y no reemplaza al otro: quien trae su propio chef lo sigue usando, y en Tu IA conviven
los dos.

El porqué: el editor como servicio ya existe. Desde el 2026-10-01 corre como piloto con clientes
en el portátil de Vicente, entrega por carpetas de Drive y no publica. El chef de la casa es el
paso de encargo a mano a producto: el cliente le pasa el material desde su panel, y lo cocinado
cae en su propia parrilla.

## Cómo se ve: la pieza entera

El chef tiene la cara del ícono de Tu IA (`src/components/icono-maestro.tsx`): el parrillero de
noche y el maestro de sushi de día.

Pasarle un video largo es **llevarle la pieza entera**. De noche, una media res colgada del
gancho; de día, un atún entero sobre la tabla. El chef la despieza, y cada clip que sale es un
corte en la parrilla. Como un clip es un video, de noche sale una entraña y de día un nigiri,
que es lo que esos dibujos ya quieren decir.

El progreso se cuenta con el dibujo. La pieza aparece con líneas punteadas por donde se va a
cortar, la misma gramática del roll entero que espera su corte (ver el diseño del modo día), y
cada clip terminado se desprende y cae en La Parrilla como un corte crudo, por aprobar.

Las palabras, en primera pasada:

| | De noche: el parrillero | De día: el maestro de sushi |
|---|---|---|
| Lo que le llevas | la res | el atún |
| El botón | «Llévale la res» | «Llévale el atún» |
| Mientras sube | «Colgando la res» | «Sobre la tabla» |
| Mientras elige y corta | «El desposte» | «El despiece» |
| Mientras arma los videos | «Al fuego» | «Armando las piezas» |
| Al terminar | «Listo: N cortes en tu parrilla» | «Listo: N piezas en tu barra» |
| El informe de la semana | «La sobremesa» | «La sobremesa» |
| Que programe solo, si se activa | «Que lo maneje el asador» | «Omakase» |

De día no se usa «soplete» para nada de esto: la llama del soplete ya quiere decir «está
saliendo ahora».

Un cuidado con las palabras: desde el 2026-10-20 el modo día cambia las que con sushi no tienen
sentido (La Barra, Los Cuchillos, «se desafila»…), y cada una tiene su par en
`src/lib/vocabulario.ts`, en `PALABRAS_DE_DIA`, que la wiki tiene que nombrar entera. Esta tabla
sumaría más. Se decide al diseñar la pantalla, con dos salidas: aceptarlas, cada una con su par
en `PALABRAS_DE_DIA`, o usar palabras que sirven de noche y de día («la pieza entera», «el
despiece») y que cambie solo el dibujo.

## Lo que ya existe y sirve

- **La API con llave por dueño** (Tu IA). El chef actúa como cada cliente con una llave de ese
  cliente, y el aislamiento por dueño ya está hecho: un agente con la llave de uno no ve ni toca
  lo de nadie más. Revocar la llave es despedir al chef.
- **El lote** (`POST /api/schedule/batch`), con `ref` para reenviar sin duplicar, `atributos`
  para medir, `cuentas` para elegir destinos y las opciones de TikTok.
- **Los números para administrar**: `GET /api/metrics/posts`, `GET /api/metrics/mejores` y
  comparar por atributo. Con eso el chef aprende qué funciona en cada cliente.
- **La subida directa a R2.** El navegador y el teléfono suben el archivo con un PUT a una URL
  firmada, sin que cruce la función (`src/lib/subida-directa.ts`); el teléfono la corta en
  500 MB (`MAX_BYTES_SUBIDA`).
- **Los borradores**, compartidos entre el panel y el teléfono: el lugar natural donde el chef
  deja lo que propone.
- **El pipeline del AM**, en `marca-personal`: Python, Remotion, ffmpeg y faster-whisper, con un
  perfil de marca por cliente (`marcas/<id>/marca.json`). Una tanda tarda unas 1,5 horas en
  renderizar, y las tandas van una detrás de otra.

## Lo que faltaría en Tu Parrilla

1. **Borradores por API.** Hoy una llave programa, lee y borra, pero no deja borradores. Para
   que el chef proponga y el cliente apruebe, la llave tiene que poder crearlos. Es un endpoint nuevo o un campo del lote
   (`"borrador": true`), y entra en `api-editor.md`, `api-llm.md` y `api.json`.
2. **El pedido.** Una tabla de pedidos con su dueño, su estado, el material, la nota del cliente
   («diez clips sobre ventas, uno al día desde el lunes») y el resultado. En Tu IA va un bloque
   «El chef de la casa» con el botón, la subida, el progreso dibujado y la historia de pedidos.
3. **Subir la pieza entera.** Un video largo crudo pesa decenas de GB. La subida directa de hoy
   es un solo PUT, y R2 acepta unos 5 GB así; más allá hay que subir por partes y poder retomar. En la primera fase la entrada puede seguir siendo Drive, como en
   el piloto.
4. **Cómo se entera el servidor.** Recomendado: que el servidor le pregunte a Tu Parrilla cada
   cierto tiempo, con una credencial propia, y no al revés. Así el servidor no expone ningún
   puerto. Hacen falta cinco operaciones: listar los pedidos pendientes, tomar uno, informar el
   avance, pedir un enlace firmado al material y cerrar el pedido con su resultado.
5. **La llave del chef, por cliente.** Al activar el servicio, Tu Parrilla genera en Tu IA una
   llave llamada «El chef de la casa», que el cliente ve y puede revocar. Nunca
   `SCHEDULE_API_KEY`, la llave del despliegue: esa es del admin y ya está anotada para retirarse
   (`docs/pendientes.md`).
6. **El plan.** Una marca en el usuario que diga hasta cuándo tiene el chef, que encienda la
   pantalla y ponga el cupo (piezas por mes o minutos de material). El cobro, a mano al
   principio.
7. **Lo que se guarda.** La pieza entera se borra al terminar el pedido, o a los pocos días si se
   pide otro corte, y los clips siguen la regla de siempre: el video se borra del almacenamiento
   cuando salió en todas sus redes. No se guardan videos que ya no hacen falta.
8. **Lo legal.** `/privacidad` y `/terminos` tienen que decir que el chef procesa el contenido en
   nuestro servidor y con la API de Anthropic, qué guarda y por cuánto tiempo. La revisión de un
   abogado ya está pendiente como tarea **[dueño]**.

## El servidor: lo que falta configurar

Lo que hay que dejar listo cuando toque. Nada de esto está hecho:

- **Acceso.** Un usuario sin privilegios para el servicio, SSH solo con llave, firewall,
  actualizaciones de seguridad automáticas.
- **Las herramientas del pipeline.** Python 3.11 o más, Node 24, ffmpeg (con el codificador de la
  GPU, si el servidor tiene una), lo que pide el Chrome sin pantalla de Remotion, las letras y el
  modelo de faster-whisper. El instalador de `marca-personal` (`setup.ps1`) es solo para
  Windows: en Linux sus pasos van a mano, según su `SETUP.md`, y conviene escribirle uno.
- **El agente.** El Claude Agent SDK, o Claude Code sin pantalla, con las mismas skills, y una
  llave de la API de Anthropic a nombre de Pyxis, sacada de la consola. Nunca la suscripción
  personal de Claude: la documentación del Agent SDK pide llave de API para un producto que
  atiende a terceros.
- **El trabajador.** Un servicio de `systemd` que toma un pedido por vez, con una carpeta propia
  que se borra al terminar y un tope de tiempo. El render dura horas: corre como servicio, no
  dentro de una sesión del agente. En el piloto, las tareas de fondo del agente se morían a los
  diez minutos. El agente decide y el pipeline ejecuta.
- **Secretos.** Un archivo de entorno que solo lee el servicio, y las llaves de los clientes
  cifradas.
- **Disco.** Para el material crudo, los proxies y los renders, cientos de GB, con un barrido de
  lo que queda.
- **Avisos.** Los registros en journald y un correo cuando un pedido falla.
- **Respaldo** de las recetas de los clientes.

## El orden propuesto

- **Fase 0, hoy:** este diseño y su entrada en `docs/pendientes.md`.
- **Fase 1, el servidor hace lo de hoy.** El servicio del piloto pasa del portátil al servidor.
  La entrada sigue siendo Drive, pero la salida es la parrilla del cliente, con una llave que el
  cliente genera en Tu IA. No hay pantalla nueva. Sirve para medir el tiempo y el costo real de
  cada pedido antes de ponerle precio.
- **Fase 2, beta pagada con pocos clientes.** Borradores por API, el pedido desde el panel («Llévale
  la res») con su progreso dibujado, la llave del chef por cliente y el cobro a mano.
- **Fase 3, el producto.** El plan con cupo y cobro, la receta editable desde el panel, la
  sobremesa semanal y el programar solo, para quien lo active.

## Preguntas abiertas

1. **¿Borrador o programado?** Recomendado: borradores por defecto, porque nada sale publicado
   sin que el cliente lo vea, y el programar solo como opción.
2. **¿Se cobra por pieza o por mes?** El piloto anota el tiempo que toma cada encargo justo para
   decidir esto.
3. **¿Dónde vive la receta?** En el servidor, como hoy los perfiles de marca, o en Tu Parrilla,
   con un formulario que el cliente edita.
4. **¿El servidor tiene GPU?** Decide cuánto tarda cada pedido y cuántos caben al día.
5. **¿Qué material acepta al principio?** Recomendado: lo que el pipeline ya hace bien, una
   persona hablando a cámara en español, convertida en verticales con subtítulos.
6. **Contenido sintético.** Si el chef genera voz o imágenes, TikTok y YouTube piden declararlo.
   Revisar sus reglas antes de ofrecerlo.
7. **El nombre.** «El chef de la casa» es la propuesta; también puede ser «nuestro chef».

## Para quien siga

- Tu IA, donde iría el bloque: `src/app/admin/(dash)/ia/` y su página en la wiki,
  `public/docs/ui/tu-ia.md`.
- El ícono del chef: `src/components/icono-maestro.tsx`.
- El contrato de la API: `public/docs/api-editor.md`.
- Los dibujos de día y su gramática: `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`.
- El pipeline y el piloto con clientes: el repositorio privado `VicentePareja/marca-personal`,
  `docs/servicio.md`.
