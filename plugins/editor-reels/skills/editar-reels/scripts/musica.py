"""Prepara la música de fondo: recorta a la duración del video, nivel bajo (-27 LUFS, deja la voz al frente) y fundidos.
Uso (desde la carpeta del proyecto):  python "$SK/musica.py" NombrePista 43.4 7 [inicio]
La pista va en musica/NombrePista.mp3. Usa solo música con licencia para redes (p. ej. Mixkit, YouTube Audio Library)."""
import subprocess, sys

pista, dur, n = sys.argv[1], float(sys.argv[2]), sys.argv[3]
ini = sys.argv[4] if len(sys.argv) > 4 else "0"
salida = f"remotion/public/v{n}/musica.wav"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", ini, "-t", f"{dur + 0.5:.2f}", "-i", f"musica/{pista}.mp3",
                "-af", f"loudnorm=I=-27:TP=-3:LRA=7,afade=t=in:st=0:d=0.6,afade=t=out:st={dur - 2.0:.2f}:d=2.4",
                "-ar", "44100", "-ac", "2", salida], check=True)
print("ok", salida)
