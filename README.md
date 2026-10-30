# Editor de Reels con IA

Un plugin para **Claude Code** que edita tus Reels y TikToks: quita los silencios, pone subtítulos palabra por palabra
y agrega animaciones con **tu** marca. Funciona con tu toma de cámara o solo con tu voz (video 100 % animado), y cada
video sale con una combinación distinta de piezas para que tu perfil no se vea repetitivo.

Creado por **Eric González** · [ericgonzalezf.com](https://ericgonzalezf.com) · Instagram [@ericgonzalez.ia](https://instagram.com/ericgonzalez.ia)

## Instalación (2 comandos)
Abre Claude Code (app de escritorio de Claude → pestaña **Code**, o la terminal) y escribe:

```
/plugin marketplace add ericgonzalezf/editor-reels
```
```
/plugin install editor-reels@ericgonzalezf
```

Luego abre una carpeta para tus videos (por ejemplo `Documentos/Mis Reels`) y escribe:
**"Configura mi marca para mis videos"**. Claude revisa lo que falta instalar, te pregunta tus colores, tu @ y tu fuente,
y te enseña dos videos de muestra.

## Cómo editar un video
1. Graba en vertical con micrófono (o solo tu voz, si quieres un video animado). Si explicas una app, graba también la pantalla.
2. Arrastra los archivos a Claude Code y escribe **"Edita este video"** (con o sin guion).
3. Claude corta, te propone la estructura y te entrega la versión final y una ligera para subir desde el celular.

## Qué necesitas
- Claude Code con un plan que lo incluya, en tu computadora (Windows o Mac). No funciona en el chat normal ni en el celular,
  porque procesa los videos en tu equipo.
- Se instalan una vez (Claude te guía): **ffmpeg**, **Python** con `faster-whisper` y **Node.js**.

## Importante
- **Música:** no viene incluida. Usa pistas con licencia para redes (por ejemplo Mixkit o la biblioteca de audio de YouTube).
- **Remotion** (el motor de animación) es gratis para personas y empresas de hasta 3 personas; empresas más grandes
  necesitan licencia: [remotion.dev/license](https://www.remotion.dev/license).
- Código con licencia MIT. Fuentes Geist con licencia SIL OFL. Efectos de sonido propios, generados con ffmpeg.
