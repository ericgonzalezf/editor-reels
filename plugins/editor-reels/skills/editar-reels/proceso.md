# Proceso con comandos

Comandos para Bash (Git Bash en Windows, Terminal en Mac). Raíz = la carpeta del proyecto del usuario (donde está `remotion/`).
Antes de todo define `SK="<carpeta base de este skill>/scripts"` (Claude Code muestra la carpeta base al cargar el skill; usa `/` en la ruta).
Requisitos (los revisa `scripts/preparar.py`): ffmpeg, Python 3.10+ con faster-whisper, Node.js 18+ y `npm install` en `remotion/`.
En Windows, si `ffmpeg` se instaló con winget y Bash no lo encuentra, reinicia la terminal o agrega su carpeta `bin` al PATH.
En Python usa rutas `C:/Users/...` (no `/c/Users/...`) y `PYTHONIOENCODING=utf-8` al imprimir acentos.

## 1. Preparar
```bash
mkdir -p video7/fuente video7/trabajo video7/salida remotion/public/v7
cp ".../mi_toma.mp4" video7/fuente/toma.mp4          # y pantalla1.mp4, pantalla2.mp4…
ffprobe -v error -select_streams v -show_entries stream=width,height,r_frame_rate -of csv=p=0 video7/fuente/toma.mp4
ffmpeg -y -loglevel error -ss 5 -i video7/fuente/toma.mp4 -frames:v 1 -vf scale=540:-1 video7/trabajo/espejo.png
```
Mira `espejo.png`: si letras, logos o bolsillo de la camisa salen al revés, la toma viene en espejo → `"espejo": True`.
Algunas cámaras y apps (gimbals, cámara frontal) graban en espejo según el modo; revísalo en cada toma.

## 2. Transcribir la toma completa
```bash
cd video7
ffmpeg -y -loglevel error -i fuente/toma.mp4 -vn -ac 1 -ar 16000 trabajo/audio.wav
PYTHONIOENCODING=utf-8 python "$SK"/transcribir.py trabajo/audio.wav trabajo/palabras.json "Claude, Gemini, ChatGPT"
```
Imprime bloques `[inicio-fin] texto`. Con guión: busca la mejor toma de cada frase (si repitió, la última suele ser la buena).
Sin guión: elige los tramos que cuentan la historia (gancho → qué vamos a hacer → demo → resultado → cierre) y descarta titubeos.

## 3. Cortar
```bash
cp "$SK"/corte.py trabajo/corte.py      # llenar FUENTES y TRAMOS
python trabajo/corte.py                   # imprime frases con duración y el comando ffmpeg
ffmpeg -y -loglevel error -stats -i fuente/toma.mp4 -/filter_complex trabajo/filtro.txt -map "[vout]" -map "[aout]" -c:v libx264 -preset medium -crf 15 -c:a aac -b:a 192k -movflags +faststart trabajo/corte.mp4
```
Varias tomas: una entrada `-i` por fuente, en el orden de FUENTES. Para una frase regrabada con otra ropa,
usa solo su audio y tapa la cámara en ese tramo (p. ej. burbuja con ondas de voz usando `useAudioData`).

## 3b. Solo voz en off (videos animados, sin cámara)
El usuario graba el guion frase por frase con pausas y manda solo el audio. No hay espejo ni zoom de cámara.
```bash
cp ".../audio.m4a" video7/fuente/voz.m4a
ffmpeg -y -loglevel error -f lavfi -i color=c=black:s=1080x1920:r=30 -i fuente/voz.m4a -shortest -c:v libx264 -preset ultrafast -c:a aac fuente/toma.mp4
```
Luego §2–4 igual (transcribir, `corte.py` con `VEL = 1.0`, un tramo por frase del guion; frases pegadas con `exacto`).
En §4 copia el corte como `remotion/public/v7/voz.mp4` (no `camara.mp4`). En la composición: `<Audio src={staticFile('v7/voz.mp4')} volume={1.2} />`
(la voz del corte sale ≈ −15.7 LUFS; 1.2 la lleva a −14). Base de la composición: copia `remotion/src/MuestraAnimada.tsx`.

## 4. Transcribir el corte y generar datos
```bash
ffmpeg -y -loglevel error -i trabajo/corte.mp4 -vn -ac 1 -ar 16000 trabajo/audio_corte.wav
PYTHONIOENCODING=utf-8 python "$SK"/transcribir.py trabajo/audio_corte.wav trabajo/palabras_corte.json "…"
cp "$SK"/datos.py trabajo/datos.py       # N, FIX y ANCLAS
PYTHONIOENCODING=utf-8 python trabajo/datos.py
cp trabajo/corte.mp4 ../remotion/public/v7/camara.mp4
```
Revisa la línea de subtítulos que imprime: ortografía, acentos, "¿…?", nombres de marcas. Corrige en FIX.
Escucha los bordes de cada frase (o revisa que la última palabra de cada frase esté completa en la transcripción del corte).

## 5. Recursos de pantalla
```bash
python "$SK"/revisar.py fuente/pantalla1.mp4 trabajo/pantalla_hoja.png 2 10   # ver qué hay y cuándo
cp "$SK"/clips.py trabajo/clips.py && python trabajo/clips.py
```
Recorta solo la zona útil (caja de prompt, respuesta, resultado). Velocidad 4–20× en generaciones largas.
Imágenes fijas del resultado con `still=`. Antes de usar un clip, mira un cuadro: nada privado visible.
Logos: SVG a color en `remotion/public/logos/` (pide permiso para descargarlos; busca versiones a color, no planas).

## 6. Música
```bash
cd .. && python "$SK"/musica.py MiPista 43.4 7
```
Duración = `duracion` de `tiempos.json` + 0.3. Rota pistas (ver registro). Solo música con licencia para redes, con permiso del usuario,
anotada en `musica/licencias.txt` (de dónde, cuándo, licencia).

## 7. Componer
```bash
cp remotion/src/plantilla/Plantilla.tsx remotion/src/v7/<Nombre>.tsx
```
(Copia solo el .tsx: datos.py ya dejó `subs.json` y `tiempos.json` en `src/v7/`.)
Cambia `CARPETA = 'v7'`, el nombre del componente y `DURACION_…`; registra en `remotion/src/Root.tsx`:
`<Composition id="Nombre" component={…} durationInFrames={Math.round(DURACION * FPS)} fps={FPS} width={1080} height={1920} />`.
Sincroniza todo con `fr(n)` (frases) y `A.ancla` (palabras), nunca con segundos escritos a mano.
Revisa tipos: `cd remotion && npx tsc --noEmit -p .`.

## 8. Previa y revisión
```bash
cd remotion && npx remotion still src/index.ts Nombre ../video7/trabajo/c.png --frame=300 --scale=0.4   # cuadro suelto
cd .. && python "$SK"/exportar.py previa Nombre 7 && python "$SK"/revisar.py video7/trabajo/preview.mp4 video7/trabajo/hoja.png 1.5 10
```
Mira la hoja tú mismo (Read) antes de mostrarla. Si el usuario quiere verla, envía la previa con SendUserFile.

## 9. Final, auditoría y entrega
```bash
python "$SK"/exportar.py final Nombre 7 1        # video7/salida/video7_v1.mp4 y video7_v1_redes.mp4
```
Auditoría (todas deben pasar):
- [ ] Volumen: I ≈ −14 LUFS, pico ≤ −1 dB; la música no tapa la voz en ningún tramo.
- [ ] Ninguna palabra cortada al inicio/fin de frase; ninguna frase acelerada de más (sobre todo el cierre).
- [ ] Subtítulos: ortografía, signos ¿? ¡!, nombres de marca; nunca sobre la cara ni fuera de la zona segura
      (evitar los 250 px de abajo y la franja derecha donde Instagram pone botones).
- [ ] Toma sin espejo (texto legible en la ropa).
- [ ] Nada privado en pantalla (correos, proyectos, archivos, prompts privados, teléfonos).
- [ ] Lo que se dice coincide con lo que se ve (pasos de la interfaz reales, nombres de botones en español).
- [ ] Animaciones sincronizadas con la palabra que las provoca; nada queda en pantalla de más ni se corta.
- [ ] Hoja de revisión del final: sin cuadros negros, saltos o clips congelados fuera de lugar.
- [ ] `_redes` < 30 MB.
Entrega: envía (SendUserFile si existe, o di la ruta) `video7_v1_redes.mp4` y 2–3 líneas de qué tiene de nuevo. Versiones siguientes: `_v2`, `_v3`…
Cuando el usuario apruebe una versión como final, pregunta antes de borrar las anteriores.
