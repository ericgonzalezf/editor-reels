"""PLANTILLA de clips de pantalla. Copiar a videoN/trabajo/clips.py, definir recortes y correr desde videoN/.
Cada clip sale a 1000 px de ancho, 30 fps, sin audio y con 6 s de cuadro congelado al final (para que nunca se acabe antes).
PRIVACIDAD: desenfoca barras laterales, proyectos, correos y prompts privados; omite tramos con explorador de archivos,
documentos de planeación o paneles con correo. Revisa cada clip con un cuadro antes de usarlo."""
import subprocess

N = 1
OUT = f"../remotion/public/v{N}/"


def clip(nombre, src, ini, fin, crop, vel=1.0, blurs=(), still=None):
    """crop = (x, y, w, h) en la grabación; blurs = rectángulos (x, y, w, h) relativos al recorte;
    vel > 1 acelera (generaciones largas: 4-20); still = segundo para exportar una imagen PNG."""
    x, y, w, h = crop
    vf = f"[0:v]crop={w}:{h}:{x}:{y}[c0]"; actual = "c0"
    for k, (bx, by, bw, bh) in enumerate(blurs):
        vf += f";[{actual}]split[m{k}][b{k}];[b{k}]crop={bw}:{bh}:{bx}:{by},boxblur=22:4[bl{k}];[m{k}][bl{k}]overlay={bx}:{by}[c{k + 1}]"
        actual = f"c{k + 1}"
    if still is not None:
        vf += f";[{actual}]scale=1000:-2:flags=lanczos[out]"
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(still), "-i", src, "-frames:v", "1", "-filter_complex", vf, "-map", "[out]", OUT + nombre + ".png"]
    else:
        vf += f";[{actual}]setpts=PTS/{vel},fps=30,scale=1000:-2:flags=lanczos,format=yuv420p,tpad=stop_mode=clone:stop_duration=6[out]"
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(ini), "-to", str(fin), "-i", src, "-filter_complex", vf, "-map", "[out]",
               "-an", "-c:v", "libx264", "-crf", "17", "-preset", "medium", OUT + nombre + ".mp4"]
    subprocess.run(cmd, check=True); print("ok", nombre)


# Ejemplos:
# clip("prompt_gemini", "fuente/pantalla1.mp4", 22, 48, (575, 660, 990, 390), vel=4)
# clip("resultado", "fuente/pantalla1.mp4", 0, 0, (496, 118, 708, 946), still=70)
