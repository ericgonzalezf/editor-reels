# Menú de piezas

**Kit** = lista en `remotion/src/marca/kit.tsx` (importar de `'../marca/kit'`). **Anim** = lista en
`remotion/src/marca/animacion.tsx` (formato animado, importar de `'../marca/animacion'`). **Receta** = se arma con el kit
siguiendo la descripción; si se usa dos veces, pásala al kit.
GLOBAL = usa el tiempo del video, va al nivel superior. LOCAL = va dentro de `<S de a>` (empieza en 0).

## Estructuras de demo (una por video)
| Estructura | Cuándo | Cómo |
|---|---|---|
| Noticia con logos | Anuncio o novedad, sin pantalla | Cámara completa; el logo de cada marca aparece al nombrarla (resplandor de su color + `whoosh`); zoom de énfasis en palabras clave con `golpes` |
| Pasos numerados | Tutorial de 3 pasos | Número enorme "01/02/03" en acento + `Encabezado` con puntos de progreso + `Ventana`/`Clip` con la grabación y `Clic` |
| Pasos con infografía | Tutorial con datos o listas | `Hoja` con `Fondo puntos`; paso en círculo con anillo de progreso (SVG `strokeDashoffset`); línea de tiempo de nodos; elementos que vuelan a sus categorías |
| Demo cinemática con reacción | Herramienta visual | Cámara `burbuja`; tramos de grabación real en `Ventana` que entran con barrido + desenfoque; `DestelloLuz` entre tramos; cierra con `AntesDespues` |
| Evolución en pantalla dividida | Algo que mejora en versiones V1→Vn | Cámara `franja`; panel claro arriba con la imagen actual que se revela con barrido de izquierda a derecha + `Flash`; instrucción con `useTecleo`; tira de miniaturas V1…Vn que se encienden |
| Duelo por rondas | Comparar 2 herramientas | `Fondo arena` con los colores de cada marca; cámara `tarjeta`; "RONDA 1/2" gigante; misma entrada → resultado con `Flash`; al final las dos lado a lado con insignia "VS", marcador 0–1, corona y sello "MI GANADOR" |
| Animación sin cámara · un solo hilo | Solo voz en off; explicativo | Anim (sección "Formato animado"); base `src/MuestraAnimada.tsx` |
Ideas sin usar: top 3 con podio, mito vs. realidad, checklist que se llena, chat simulado, mapa entrada → IA → resultado, cuenta regresiva de errores.

## Formato de cámara (Kit `Camara`, GLOBAL)
Pantalla completa (siempre en gancho y cierre) · `burbuja` círculo abajo a la izquierda (que se vea la cabeza completa) ·
`tarjeta` tarjeta inclinada con borde de color · `franja` baja y deja arriba un panel de ~1160 px (subtítulos a top ≈1800, 54 px).
`cara` = centro de la cara en el cuadro 1080×1920 (mídelo en un still). `golpes` = segundos con zoom de énfasis.
Receta: anillo que late con la voz (`useAudioData` + `visualizeAudio` de `@remotion/media-utils`).

## Subtítulos (Kit `Subtitulos`, GLOBAL)
`contorno` blanco con borde negro · `recuadro` palabra activa en caja de acento · `subrayado` barra de acento animada ·
`pildora` cápsula oscura. `zona(t)` mueve o encoge según la escena; `claro: true` sobre fondos claros.

## Fondos
Kit `Fondo`: `claro`, `puntos`, `aurora` (luz del acento que se mueve), `arena` (oscuro + brillos por color + diagonales), `oscuro`.
Kit `Hoja`: la escena sube desde abajo como una hoja y baja al salir.

## Ganchos (frase 1)
Kit `TituloGolpe` (línea blanca con contorno + chip de acento) con `Sfx impacto`.
Recetas: abanico de 3 resultados que se despliega · píldoras de dos marcas que chocan con "VS" giratorio · sticker temático (ícono de PDF, de hoja de cálculo).

## Apoyo (2–4 por video)
Kit: `Encabezado` (GLOBAL) · `Ventana` + `Clip` + `Clic` · `Etiquetas` (GLOBAL, + `pop` suave) · `Sticker` · `AntesDespues` ·
`useTecleo` + `Cursor` · `Flash` / `DestelloLuz`.
Recetas: polaroid "MISMA FOTO" · chips con las partes del prompt · esqueleto con brillo mientras "se genera" ·
archivo que vuela a la ventana · lupa sobre un dato sensible · barra de progreso del video.

## Cierres
Kit `ComentarioTecleado` (palabra o pregunta que se escribe sola) · Kit `BotonSeguir` ("+ Sígueme" → "✓ Siguiendo", con `click`).
Recetas: encuesta con barras de color · abanico de versiones + botón · avión de papel al DM (solo con automatización real).

## Sonido (Kit `Sfx`; `preparar.py` los genera)
`impacto` golpe de título/VS · `whoosh` entrada o salida de escena · `swish` cambio dentro de escena · `pop` aparición ·
`ding` resultado listo · `click` botón o clic. Un efecto por evento visual, no más.

## Formato animado (Anim)
Sin toma de cámara: escenas al ritmo de la voz (una cada 1–3 s) unidas por UNA línea de luz del acento que rodea lo que
se dice y sigue a la siguiente escena. Base: `src/MuestraAnimada.tsx`.
- `PLANOS` (`PlanoDef[]`): un plano por escena con `ent` = `zoom` | `barrido` | `giro` (alterna; el primero `ninguna`).
  `<Plano>` aplica la cámara virtual: empuje lento + transición con desenfoque de movimiento.
- `TRAMOS` (`Tramo[]`, uno por plano, mismo índice): puntos del hilo y llaves `[segundo, índice de punto]` ancladas a palabras.
  Cada tramo empieza donde terminó el anterior. `encima: true` solo para tachar; si no, va DETRÁS de las tarjetas (las rodea).
  `arco()` para círculos. `<HiloCapa encima={false}>` antes de los planos y `<HiloCapa encima>` después.
- `GOLPES`: segundos con sacudida (`sacudida`): gancho, revelaciones, resultado, cierre.
- `<Mundo punta>`: fondo carbón con piso de retícula en perspectiva, partículas y luz que sigue la punta del hilo. `<Grano>` encima de todo.
- Piezas LOCALES: `Titular` (palabras que suben de una máscara; `acento` = índices de palabras en color), `Ap` (entrada con
  resorte + desenfoque), `useFlota`, `vidrio`/`vidrioDe(color)` (tarjeta de vidrio), `Brillo`, `Chispas`, `Onda`, `Rafaga`,
  `Confeti`, `Fichas` (dígitos), `NumeroPaso` (número gigante en contorno), `Sub` (cambio de tarjeta dentro de un plano), `Etq`.
  Kit: `brilloso(color)` para botones e íconos con relieve, `DEGRADADO` para titulares de marca.
- Subtítulos `pildora` a top ≈1580; `Encabezado claro={false}`.
- Receta opcional: una **mascota propia** del usuario (personaje SVG simple con su color, que cambia de pose y mueve la boca
  con el volumen de la voz). Debe ser original: nunca la mascota o el logo de otra marca.
