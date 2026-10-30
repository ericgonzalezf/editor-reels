"""PLANTILLA de corte. Copiar a videoN/trabajo/corte.py, llenar FUENTES y TRAMOS, y correr desde videoN/:
    python trabajo/corte.py
    ffmpeg -y -loglevel error -stats <-i por cada fuente> -/filter_complex trabajo/filtro.txt -map "[vout]" -map "[aout]" \
        -c:v libx264 -preset medium -crf 15 -c:a aac -b:a 192k -movflags +faststart trabajo/corte.mp4
Cada tramo es una "frase" del reel (frase 1 = gancho). Los bordes se llevan al silencio real más cercano para no
cortar palabras, se quitan silencios internos > INNER_MAX y se aplica un zoom lento alterno por segmento."""
import re, subprocess, json

# Fuentes: archivo, audio extraído (16 kHz mono) y si viene EN ESPEJO (revisar texto/logos en la ropa).
# recorte: filtro previo si la toma no es vertical, p. ej. "crop=1215:2160:1250:0" para 3840x2160.
FUENTES = [
    {"video": "fuente/toma.mp4", "audio": "trabajo/audio.wav", "espejo": False, "recorte": ""},
]
VEL = 1.1        # ritmo de reel (1.0 si va con guión y ritmo bueno; 1.1 en tomas sin guión)
PAD = 0.16; INNER_MAX = 0.4
ALTO_CARA = 0.4  # 0 = recorta arriba, 0.5 = centro; subir si la cara queda muy arriba
# (inicio, fin [, opciones]) en segundos de la toma original. Opciones (dict):
#   fuente: índice en FUENTES · exacto: True no mueve los bordes (para frases pegadas) · vel: velocidad propia
#   (0.85-1.0 si la dijo muy rápido) · respiro: True agrega 0.25 s de silencio antes (útil en el cierre)
TRAMOS = [
    (0.0, 3.0),                                  # 1  gancho
    # (10.2, 14.6),                              # 2  ...
    # (241.4, 243.1, {"exacto": True, "vel": 1.0, "respiro": True}),  # cierre
]


def silencios(wav):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", "silencedetect=noise=-38dB:d=0.3", "-f", "null", "-"], capture_output=True, text=True).stderr
    return list(zip([float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)], [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]))


SIL = [silencios(f["audio"]) for f in FUENTES]
keep = []; frases = []; T = 0
for i, tr in enumerate(TRAMOS):
    a, b = tr[0], tr[1]
    op = tr[2] if len(tr) > 2 else {}
    src = op.get("fuente", 0); sil = SIL[src]
    exacto = op.get("exacto", False); vel = op.get("vel", VEL)
    if not exacto:
        antes = [e for s_, e in sil if a - 1.5 <= e <= a + 0.25]
        a = (max(antes) - PAD) if antes else a
        for s_, e in sil:
            if s_ <= a + PAD < e: a = e - PAD
        despues = [s_ for s_, e in sil if b - 0.25 <= s_ <= b + 1.5]
        b = (min(despues) + PAD) if despues else b
    a = max(0.0, a)
    if i == len(TRAMOS) - 1: b += 0.5
    cuts = [(s + PAD, e - PAD) for s, e in sil if s > a and e < b and e - s > INNER_MAX]
    if op.get("respiro"):
        keep.append((src, round(max(0, a - 0.4), 3), round(max(0.25, a - 0.15), 3), 1.0)); T += 0.25
    t = a; t0 = T
    for c0, c1 in sorted(cuts):
        keep.append((src, round(t, 3), round(c0, 3), vel)); T += (c0 - t) / vel; t = c1
    keep.append((src, round(t, 3), round(b, 3), vel)); T += (b - t) / vel
    frases.append((round(t0, 3), round(T, 3)))
json.dump({"segmentos": keep, "frases": frases}, open("trabajo/segmentos.json", "w"))
print(len(keep), "segmentos, %.1f s" % T)
for i, f in enumerate(frases, 1):
    print(i, f, "%.1f s" % (f[1] - f[0]))

F = 0.03; v = a_ = cat = ""
for i, (src, s, e, vl) in enumerate(keep):
    d = e - s; z0, z1 = (1.04, 1.07) if i % 2 == 0 else (1.10, 1.06)
    Z = f"({z0}+({z1 - z0:.3f})*t/{d:.3f})"
    fu = FUENTES[src]
    pre = (fu["recorte"] + "," if fu["recorte"] else "") + ("hflip," if fu["espejo"] else "")
    v += (f"[{src}:v:0]trim={s}:{e},setpts=(PTS-STARTPTS)/{vl},{pre}"
          f"scale=w='trunc(1080*{Z}/2)*2':h='trunc(1920*{Z}/2)*2':eval=frame:flags=lanczos,"
          f"crop=1080:1920:x='(iw-1080)/2':y='(ih-1920)*{ALTO_CARA}',setsar=1[v{i}];")
    a_ += f"[{src}:a:0]atrim={s}:{e},asetpts=PTS-STARTPTS,afade=t=in:d={F},afade=t=out:st={d - F:.3f}:d={F},atempo={vl}[a{i}];"
    cat += f"[v{i}][a{i}]"
open("trabajo/filtro.txt", "w").write(v + a_ + cat + f"concat=n={len(keep)}:v=1:a=1[vc][ac];[vc]fps=30,format=yuv420p[vout];[ac]loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
print("ffmpeg -y " + " ".join(f'-i {f["video"]}' for f in FUENTES) + ' -/filter_complex trabajo/filtro.txt -map "[vout]" -map "[aout]" -c:v libx264 -preset medium -crf 15 -c:a aac -b:a 192k -movflags +faststart trabajo/corte.mp4')
