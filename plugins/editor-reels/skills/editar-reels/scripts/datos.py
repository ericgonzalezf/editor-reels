"""PLANTILLA de datos. Copiar a videoN/trabajo/datos.py, ajustar N, FIX y ANCLAS, y correr desde videoN/.
Lee trabajo/palabras_corte.json (transcripción del corte ya acelerado) y trabajo/segmentos.json, y escribe
../remotion/src/vN/subs.json (frases de ≤3 palabras / 18 caracteres) y tiempos.json (frases, anclas, duración)."""
import json, os

N = 1  # número del video
FIX = {  # correcciones de Whisper: palabra transcrita -> palabra correcta (con su puntuación)
    "Cloud": "Claude", "ia": "IA", "ChatGPD": "ChatGPT",
}
# ancla: (palabra, frase donde buscarla desde su inicio). Sirven para sincronizar animaciones con lo que se dice.
ANCLAS = {
    # "gemini": ("gemini", 2),
}
QUITAR_FINAL = ("gracias", "suscríbete", "¡suscríbete!")  # alucinaciones de Whisper en el silencio final

W = json.load(open("trabajo/palabras_corte.json", encoding="utf-8"))
seg = json.load(open("trabajo/segmentos.json"))
frases = seg["frases"]
dur = round(frases[-1][1], 2)
words = []
for x in W:
    t = FIX.get(x["w"], x["w"])
    if x["s"] > dur - 0.2 or (x["s"] > frases[-1][0] and t.lower().strip(".,!") in QUITAR_FINAL):
        continue
    words.append({"t": t, "s": x["s"], "e": x["e"]})

FUNC = {"de", "tu", "tus", "a", "que", "y", "por", "para", "se", "en", "una", "la", "el", "los", "del", "no", "es", "con", "o", "un", "le", "te", "como", "e", "las", "mi", "lo"}
chunks = []; cur = []
for w in words:
    if cur:
        gap = w["s"] - cur[-1]["e"]; txt = " ".join(c["t"] for c in cur) + " " + w["t"]
        if gap > 0.4 or len(cur) >= 3 or len(txt) > 18:
            carry = []
            if gap <= 0.4:  # no dejar una palabra de función colgando al final del renglón
                while len(cur) > 1 and cur[-1]["t"].lower().strip(".,:") in FUNC: carry.insert(0, cur.pop())
            chunks.append(cur); cur = carry
    cur.append(w)
    if w["t"][-1] in ".,:?!":
        chunks.append(cur); cur = []
if cur: chunks.append(cur)
subs = []
for i, ch in enumerate(chunks):
    nxt = chunks[i + 1][0]["s"] if i + 1 < len(chunks) else 1e9
    subs.append({"start": ch[0]["s"], "end": min(ch[-1]["e"] + 0.1, nxt), "words": [{"t": c["t"], "s": c["s"]} for c in ch]})

def palabra(texto, desde):
    for w in words:
        if w["s"] >= desde - 0.05 and w["t"].lower().strip(".,:?¿!¡") == texto: return w["s"]
    raise SystemExit("no encontré el ancla: " + texto)

anclas = {k: palabra(v, frases[n - 1][0]) for k, (v, n) in ANCLAS.items()}
os.makedirs(f"../remotion/src/v{N}", exist_ok=True)
json.dump(subs, open(f"../remotion/src/v{N}/subs.json", "w", encoding="utf-8"), ensure_ascii=False)
json.dump({"frases": frases, "anclas": anclas, "duracion": dur}, open(f"../remotion/src/v{N}/tiempos.json", "w"))
print(len(subs), "subtítulos; duración", dur); print(anclas)
print(" | ".join(" ".join(c["t"] for c in ch) for ch in chunks))
