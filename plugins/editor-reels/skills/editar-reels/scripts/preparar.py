"""Revisa que todo esté instalado y genera los efectos de sonido (sintetizados con ffmpeg, sin derechos de autor).
Uso (desde la carpeta del proyecto):  python "$SK/preparar.py""""
import os, shutil, subprocess, sys

ok = True
def revisa(nombre, cmd, ayuda):
    global ok
    try:
        subprocess.run(cmd, capture_output=True, check=True, shell=(os.name == "nt" and cmd[0] in ("npx", "node", "npm")))
        print("✓", nombre)
    except Exception:
        ok = False; print("✗", nombre, "→", ayuda)

revisa("ffmpeg", ["ffmpeg", "-version"], "Windows: winget install Gyan.FFmpeg · Mac: brew install ffmpeg")
revisa("Node.js", ["node", "--version"], "instala Node.js LTS desde nodejs.org")
try:
    import faster_whisper  # noqa: F401
    print("✓ faster-whisper")
except ImportError:
    ok = False; print("✗ faster-whisper → pip install faster-whisper")
if not os.path.isdir("remotion/node_modules"):
    ok = False; print("✗ Remotion → cd remotion && npm install")
else:
    print("✓ Remotion")

SFX = {  # nombre: (entradas lavfi, filtro)
    "whoosh": (["anoisesrc=d=0.6:c=pink:a=0.9:r=44100"], "highpass=f=250,lowpass=f=5500,afade=t=in:st=0:d=0.22,afade=t=out:st=0.2:d=0.4,volume=0.8,aecho=0.6:0.5:40:0.25"),
    "swish": (["anoisesrc=d=0.28:c=pink:a=0.9"], "highpass=f=900,lowpass=f=9000,afade=t=in:d=0.08,afade=t=out:st=0.08:d=0.2,volume=0.9"),
    "impacto": (["sine=f=55:d=0.45", "anoisesrc=d=0.12:c=brown:a=0.9"], "[0]volume=1.6,afade=t=out:st=0.02:d=0.42[a];[1]lowpass=f=400,afade=t=out:st=0:d=0.12[b];[a][b]amix=2,volume=1.2"),
    "pop": (["sine=f=900:d=0.09"], "afade=t=out:st=0.01:d=0.08,volume=0.6"),
    "ding": (["sine=f=1318:d=0.9", "sine=f=1975:d=0.9"], "[0][1]amix=2,afade=t=out:st=0.02:d=0.85,volume=0.8"),
    "click": (["anoisesrc=d=0.06:c=white:a=0.8:r=44100"], "highpass=f=1800,afade=t=out:st=0.005:d=0.05,volume=0.9"),
}
if shutil.which("ffmpeg"):
    os.makedirs("remotion/public/sfx", exist_ok=True)
    for n, (ins, fil) in SFX.items():
        cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        for i in ins: cmd += ["-f", "lavfi", "-i", i]
        cmd += (["-filter_complex", fil] if len(ins) > 1 else ["-af", fil]) + ["-ar", "44100", f"remotion/public/sfx/{n}.wav"]
        subprocess.run(cmd, check=True)
    print("✓ efectos de sonido en remotion/public/sfx/")
print("\nTodo listo." if ok else "\nInstala lo que falta (✗) y vuelve a correr este script.")
sys.exit(0 if ok else 1)
