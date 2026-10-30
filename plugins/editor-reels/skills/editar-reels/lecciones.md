# Lecciones (lo que ya salió mal una vez)

## Toma y corte
- **Espejo:** algunas tomas vienen invertidas. Revisa siempre texto, logos o el bolsillo de la camisa.
- **Palabras cortadas:** pasó con palabras como "estilizada". Los bordes deben caer en silencio real; si dos frases van
  pegadas usa `exacto` y revisa a mano. Confirma con la transcripción del corte que cada frase termina completa.
- **Cierre acelerado:** un "sígueme" final dicho rápido + 1.1× suena acelerado: ese tramo va a `vel` 0.85–1.0 con `respiro`.
- **Atropellado:** si una frase sale muy rápida o con titubeos, no la fuerces: sugiere regrabar solo esa frase.
  Se puede usar solo el audio de la regrabación si cambió la ropa.
- **Error de contenido en la toma** (decir una palabra por otra): avisa y propone regrabar o recortar.
- **Whisper:** escribe "Cloud" por Claude, "ChatGPD", quita acentos ("Escribanme") y alucina "Gracias por ver" /
  "¡Suscríbete!" en silencios finales. Corrige en `FIX`; `datos.py` descarta las alucinaciones finales.

## Contenido
- **Pasos de interfaz falsos:** los guiones escritos con IA a veces traen botones que no existen ("Output",
  "Export"). Antes de animar un paso, compruébalo en la grabación real y usa los nombres tal como salen en la app.
- **Ejemplos que no aplican:** un ejemplo que no se parece a lo que hace la audiencia (p. ej. precios) confunde; usa ejemplos neutrales.
- **CTA sin automatización:** no prometer "comenta X y te mando…" si no hay automatización de DM funcionando.
- **Copia de referencias:** las referencias de otros creadores son solo para ritmo/efectos; siempre con la marca
  del usuario, nunca su paleta.
- **Lo genérico se nota:** un ejemplo genérico no convence. Usa ejemplos realistas y concretos, o mejor,
  el resultado real que generó el usuario.

## Formato animado
- **Lo plano se ve básico:** tarjetas planas que solo aparecen y desaparecen no convencen. Desde la primera versión usa cámara
  virtual con transiciones, profundidad (piso, partículas, grano), tarjetas de vidrio con destello y titulares animados.
- **El hilo va detrás de las tarjetas** y las rodea; solo pasa encima para tachar. Si cruza una tarjeta se ve sucio.
- **Nada de imitar marcas:** ni logos, ni mascotas, ni símbolos de otras empresas (sus reglas lo prohíben y sugiere afiliación).
- **Datos verificados:** si escribes el guion, comprueba en la web planes, precios y nombres antes de animarlos.

## Privacidad
- Desenfoca barra lateral (fijados/recientes), galerías de proyectos, correos y prompts privados.
- Omite tramos con explorador de archivos (archivos de clientes, códigos de respaldo), documentos de planeación
  (Google Docs) y paneles de compartir con correo.

## Remotion
- Los componentes que usan tiempo GLOBAL no van dentro de `<Sequence>`/`<S>`: el frame se reinicia y salen desfasados.
- Dentro de `<S>` todo es LOCAL: convierte con `seg(A.palabra - fr(n).ini)`.
- Si la cámara es tarjeta/burbuja, necesita `zIndex` mayor que los paneles (el kit ya lo pone en 5; subtítulos en 6).
- Los clips de pantalla llevan 6 s de cuadro congelado al final (`tpad`) para no quedarse en negro.
- `<FuentesMarca />` en cada composición nueva, si no sale con la fuente del sistema.
- Render: `--concurrency=4`; la previa a `--scale=0.35` tarda poco y basta para revisar tiempos.

## Entrega
- Muchos creadores revisan y publican desde el celular: entrega la versión `_redes` (≈20 MB).
- Se publica como Reel.
