"""Transcribe palabra por palabra con faster-whisper (medium, CPU).
Uso (desde videoN/):  python "$SK/transcribir.py" trabajo/audio.wav trabajo/palabras.json "Claude, Gemini, ChatGPT"
El tercer argumento (opcional) son nombres propios del video: mejora la ortografía (Whisper escribe "Cloud" por Claude).
Al final imprime el texto por bloques con tiempos, para elegir los tramos del corte."""
import json, sys, wave
import numpy as np
from faster_whisper import WhisperModel

wav, salida = sys.argv[1], sys.argv[2]
nombres = sys.argv[3] if len(sys.argv) > 3 else ""
m = WhisperModel("medium", device="cpu", compute_type="int8")
wf = wave.open(wav)
audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
segs, _ = m.transcribe(audio, language="es", word_timestamps=True, vad_filter=False, condition_on_previous_text=False,
                       no_speech_threshold=0.9, log_prob_threshold=-2.0, initial_prompt=nombres or None)
out = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in s.words]
json.dump(out, open(salida, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(out), "palabras")
linea, prev, t0 = "", 0.0, 0.0
for x in out:
    if x["s"] - prev > 1.0 and linea:
        print("[%6.1f-%6.1f] %s" % (t0, prev, linea)); linea, t0 = "", x["s"]
    if not linea: t0 = x["s"]
    linea += x["w"] + " "; prev = x["e"]
if linea: print("[%6.1f-%6.1f] %s" % (t0, prev, linea))
