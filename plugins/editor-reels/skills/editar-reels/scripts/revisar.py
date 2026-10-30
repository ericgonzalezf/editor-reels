"""Hoja de revisión: cuadros cada PASO segundos con su tiempo impreso, en una sola imagen para mirar de un vistazo.
Uso:  python "$SK/revisar.py" video1/trabajo/preview.mp4 video1/trabajo/hoja.png [paso=1.5] [columnas=10]
Sirve para: auditoría final, buscar el espejo, revisar privacidad en grabaciones de pantalla y elegir recortes."""
import subprocess, sys

src, out = sys.argv[1], sys.argv[2]
paso = float(sys.argv[3]) if len(sys.argv) > 3 else 1.5
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 10
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout)
filas = int(dur / paso) // cols + 1
fuente = "fontfile='C\\:/Windows/Fonts/arialbd.ttf':" if sys.platform == "win32" else ""
vf = (f"fps=1/{paso},scale=200:-1,drawtext={fuente}text='%{{pts\\:hms}}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7,"
      f"tile={cols}x{filas}")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf", vf, "-frames:v", "1", out], check=True)
print("ok", out, "(%.1f s, %d cuadros)" % (dur, int(dur / paso) + 1))
