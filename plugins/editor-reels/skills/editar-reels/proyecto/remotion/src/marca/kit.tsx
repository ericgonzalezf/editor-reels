import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {MARCA} from './marca';

// Kit de piezas para Reels verticales. Los colores, fuentes y el sitio salen de ./marca.ts (cámbialos ahí).
// Creado por Eric González · ericgonzalezf.com
// Capa fija: tokens, tiempos, cámara, subtítulos, sonido. Capa variable: el resto.
// Reglas de tiempo:
//   · GLOBAL (usa el frame del video): Camara, Subtitulos, Encabezado, Etiquetas. Van al nivel superior, NUNCA dentro de <S>/<Sequence>.
//   · LOCAL (empieza en 0): todo lo demás. Va dentro de <S de={…} a={…}>.

// ---------- Tokens ----------
export const FPS = 30;
export const C = {...MARCA.colores, ...MARCA.otras};
// Paleta secundaria: solo para objetos de ejemplo (un color por tema o paso). Tu acento sigue siendo el protagonista.
export const ACENTOS = {azul: '#3D8BFF', morado: '#8B5CF6', amarillo: '#FFC531', verde: '#22C55E', rosa: '#FF4F8B', cian: '#22D3EE'};
// Mezcla un color hex con blanco (k>0) o negro (k<0).
export const tono = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
};
// Relleno "plástico brillante" (botones, íconos, fichas): degradado, luz arriba, sombra abajo y resplandor.
export const brilloso = (hex: string, alto = 10): React.CSSProperties => ({
  background: `linear-gradient(180deg, ${tono(hex, 0.35)} 0%, ${hex} 55%, ${tono(hex, -0.25)} 100%)`,
  boxShadow: `inset 0 4px 0 rgba(255,255,255,0.35), inset 0 -6px 0 rgba(0,0,0,0.22), 0 ${alto}px 0 ${tono(hex, -0.45)}, 0 0 40px ${hex}66`,
});
// Degradado de tu acento (claro → acento → profundo) para titulares y botones.
export const DEGRADADO = `linear-gradient(90deg, ${tono(MARCA.colores.acento, 0.3)}, ${MARCA.colores.acento} 50%, ${tono(MARCA.colores.acento, -0.25)})`;
export const SANS = `${MARCA.fuentes.titulos.familia}, 'Segoe UI', Arial, sans-serif`;
export const MONO = `'${MARCA.fuentes.mono.familia}', Consolas, monospace`;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const suave = Easing.bezier(0.22, 1, 0.36, 1);
export const SITIO = MARCA.sitio.toUpperCase();
// color con transparencia: alfa('#C6F432', 0.4) -> rgba(198,244,50,0.4). Acepta también 'rgb(…)' (lo que da tono()).
export const alfa = (color: string, a: number) => {
  if (color.startsWith('rgb')) return `rgba(${color.slice(color.indexOf('(') + 1, color.indexOf(')')).split(',').slice(0, 3).join(',')},${a})`;
  const n = parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ---------- Tiempo ----------
export type Chunk = {start: number; end: number; words: {t: string; s: number}[]};
export type Tiempos = {frases: number[][]; anclas: Record<string, number>; duracion: number};
export const seg = (s: number) => Math.round(s * FPS);
export const tramo = (t: number, a: number, b: number, e = suave) => interpolate(t, [a, b], [0, 1], {...clamp, easing: e});
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const useT = () => useCurrentFrame() / FPS;
// entra en a (dura `ent`), sale en b (dura `sal`): 0 → 1 → 0
export const ventana = (t: number, a: number, b: number, ent = 0.5, sal = 0.5) => tramo(t, a - 0.05, a + ent) * (1 - tramo(t, b - 0.05, b + sal));
export const usarTiempos = (tiempos: Tiempos) => {
  const F = tiempos.frases;
  return {
    fr: (n: number) => ({ini: F[n - 1][0], fin: F[n - 1][1]}),
    A: tiempos.anclas,
    duracion: tiempos.duracion,
  };
};
export const useSpr = (delay = 0, config = {damping: 13, stiffness: 180}) => spring({frame: useCurrentFrame() - delay, fps: FPS, config});

// <S> = <Sequence> en segundos; omite tramos de menos de 2 frames.
export const S: React.FC<{de: number; a: number; children: React.ReactNode}> = ({de, a, children}) =>
  seg(a) - seg(de) < 2 ? null : <Sequence from={seg(de)} durationInFrames={seg(a) - seg(de)}>{children}</Sequence>;

// Efectos: whoosh/swish (transición), impacto (golpe de título), pop (aparición), ding (resultado), click (botón).
export type Efecto = 'whoosh' | 'swish' | 'impacto' | 'pop' | 'ding' | 'click';
export const Sfx: React.FC<{en: number; src: Efecto; vol?: number}> = ({en, src, vol = 0.3}) => (
  <Sequence from={Math.max(0, seg(en))} durationInFrames={30}>
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={vol} />
  </Sequence>
);

// ---------- Cámara (GLOBAL) ----------
// Pantalla completa con gradación de marca; en los tramos indicados se encoge a un formato y regresa.
//   burbuja: círculo de reacción · tarjeta: tarjeta inclinada · franja: baja y deja arriba un panel
export type ModoCamara = 'burbuja' | 'tarjeta' | 'franja';
export type TramoCamara = {ini: number; fin: number; modo: ModoCamara; color?: string};
const CAJA = {
  burbuja: {x: 60, y: 1235, w: 300, h: 300, k: 0.29, r: 150, rot: 0},
  tarjeta: {x: 40, y: 1330, w: 380, h: 500, k: 0.5, r: 30, rot: -3},
  franja: {x: 0, y: 600, w: 1080, h: 1920, k: 1, r: 0, rot: 0},
};
export const Camara: React.FC<{
  src: string; // '' = marcador de posición (para probar sin video)
  tramos?: TramoCamara[];
  cara?: {x: number; y: number}; // centro de la cara en el cuadro 1080x1920 (para encuadrar burbuja/tarjeta)
  golpes?: number[]; // segundos con zoom de énfasis (p. ej. el golpe del título)
}> = ({src, tramos = [], cara = {x: 540, y: 800}, golpes = []}) => {
  const t = useT();
  const actual = tramos.find((x) => t >= x.ini - 0.1 && t < x.fin + 0.55);
  const p = actual ? ventana(t, actual.ini, actual.fin) : 0;
  const caja = CAJA[actual?.modo ?? 'franja'];
  const franja = actual?.modo === 'franja';
  const golpe = golpes.reduce((g, s) => g * interpolate(t, [s, s + 0.07, s + 0.4], [1, 1.07, 1], clamp), 1);
  const w = lerp(1080, caja.w, p), h = lerp(1920, caja.h, p), k = lerp(1, caja.k, p);
  const ox = franja ? 0 : lerp(0, caja.w / 2 - cara.x * caja.k, p);
  const oy = franja ? 0 : lerp(0, caja.h / 2 - cara.y * caja.k, p);
  const borde = actual?.color ?? C.acento;
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(0, caja.x, p),
        top: lerp(0, caja.y, p),
        width: w,
        height: h,
        borderRadius: lerp(0, caja.r, p),
        overflow: 'hidden',
        transform: `rotate(${caja.rot * p}deg) scale(${golpe})`,
        boxShadow: !franja && p > 0.05 ? `0 0 0 ${6 * p}px ${borde}, 0 30px 60px rgba(0,0,0,${0.6 * p})` : undefined,
        zIndex: franja || p < 0.01 ? 0 : 5,
      }}
    >
      <div style={{position: 'absolute', left: ox, top: oy, width: 1080 * k, height: 1920 * k}}>
        <div style={{width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0'}}>
          <Gradacion>
            {src ? (
              <OffthreadVideo src={staticFile(src)} />
            ) : (
              <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.borde}, ${C.fondo})`, alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 40, letterSpacing: 6, color: C.apagado}}>TU CÁMARA AQUÍ</AbsoluteFill>
            )}
          </Gradacion>
        </div>
      </div>
    </div>
  );
};
// Gradación de marca: contraste + un toque cálido (MARCA.calidez) + viñeta.
export const Gradacion: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{filter: 'contrast(1.08) saturate(1.1) brightness(1.03)'}}>{children}</AbsoluteFill>
    <AbsoluteFill style={{background: MARCA.calidez, mixBlendMode: 'soft-light', opacity: 0.12}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.33) 100%)'}} />
  </AbsoluteFill>
);

// ---------- Subtítulos (GLOBAL) ----------
// Siempre palabra por palabra con la activa resaltada en el color de acento. Cambia la variante entre videos.
//   contorno · recuadro (palabra en caja) · subrayado · pildora (cápsula oscura)
export type VarianteSub = 'contorno' | 'recuadro' | 'subrayado' | 'pildora';
export type ZonaSub = {top: number; left?: number; right?: number; size?: number; claro?: boolean};
export const Subtitulos: React.FC<{chunks: Chunk[]; variante: VarianteSub; zona?: (t: number) => ZonaSub}> = ({chunks, variante, zona}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const chunk = chunks.find((c) => t >= c.start && t < c.end);
  if (!chunk) return null;
  const z = {left: 30, right: 30, size: 66, claro: false, ...(zona ? zona(t) : {top: 1500})};
  let activa = 0;
  chunk.words.forEach((w, i) => {
    if (t >= w.s) activa = i;
  });
  const e = spring({frame: frame - seg(chunk.start), fps, config: {damping: 15, stiffness: 260}});
  const contorno = (on: boolean): React.CSSProperties =>
    z.claro ? {color: on && variante !== 'subrayado' ? C.acento : C.tinta} : {color: on ? C.acento : '#fff', WebkitTextStroke: '10px #000', paintOrder: 'stroke fill', textShadow: '0 6px 14px rgba(0,0,0,0.5)'};
  const palabras = chunk.words.map((w, i) => {
    const on = i === activa;
    const pop = on ? spring({frame: frame - seg(w.s), fps, config: {damping: 12, stiffness: 280}}) : 0;
    const base: React.CSSProperties = {display: 'inline-block', position: 'relative', fontFamily: SANS, fontWeight: 900, fontSize: z.size, letterSpacing: -1, margin: '0 9px'};
    if (variante === 'recuadro')
      return (
        <span key={i} style={{...base, ...(on ? {color: C.tinta} : contorno(false)), fontWeight: 800, margin: '0 4px', padding: '2px 14px', borderRadius: 12, background: on ? C.acento : 'transparent', WebkitTextStroke: on || z.claro ? undefined : '9px #000'}}>
          {w.t}
        </span>
      );
    if (variante === 'pildora')
      return (
        <span key={i} style={{...base, fontWeight: 800, fontSize: z.size - 6, color: on ? C.acento : C.claro, transform: `translateY(${-5 * pop}px) scale(${1 + 0.06 * pop})`}}>
          {w.t}
        </span>
      );
    return (
      <span key={i} style={{...base, ...contorno(on), transform: variante === 'contorno' && on ? 'scale(1.07)' : undefined}}>
        {w.t}
        {variante === 'subrayado' && on && (
          <span style={{position: 'absolute', left: -4, right: -4, bottom: -6, height: 12, borderRadius: 6, background: C.acento, border: z.claro ? undefined : '3px solid #000', transform: `scaleX(${pop})`, transformOrigin: '0% 50%'}} />
        )}
      </span>
    );
  });
  const mov = {transform: `translateY(${(1 - e) * 24}px)`, opacity: e};
  return (
    <div style={{position: 'absolute', top: z.top, left: z.left, right: z.right, textAlign: 'center', zIndex: 6, ...mov}}>
      {variante === 'pildora' ? (
        <div style={{display: 'inline-block', padding: '14px 30px 18px', borderRadius: 999, background: alfa(C.tinta, 0.86), boxShadow: '0 14px 30px rgba(0,0,0,0.3)'}}>{palabras}</div>
      ) : (
        palabras
      )}
    </div>
  );
};

// ---------- Encabezado de marca (GLOBAL) ----------
// "● ETIQUETA" en mono + ERICGONZALEZF.COM o puntos de progreso. Entra en barrido con desenfoque.
export type Cabecera = {de: number; a: number; etiqueta: string; titulo?: string; paso?: number; total?: number};
export const Encabezado: React.FC<{items: Cabecera[]; claro?: boolean; top?: number}> = ({items, claro = true, top = 90}) => {
  const t = useT();
  const h = items.find((e) => t >= e.de && t < e.a);
  if (!h) return null;
  const entra = tramo(t, h.de, h.de + 0.3);
  const sale = tramo(t, h.a - 0.18, h.a, Easing.in(Easing.cubic));
  const blur = (1 - entra) * 16 + sale * 16;
  const tinta = claro ? C.tinta : C.claro;
  return (
    <div style={{position: 'absolute', top, left: 64, right: 64, zIndex: 4, transform: `translateX(${(1 - entra) * 500 - sale * 500}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, opacity: Math.min(1, entra * 2) * (1 - sale)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 7, color: tinta}}>
          <span style={{color: C.acento}}>● </span>
          {h.etiqueta}
        </span>
        {h.paso && h.total ? (
          <div style={{display: 'flex', gap: 10}}>
            {Array.from({length: h.total}, (_, i) => i + 1).map((i) => (
              <div key={i} style={{width: i === h.paso ? 54 : 18, height: 18, borderRadius: 9, background: i <= h.paso! ? C.acento : claro ? alfa(C.tinta, 0.15) : alfa(C.claro, 0.18)}} />
            ))}
          </div>
        ) : (
          <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: 4, color: claro ? C.borde : C.apagado}}>{SITIO}</span>
        )}
      </div>
      {h.titulo && <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 900, fontSize: 88, lineHeight: 1, letterSpacing: -4, color: tinta}}>{h.titulo}</div>}
    </div>
  );
};

// ---------- Fondos (LOCAL o al nivel superior con <S>) ----------
// claro: hoja clara (mejor legibilidad de pantallas) · puntos: claro con retícula · aurora: claro con luz que se mueve
// arena: oscuro con brillos de color y líneas diagonales · oscuro: negro de marca
export const Fondo: React.FC<{tipo: 'claro' | 'puntos' | 'aurora' | 'arena' | 'oscuro'; colores?: string[]}> = ({tipo, colores = [C.acento]}) => {
  const f = useCurrentFrame();
  if (tipo === 'arena' || tipo === 'oscuro')
    return (
      <AbsoluteFill style={{background: C.fondo}}>
        {tipo === 'arena' &&
          colores.map((c, i) => (
            <AbsoluteFill key={i} style={{background: `radial-gradient(ellipse at ${colores.length === 1 ? 50 : 15 + (70 * i) / (colores.length - 1)}% 30%, ${c}73 0%, ${c}00 60%)`}} />
          ))}
        {tipo === 'arena' && (
          <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 60px)', backgroundPosition: `${f * 2}px 0px`}} />
        )}
      </AbsoluteFill>
    );
  const mancha = (x: number, y: number, r: number, c: string, k: number) => (
    <div style={{position: 'absolute', left: x + Math.sin(f / 50 + k) * 90 - r, top: y + Math.cos(f / 60 + k) * 70 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: c, filter: 'blur(90px)'}} />
  );
  return (
    <AbsoluteFill style={{background: C.claro, overflow: 'hidden', backgroundImage: tipo === 'puntos' ? `radial-gradient(${alfa(C.tinta, 0.1)} 2.2px, transparent 2.4px)` : undefined, backgroundSize: '38px 38px'}}>
      {tipo === 'aurora' ? (
        <>
          {mancha(180, 260, 340, alfa(C.acento, 0.45), 0)}
          {mancha(920, 760, 300, alfa(C.acento, 0.35), 2)}
          {mancha(300, 1500, 360, alfa(C.acento, 0.3), 4)}
        </>
      ) : (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 80% 0%, ${alfa(C.acento, 0.22)} 0%, ${alfa(C.acento, 0)} 55%)`}} />
      )}
    </AbsoluteFill>
  );
};

// Hoja que sube desde abajo y baja al salir (LOCAL; envuelve un fondo). dur = frames del tramo.
export const Hoja: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const frame = useCurrentFrame();
  const sube = spring({frame, fps: FPS, config: {damping: 16, stiffness: 120}});
  const baja = interpolate(frame, [dur - 8, dur], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: `translateY(${interpolate(sube, [0, 1], [1920, 0]) + baja * 1920}px)`, borderRadius: interpolate(sube, [0, 1], [80, 0]), overflow: 'hidden'}}>
      {children}
    </AbsoluteFill>
  );
};

// ---------- Texto ----------
export const blanco: React.CSSProperties = {fontFamily: SANS, fontWeight: 900, color: '#fff', WebkitTextStroke: '12px #000', paintOrder: 'stroke fill', letterSpacing: -4};

// Golpe de título del gancho (LOCAL): línea blanca con contorno + segunda línea en chip de acento o en color de acento.
export const TituloGolpe: React.FC<{linea1: string; linea2?: string; chip?: boolean; top?: number; size?: number}> = ({linea1, linea2, chip = true, top = 80, size = 110}) => {
  const frame = useCurrentFrame();
  const l1 = spring({frame: frame - 2, fps: FPS, config: {damping: 12, stiffness: 200}});
  const l2 = spring({frame: frame - 9, fps: FPS, config: {damping: 9, stiffness: 230}});
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{...blanco, fontSize: size, lineHeight: 1, transform: `translateY(${(1 - l1) * -80}px)`, opacity: l1}}>{linea1}</div>
      {linea2 &&
        (chip ? (
          <div style={{display: 'inline-block', marginTop: 12, padding: '4px 34px 12px', background: C.acento, border: '6px solid #000', borderRadius: 22, boxShadow: '10px 10px 0 #000', fontFamily: SANS, fontWeight: 900, fontSize: size * 0.8, letterSpacing: -3, color: C.tinta, transform: `scale(${interpolate(l2, [0, 1], [1.8, 1])}) rotate(-3deg)`, opacity: interpolate(l2, [0, 0.2], [0, 1], clamp)}}>
            {linea2}
          </div>
        ) : (
          <div style={{...blanco, fontSize: size, lineHeight: 1, color: C.acento, transform: `scale(${interpolate(l2, [0, 1], [1.5, 1])})`, opacity: l2}}>{linea2}</div>
        ))}
    </div>
  );
};

// Sticker inclinado con sombra dura (LOCAL).
export const Sticker: React.FC<{texto: string; rot?: number; delay?: number; size?: number}> = ({texto, rot = -4, delay = 0, size = 46}) => {
  const s = useSpr(delay, {damping: 8, stiffness: 200});
  return (
    <div style={{display: 'inline-block', background: C.acento, color: C.tinta, fontFamily: SANS, fontWeight: 900, fontSize: size, padding: '12px 26px', borderRadius: 16, border: `5px solid ${C.tinta}`, boxShadow: `8px 8px 0 ${C.tinta}`, transform: `scale(${interpolate(s, [0, 1], [0.3, 1])}) rotate(${rot + (1 - s) * 25}deg)`, whiteSpace: 'nowrap'}}>
      {texto}
    </div>
  );
};

// Etiquetas de palabras clave que aparecen cuando se dicen (GLOBAL; t = segundos del video).
export const Etiquetas: React.FC<{items: {t: number; txt: string}[]; hasta: number; top: number; claro?: boolean}> = ({items, hasta, top, claro = true}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t >= hasta + 0.4) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top, display: 'flex', flexWrap: 'wrap', gap: 12, zIndex: 3, opacity: 1 - tramo(t, hasta, hasta + 0.4)}}>
      {items.map((e, i) =>
        t < e.t ? null : (
          <span key={i} style={{padding: '8px 18px', borderRadius: 999, background: i % 2 ? (claro ? C.tinta : C.tarjeta) : C.acento, border: !claro && i % 2 ? `2px solid ${C.borde}` : undefined, color: i % 2 ? C.claro : C.tinta, fontFamily: SANS, fontWeight: 800, fontSize: 28, transform: `scale(${spring({frame: frame - seg(e.t), fps: FPS, config: {damping: 10, stiffness: 220}})})`}}>
            {e.txt}
          </span>
        ),
      )}
    </div>
  );
};

// Texto que se escribe solo. inicio = frame local; 1 letra cada `cada` frames.
export const useTecleo = (txt: string, inicio: number, cada = 2) => {
  const n = Math.max(0, Math.min(txt.length, Math.floor((useCurrentFrame() - inicio) / cada)));
  return {texto: txt.slice(0, n), listo: n >= txt.length, finFrame: inicio + txt.length * cada};
};
export const Cursor: React.FC<{car?: string}> = ({car = '|'}) => <span style={{color: C.acento, opacity: useCurrentFrame() % 16 < 8 ? 1 : 0}}>{car}</span>;

// ---------- Pantalla ----------
// Ventana con barra superior y un clip de la grabación (LOCAL). Los clips se exportan a 1000 px de ancho (scripts/clips.py).
export const Ventana: React.FC<{x?: number; y?: number; w?: number; h?: number; titulo?: string; claro?: boolean; children: React.ReactNode}> = ({x = 70, y = 440, w = 940, h = 960, titulo = '', claro = true, children}) => {
  const s = useSpr(0, {damping: 15, stiffness: 120});
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, perspective: 1400}}>
      <div style={{width: '100%', height: '100%', borderRadius: 36, background: '#1F1E1C', overflow: 'hidden', boxShadow: `0 40px 80px ${alfa(C.tinta, claro ? 0.35 : 0.6)}, 0 0 0 3px ${C.borde}`, transform: `translateY(${interpolate(s, [0, 1], [180, 0])}px) rotateX(${interpolate(s, [0, 1], [24, 0])}deg)`, transformOrigin: '50% 100%', opacity: interpolate(s, [0, 0.3], [0, 1], clamp)}}>
        <div style={{height: 56, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 26, background: C.tarjeta, borderBottom: `2px solid ${C.borde}`}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
          ))}
          <span style={{marginLeft: 18, fontFamily: SANS, fontWeight: 600, fontSize: 26, color: '#CFC8BD'}}>{titulo}</span>
        </div>
        <div style={{position: 'relative', height: h - 56, overflow: 'hidden'}}>{children}</div>
      </div>
    </div>
  );
};
// Clip con zoom lento. ancho = ancho de la ventana; base = zoom inicial; origen = punto que se mantiene fijo.
export const Clip: React.FC<{src: string; ancho?: number; base?: number; zoom?: number; origen?: string; desde?: number; children?: React.ReactNode}> = ({src, ancho = 940, base = 1, zoom = 1.06, origen = '50% 30%', desde = 0, children}) => {
  const z = base * interpolate(useCurrentFrame(), [0, 150], [1, zoom], clamp);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'relative', width: ancho, transform: `scale(${z})`, transformOrigin: origen}}>
        <OffthreadVideo src={staticFile(src)} startFrom={seg(desde)} style={{width: ancho}} muted />
        {children}
      </div>
    </div>
  );
};
// Onda de clic (LOCAL; aparece en el frame 0 de su Sequence). Acompañar con <Sfx src="click" />.
export const Clic: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 18], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  if (frame > 20) return null;
  return (
    <>
      <div style={{position: 'absolute', left: x - 70, top: y - 70, width: 140, height: 140, borderRadius: '50%', border: `7px solid ${C.acento}`, opacity: 1 - p, transform: `scale(${0.35 + p * 1.1})`}} />
      <div style={{position: 'absolute', left: x - 28, top: y - 28, width: 56, height: 56, borderRadius: '50%', background: alfa(C.acento, 0.35), border: '3px solid #fff', opacity: 1 - p}} />
    </>
  );
};

// Antes / después con deslizador (LOCAL). dur en segundos.
export const AntesDespues: React.FC<{antes: string; despues: string; w: number; h: number; dur: number}> = ({antes, despues, w, h, dur}) => {
  const t = useCurrentFrame() / FPS;
  const p = interpolate(t, [0.25, dur - 0.35], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const corte = w * p;
  const etiqueta = (txt: string, lado: 'left' | 'right', o: number) => (
    <div style={{position: 'absolute', top: 24, [lado]: 24, padding: '8px 18px', borderRadius: 10, background: lado === 'left' ? 'rgba(14,11,9,0.85)' : C.acento, color: lado === 'left' ? C.claro : C.tinta, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 4, opacity: o}}>{txt}</div>
  );
  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}>
        <Img src={staticFile(despues)} style={{position: 'absolute', inset: 0, width: w, height: h, objectFit: 'cover'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: corte, height: h, overflow: 'hidden'}}>
          <Img src={staticFile(antes)} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover'}} />
        </div>
        {etiqueta('ANTES', 'left', interpolate(p, [0.15, 0.4], [0, 1], clamp))}
        {etiqueta('DESPUÉS', 'right', interpolate(p, [0.6, 0.85], [1, 0], clamp))}
      </div>
      <div style={{position: 'absolute', left: corte - 3, top: -10, width: 6, height: h + 20, borderRadius: 3, background: C.acento, boxShadow: `0 0 20px ${alfa(C.acento, 0.8)}`}} />
      <div style={{position: 'absolute', left: corte - 34, top: h / 2 - 34, width: 68, height: 68, borderRadius: 34, background: C.acento, border: `5px solid ${C.tinta}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, color: C.tinta}}>‹›</div>
    </div>
  );
};

// ---------- Transiciones (LOCAL, duran ~0.4 s) ----------
export const Flash: React.FC<{fuerza?: number}> = ({fuerza = 0.75}) => (
  <AbsoluteFill style={{background: '#fff', opacity: interpolate(useCurrentFrame(), [0, 2, 11], [0, 1, 0], clamp) * fuerza}} />
);
export const DestelloLuz: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 70% 30%, ${alfa(C.acento, 0.9)} 0%, ${alfa(C.acento, 0)} 60%)`, mixBlendMode: 'screen', opacity: interpolate(useCurrentFrame(), [0, 4, 12], [0, 1, 0], clamp) * 0.7}} />
);

// ---------- Cierre (LOCAL) ----------
// Botón de seguir que se pulsa en `tap` (frame local): "+ texto" → "✓ Siguiendo". Acompañar con <Sfx src="click" />.
export const BotonSeguir: React.FC<{texto?: string; tap: number; top?: number}> = ({texto = '+ Sígueme', tap, top = 150}) => {
  const frame = useCurrentFrame();
  const s = useSpr(0, {damping: 11, stiffness: 170});
  const pres = spring({frame: frame - tap, fps: FPS, config: {damping: 10, stiffness: 260}});
  const ok = frame > tap + 3;
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top, padding: '22px 60px', borderRadius: 60, background: ok ? '#fff' : C.acento, border: `5px solid ${C.tinta}`, boxShadow: `0 10px 0 ${C.tinta}`, fontFamily: SANS, fontWeight: 900, fontSize: 58, color: C.tinta, transform: `scale(${s * (1 - 0.08 * Math.sin(Math.min(1, pres) * Math.PI))})`}}>
        {ok ? '✓ Siguiendo' : texto}
      </div>
    </AbsoluteFill>
  );
};
// Comentario que se escribe solo (palabra clave para CTA o pregunta para debate). inicio = frame local.
export const ComentarioTecleado: React.FC<{texto: string; inicio: number; arriba?: string; top?: number}> = ({texto, inicio, arriba = 'tú · ahora', top = 110}) => {
  const s = useSpr(0, {damping: 13, stiffness: 150});
  const {texto: escrito} = useTecleo(texto, inicio);
  return (
    <div style={{position: 'absolute', top, left: 70, right: 70, borderRadius: 34, background: '#fff', padding: '26px 32px', display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 24px 50px rgba(0,0,0,0.35)', transform: `translateX(${interpolate(s, [0, 1], [-900, 0])}px) rotate(${(1 - s) * -8}deg)`}}>
      <div style={{width: 92, height: 92, flexShrink: 0, borderRadius: 46, background: `linear-gradient(135deg, ${C.acento}, ${C.claro})`}} />
      <div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, color: '#8a8378'}}>{arriba}</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: C.tinta, lineHeight: 1.1}}>
          {escrito}
          <Cursor />
        </div>
      </div>
    </div>
  );
};

export {FuentesMarca} from './Fuentes';
