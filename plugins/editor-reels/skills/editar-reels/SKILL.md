---
name: editar-reels
description: Edita Reels/TikToks verticales con IA con la marca del usuario y piezas animadas intercambiables, a partir de una toma de cámara (con grabaciones de pantalla opcionales) o solo de una voz en off (video 100 % animado). Usar cuando pida editar, armar o corregir un video o Reel, cuando suba una toma, un audio o una grabación de pantalla para editar, cuando quiera configurar su marca para videos o agregar una pieza o regla al estilo.
---

# Editar Reels — tu marca, piezas intercambiables

Creado por Eric González · ericgonzalezf.com · Instagram @ericgonzalez.ia (IA aplicada sin tecnicismos).
Probado en Reels reales de tutoriales de IA.

Cada video se reconoce como del creador (capa fija: su marca y su proceso) y se ve distinto al anterior
(capa variable: estructura, cámara, subtítulos, fondo, gancho, cierre y música). El contenido decide la estructura.

**Archivos de este skill** (en su carpeta base, que Claude Code muestra al cargarlo; ahí `SK` = `<carpeta base>/scripts`):
`proceso.md` (pasos y comandos) · `piezas.md` (menú de piezas) · `lecciones.md` (errores a evitar; léelo antes de cortar) ·
`scripts/` · `proyecto/` (plantilla del proyecto que se copia la primera vez).
**En la carpeta del usuario** (el plugin se actualiza solo, así que lo personal vive ahí): `registro.md` (combinación de
cada video), `notas.md` (piezas y lecciones propias del usuario; tienen prioridad sobre este skill), `remotion/` (con su
marca en `remotion/src/marca/marca.ts`), `musica/` y una carpeta `videoN/` por video.

## Primer uso: preparar la carpeta y configurar la marca
Si la carpeta actual no tiene `remotion/src/marca/marca.ts`:
1. Recomienda una carpeta solo para los videos (p. ej. `Documentos/Mis Reels`) y abre ahí. Copia dentro el contenido de
   `<carpeta base>/proyecto/` (sin sobrescribir nada que ya exista) y crea `notas.md` vacío.
2. Corre `python "$SK/preparar.py"` y ayuda a instalar lo que marque ✗, pidiendo permiso antes de cada instalación
   (ffmpeg, `pip install faster-whisper`, Node.js, `cd remotion && npm install`).
3. Pregunta en un solo mensaje: nombre, sitio o @ de redes, color principal (o una captura de su marca para sacarlo),
   si prefiere fondos oscuros o claros y la fuente (por defecto Geist; otra de Google Fonts se descarga con su permiso a `remotion/public/fonts/`).
4. Llena `marca.ts`: `acento` = su color; `tinta` = texto legible sobre el acento (oscuro si el acento es claro);
   `claro` = un blanco que combine; `fondo/tarjeta/borde` = oscuros neutros. Contraste ≥ 4.5:1 de tinta sobre acento.
5. Renderiza las dos muestras y enséñaselas:
   `cd remotion && npx remotion render src/index.ts Muestra out/muestra.mp4` (con cámara) y `… MuestraAnimada out/animada.mp4` (sin cámara).

## Dos formatos
- **Con cámara:** la toma del usuario + escenas, pantallas y animaciones encima (`proceso.md` §1–4).
- **Animado, sin cámara:** solo su voz en off; escenas con cámara virtual unidas por un hilo de luz (`proceso.md` §3b,
  `piezas.md` → "Formato animado"). Si el usuario manda solo un tema, puedes escribir el guion (frases de 3–7 palabras)
  y verificar en la web cada dato que se afirme.

## Capa fija (todos los videos)
1. **Marca:** solo los colores y fuentes de `marca.ts` (tokens `C` del kit) y el sitio/@ en los encabezados. Colores de
   otras marcas (Claude, Gemini, ChatGPT…) solo para identificarlas. `ACENTOS` solo para objetos de ejemplo, un color por tema.
2. **Formato:** 1080×1920, 30 fps, 25–60 s. Gancho en la frase 1 (≤3 s) con golpe de título.
3. **Cámara:** gradación (`Gradacion`) y zoom lento alterno por segmento (lo hace `corte.py`).
4. **Ritmo:** sin silencios muertos ni palabras cortadas; 1.1× en tomas sin guion; frases muy rápidas a 0.85–1.0.
5. **Subtítulos:** palabra por palabra, ≤3 palabras/18 caracteres, palabra activa en el acento, ~66 px, centro-bajo;
   nunca sobre la cara ni en la zona de botones de la app.
6. **Audio:** voz a −14 LUFS; música con licencia a −27 LUFS con fundidos; efectos de `public/sfx/` a 0.2–0.55.
7. **Pantallas sobre fondo claro** por legibilidad, salvo que el tema pida oscuro.
8. **Privacidad:** desenfoca o recorta todo dato personal; omite exploradores de archivos y documentos internos.
9. **Nada de imitar marcas:** no dibujes logos, mascotas ni personajes de otras empresas; a una herramienta se la nombra con texto.
10. **Auditoría** antes de entregar (lista en `proceso.md`).

## Capa variable
Por video elige una **estructura**, un **formato de cámara** (o el formato animado), una **variante de subtítulo**, un
**fondo**, un **gancho**, un **cierre**, una **pista** y 2–4 piezas de apoyo (`piezas.md`).
Regla anti-repetición: contra los 2 últimos videos de `registro.md`, no repitas estructura, cámara ni subtítulo; la pista
no puede ser la del video anterior. Si ninguna estructura le queda al tema, crea una nueva con el kit y propón guardarla en `notas.md`.

## Flujo
1. **Recibir** toma(s) o audio + grabaciones de pantalla (opcional) + guion (opcional). El número N del video es el
   siguiente al último de `registro.md`; no lo preguntes. Copia a `videoN/fuente/`.
2. **Preparar y cortar** (`proceso.md` §1–4).
3. **Proponer en 4–6 líneas:** frases del corte con su duración, estructura y piezas con el porqué, pista. Si algo dicho no
   existe en la pantalla real o una frase sale atropellada, dilo y sugiere regrabar solo esa frase.
4. **Recursos** (§5–6) → **componer** (§7) → **previa** (§8) → **final, auditoría y entrega** (§9).
5. **Cerrar el ciclo:** fila nueva en `registro.md`; piezas o lecciones nuevas a `notas.md`, avisando al usuario.

Habla con el usuario en frases cortas y sin tecnicismos; recomienda una opción con su porqué.
Pide permiso antes de instalar o descargar algo y antes de borrar versiones.
