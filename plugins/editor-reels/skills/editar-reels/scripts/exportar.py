"""Vista previa o exportación final de una composición de Remotion.
Uso (desde la carpeta del proyecto):
  python "$SK/exportar.py" previa MiVideo 1        -> video1/trabajo/preview.mp4 (35 %, rápido)
  python "$SK/exportar.py" final MiVideo 1 2      -> video1/salida/video1_v2.mp4 + video1_v2_redes.mp4
La versión final pasa el audio por un limitador; la de redes es H.264 ≤ 4 Mb/s (pesa ~20 MB, la que se sube desde el celular).
Al final mide volumen (meta: -14 LUFS integrados, pico ≤ -1 dB) y peso."""
import os, subprocess, sys

modo, comp, n = sys.argv[1], sys.argv[2], sys.argv[3]
v = sys.argv[4] if len(sys.argv) > 4 else "1"
raiz = os.getcwd()
npx = "npx.cmd" if os.name == "nt" else "npx"
rem = os.path.join(raiz, "remotion")
if modo == "previa":
    out = os.path.join(raiz, f"video{n}", "trabajo", "preview.mp4")
    subprocess.run([npx, "remotion", "render", "src/index.ts", comp, out, "--scale=0.35", "--crf=24", "--concurrency=4", "--log=error"], cwd=rem, check=True)
    print("ok", out); sys.exit()

sal = os.path.join(raiz, f"video{n}", "salida"); os.makedirs(sal, exist_ok=True)
tmp = os.path.join(sal, "tmp.mp4")
final = os.path.join(sal, f"video{n}_v{v}.mp4")
redes = os.path.join(sal, f"video{n}_v{v}_redes.mp4")
subprocess.run([npx, "remotion", "render", "src/index.ts", comp, tmp, "--codec=h264", "--crf=16", "--concurrency=4", "--log=error"], cwd=rem, check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-c:v", "copy", "-af", "alimiter=limit=0.84:level=false", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", final], check=True)
os.remove(tmp)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", final, "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-crf", "19", "-maxrate", "4.0M", "-bufsize", "8M",
                "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-movflags", "+faststart", redes], check=True)
for f in (final, redes):
    print(os.path.basename(f), "%.1f MB" % (os.path.getsize(f) / 2**20))
err = subprocess.run(["ffmpeg", "-hide_banner", "-i", redes, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print("\n".join(l.strip() for l in err.splitlines()[-12:] if l.strip().startswith(("I:", "Peak:"))))
