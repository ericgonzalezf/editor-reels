import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame} from 'remotion';
import {ACENTOS as V, C, FPS, MONO, SANS, alfa, clamp, seg, suave, tono, tramo, useT} from './kit';

// Piezas del formato "animación sin cámara" (solo voz en off): cada escena es un PLANO con cámara virtual y un HILO de luz
// que viaja de escena en escena rodeando lo importante.
// Capas de una composición: <Mundo> (fondo con profundidad) → <HiloCapa encima={false}> → <Plano> por escena
// (cámara virtual: empuje + transición zoom/barrido/giro con desenfoque de movimiento) → <HiloCapa encima> →
// Encabezado/Subtitulos del kit → <Grano>. Cada video define sus PLANOS, TRAMOS (uno por plano) y GOLPES (sacudidas);
// el tramo del hilo de cada plano se mueve con su misma cámara. Ejemplo completo: src/MuestraAnimada.tsx.
// Tiempos: Plano, HiloCapa y Mundo son GLOBALES (nivel superior); el resto es LOCAL (dentro de un Plano).

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const useAp = (en: number, cfg = {damping: 12, stiffness: 190}) => spring({frame: useCurrentFrame() - seg(en), fps: FPS, config: cfg});

export type Trans = 'ninguna' | 'zoom' | 'barrido' | 'giro';
export type PlanoDef = {ini: number; fin: number; ent: Trans};

export const SALIDA = 0.3;
export const FONDO = '#0B0D11';

export const camara = (planos: PlanoDef[], i: number, t: number) => {
  const p = planos[i], sig = planos[i + 1];
  const e = p.ent === 'ninguna' ? 1 : tramo(t, p.ini, p.ini + 0.42, Easing.out(Easing.cubic));
  const x = sig ? tramo(t, p.fin, p.fin + SALIDA, Easing.in(Easing.cubic)) : 0;
  let s = 1 + 0.028 * Math.max(0, t - p.ini), tx = 0, ry = 0, bx = 0, b = 0, op = 1;
  if (p.ent === 'zoom') { s *= lerp(0.55, 1, e); b += (1 - e) * 26; op *= Math.min(1, e * 2.2); }
  if (p.ent === 'barrido') { tx += (1 - e) * 1250; bx += (1 - e) * 80; }
  if (p.ent === 'giro') { ry += (1 - e) * -80; b += (1 - e) * 8; op *= Math.min(1, e * 2); }
  if (sig?.ent === 'zoom') { s *= lerp(1, 1.8, x); b += x * 26; op *= 1 - x; }
  if (sig?.ent === 'barrido') { tx -= x * 1250; bx += x * 80; }
  if (sig?.ent === 'giro') { ry += x * 80; op *= 1 - x * 0.9; }
  return {transform: `perspective(1800px) translateX(${tx}px) rotateY(${ry}deg) scale(${s})`, bx: bx + b, by: b, op};
};
export const vivo = (planos: PlanoDef[], i: number, t: number) => t >= planos[i].ini - 0.02 && t < planos[i].fin + SALIDA + 0.02;

export const sacudida = (golpes: number[], t: number) =>
  golpes.reduce(
    (acc, g) => {
      const d = t - g;
      if (d < 0 || d > 0.45) return acc;
      const k = (1 - d / 0.45) ** 2 * 16;
      return [acc[0] + Math.sin(d * 90) * k, acc[1] + Math.cos(d * 77) * k * 0.7];
    },
    [0, 0],
  );

// Contenedor de un plano: cámara + desenfoque de movimiento (filtro SVG direccional).
export const Plano: React.FC<{planos: PlanoDef[]; i: number; children: React.ReactNode}> = ({planos, i, children}) => {
  const t = useT();
  if (!vivo(planos, i, t)) return null;
  const c = camara(planos, i, t);
  return (
    <AbsoluteFill style={{zIndex: 3}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`mb${i}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={`${c.bx.toFixed(1)} ${c.by.toFixed(1)}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: c.transform, opacity: c.op, filter: c.bx > 0.4 ? `url(#mb${i})` : undefined}}>
        <Sequence from={seg(planos[i].ini)} layout="none">
          {children}
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export type P = [number, number];
export const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const acumulado = (pts: P[]) => pts.reduce<number[]>((acc, p, i) => [...acc, i ? acc[i - 1] + dist(pts[i - 1], p) : 0], []);
export const puntoEn = (pts: P[], L: number[], l: number): P => {
  const i = Math.max(1, L.findIndex((x) => x >= l));
  const k = (l - L[i - 1]) / Math.max(0.001, L[i] - L[i - 1]);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
};
export const tramoDe = (pts: P[], L: number[], a: number, b: number): P[] =>
  b <= a ? [] : [puntoEn(pts, L, a), ...pts.filter((_, i) => L[i] > a && L[i] < b), puntoEn(pts, L, b)];
export const arco = (cx: number, cy: number, r: number, a0: number, a1: number, n = 40): P[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as P;
  });

// Un tramo por plano (mismo índice). k = [segundo, índice de punto que alcanza la punta]; encima = tacha sobre las tarjetas.
export type Tramo = {pts: P[]; k: [number, number][]; encima?: boolean};

export const cabezaDe = (tr: Tramo, L: number[], t: number) => interpolate(t, tr.k.map((x) => x[0]), tr.k.map((x) => L[x[1]]), {...clamp, easing: suave});

export const HiloCapa: React.FC<{tramos: Tramo[]; planos: PlanoDef[]; encima: boolean}> = ({tramos, planos, encima}) => {
  const t = useT();
  return (
    <>
      {tramos.map((tr, i) => {
        if (!!tr.encima !== encima || !vivo(planos, i, t) || t < tr.k[0][0]) return null;
        const L = acumulado(tr.pts);
        const fin = planos[i].fin;
        const cola = tramo(t, fin, fin + SALIDA, Easing.in(Easing.cubic)) * L[L.length - 1];
        const pts = tramoDe(tr.pts, L, cola, cabezaDe(tr, L, t));
        if (pts.length < 2) return null;
        const d = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
        const tip = pts[pts.length - 1];
        const corre = t < tr.k[tr.k.length - 1][0] + 0.05;
        const c = camara(planos, i, t);
        return (
          <AbsoluteFill key={i} style={{zIndex: encima ? 4 : 2, transform: c.transform, opacity: c.op}}>
            <svg width={1080} height={1920} style={{overflow: 'visible'}}>
              <defs>
                <filter id={`h${i}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="12" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id={`f${i}`}>
                  <stop offset="0%" stopColor={tono(C.acento, 0.9)} stopOpacity="1" />
                  <stop offset="35%" stopColor={tono(C.acento, 0.35)} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={C.acento} stopOpacity="0" />
                </radialGradient>
              </defs>
              <g filter={`url(#h${i})`}>
                <path d={d} stroke={C.acento} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} stroke={tono(C.acento, 0.75)} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {cola < 1 && (
                <>
                  <circle cx={tip[0]} cy={tip[1]} r={corre ? 70 : 42} fill={`url(#f${i})`} />
                  {corre && <rect x={tip[0] - 110} y={tip[1] - 1.5} width={220} height={3} fill={tono(C.acento, 0.75)} opacity={0.55} />}
                  <circle cx={tip[0]} cy={tip[1]} r={corre ? 11 : 8} fill="#FFFFFF" />
                </>
              )}
            </svg>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// Punta actual del hilo en pantalla (para la luz del fondo).
export const puntaHilo = (tramos: Tramo[], planos: PlanoDef[], t: number): P => {
  const i = Math.max(0, planos.findIndex((p) => t >= p.ini && t < p.fin));
  const tr = tramos[i];
  const L = acumulado(tr.pts);
  return puntoEn(tr.pts, L, cabezaDe(tr, L, t));
};

// ---------- Mundo: fondo con profundidad ----------
export const Mundo: React.FC<{punta: (t: number) => P}> = ({punta}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const [x, y] = punta(t);
  return (
    <AbsoluteFill style={{background: FONDO, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #1A1F2B 0%, #0B0D11 70%)'}} />
      {/* piso de retícula en perspectiva que avanza hacia la cámara */}
      <div style={{position: 'absolute', left: -1000, top: 1120, width: 3080, height: 1500, transformOrigin: '50% 0%', transform: 'perspective(700px) rotateX(74deg)', backgroundImage: `linear-gradient(rgba(150,170,210,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(150,170,210,0.16) 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0px ${(f * 3) % 90}px`, WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 60%, transparent 100%)', opacity: 0.7}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1090, height: 70, background: `radial-gradient(ellipse at 50% 50%, ${alfa(C.acento, 0.35)} 0%, ${alfa(C.acento, 0)} 70%)`, filter: 'blur(10px)'}} />
      {/* partículas desenfocadas (bokeh) en tres profundidades */}
      {Array.from({length: 26}, (_, i) => {
        const capa = i % 3;
        const r = [5, 10, 22][capa];
        const vel = [6, 14, 30][capa];
        const yy = ((rnd(i) * 2200 - t * vel * (1 + rnd(i + 9))) % 2200 + 2200) % 2200 - 140;
        const xx = rnd(i + 3) * 1080 + Math.sin(t * 0.6 + i) * 30;
        return <div key={i} style={{position: 'absolute', left: xx - r, top: yy - r, width: r * 2, height: r * 2, borderRadius: '50%', background: [C.acento, V.azul, V.morado, V.rosa, V.cian, C.claro][i % 6], opacity: [0.4, 0.26, 0.16][capa], filter: `blur(${[1, 4, 10][capa]}px)`}} />;
      })}
      {/* luz que sigue a la punta del hilo */}
      <div style={{position: 'absolute', left: x - 600, top: y - 600, width: 1200, height: 1200, borderRadius: '50%', background: `radial-gradient(circle, ${alfa(C.acento, 0.24)} 0%, ${alfa(C.acento, 0)} 62%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)'}} />
    </AbsoluteFill>
  );
};

// Grano de película + barrido de luz muy sutil (encima de todo).
export const Grano: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{zIndex: 8, pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.16}}>
      <svg width={1080} height={1920}>
        <filter id="grano">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1080} height={1920} filter="url(#grano)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Piezas visuales ----------
export const vidrio: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(38,43,54,0.95) 0%, rgba(15,17,22,0.97) 60%)',
  border: '2px solid rgba(190,205,235,0.16)',
  borderRadius: 36,
  boxShadow: '0 50px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,220,180,0.12)',
  overflow: 'hidden',
  position: 'relative',
};
// Tarjeta de vidrio con borde y resplandor del color de su tema.
export const vidrioDe = (c: string): React.CSSProperties => ({...vidrio, border: `3px solid ${c}`, boxShadow: `0 50px 100px rgba(0,0,0,0.7), 0 0 50px ${c}40, inset 0 0 40px ${c}14, inset 0 2px 0 rgba(255,255,255,0.12)`});
// Ráfaga de líneas de velocidad de colores (gancho y cierre).
export const Rafaga: React.FC<{en: number; x: number; y: number; n?: number}> = ({en, x, y, n = 34}) => {
  const d = useT() - en;
  if (d < 0 || d > 0.8) return null;
  const cols = [C.acento, V.amarillo, V.rosa, V.azul, V.cian, V.morado, C.claro];
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(i * 1.7) * Math.PI * 2;
        const r0 = 60 + d * (900 + rnd(i) * 900);
        const l = 80 + rnd(i + 4) * 220;
        const c = cols[i % cols.length];
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(a) * r0, top: y + Math.sin(a) * r0 - 3, width: l, height: 5 + rnd(i) * 4, borderRadius: 4, background: c, boxShadow: `0 0 16px ${c}`, transform: `rotate(${(a * 180) / Math.PI}deg)`, transformOrigin: '0 50%', opacity: 1 - d / 0.8}} />;
      })}
    </>
  );
};
// Contador de fichas (dígitos con borde de color).
export const Fichas: React.FC<{valor: string; color: string; w?: number}> = ({valor, color, w = 70}) => (
  <div style={{display: 'flex', gap: 8}}>
    {valor.split('').map((d, i) => (
      <div key={i} style={{width: w, height: w * 1.3, borderRadius: 12, background: 'linear-gradient(180deg, #2A2F3A 0%, #2A2F3A 49%, #151820 51%, #1C2029 100%)', border: `3px solid ${color}`, boxShadow: `0 0 20px ${color}66, inset 0 2px 0 rgba(255,255,255,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: w * 0.85, color: '#fff'}}>{d}</div>
    ))}
  </div>
);
// Destello que cruza una tarjeta una vez (va dentro de un contenedor con overflow hidden).
export const Brillo: React.FC<{en: number; w?: number}> = ({en, w = 1000}) => {
  const p = tramo(useT(), en, en + 0.7, Easing.inOut(Easing.quad));
  if (p <= 0 || p >= 1) return null;
  return <div style={{position: 'absolute', top: -200, bottom: -200, left: lerp(-300, w + 100, p), width: 160, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,240,220,0.28) 50%, rgba(255,255,255,0) 100%)', transform: 'rotate(18deg)', pointerEvents: 'none'}} />;
};
// Chispas que salen de un punto.
export const Chispas: React.FC<{en: number; x: number; y: number; n?: number; fuerza?: number}> = ({en, x, y, n = 18, fuerza = 1}) => {
  const d = useT() - en;
  if (d < 0 || d > 0.9) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(i + en * 10) * Math.PI * 2;
        const v = (260 + rnd(i * 3 + en) * 420) * fuerza;
        const px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 500 * d * d;
        const s = (1 - d / 0.9) * (4 + rnd(i) * 6);
        return <div key={i} style={{position: 'absolute', left: px - s, top: py - s, width: s * 2, height: s * 2, borderRadius: '50%', background: i % 3 ? C.acento : tono(C.acento, 0.85), boxShadow: `0 0 ${s * 3}px ${C.acento}`}} />;
      })}
    </>
  );
};
// Onda expansiva.
export const Onda: React.FC<{en: number; x: number; y: number; r?: number}> = ({en, x, y, r = 420}) => {
  const p = tramo(useT(), en, en + 0.6, Easing.out(Easing.cubic));
  if (p <= 0 || p >= 1) return null;
  return <div style={{position: 'absolute', left: x - r * p, top: y - r * p, width: r * 2 * p, height: r * 2 * p, borderRadius: '50%', border: `${10 * (1 - p) + 1}px solid ${alfa(tono(C.acento, 0.2), 0.8 * (1 - p))}`, boxShadow: `0 0 40px ${alfa(C.acento, 0.6 * (1 - p))}`}} />;
};
// Titular: cada palabra sube desde una máscara, con desenfoque y brillo.
export const Titular: React.FC<{texto: string; en: number; top: number; size?: number; acento?: number[]; centro?: boolean}> = ({texto, en, top, size = 84, acento = [], centro = true}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: centro ? 'center' : 'left', fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.045, lineHeight: 1.02}}>
      {texto.split(' ').map((w, i) => {
        const s = spring({frame: f - seg(en + i * 0.07), fps: FPS, config: {damping: 14, stiffness: 170}});
        const on = acento.includes(i);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0 0.12em 0.08em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * 110}%) rotate(${(1 - s) * 8}deg)`, filter: s < 0.98 ? `blur(${(1 - s) * 10}px)` : undefined, ...(on ? {background: `linear-gradient(180deg, ${tono(C.acento, 0.4)} 0%, ${C.acento} 55%, ${tono(C.acento, -0.2)} 100%)`, WebkitBackgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 22px ${alfa(C.acento, 0.55)})`} : {color: C.claro, textShadow: '0 10px 30px rgba(0,0,0,0.6)'})}}>
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};
export const Etq: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = C.apagado, size = 26}) => (
  <span style={{fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: 6, color}}>{children}</span>
);
// Elemento que entra con resorte (escala + desenfoque) en `en` (segundos locales del plano).
export const Ap: React.FC<{en: number; children: React.ReactNode; style?: React.CSSProperties; desde?: number; giro?: number}> = ({en, children, style, desde = 0.6, giro = 0}) => {
  const s = useAp(en);
  return (
    <div style={{position: 'absolute', ...style, transform: `${style?.transform ?? ''} perspective(1200px) rotateX(${(1 - s) * 30}deg) rotate(${(1 - s) * giro}deg) scale(${interpolate(s, [0, 1], [desde, 1])})`, opacity: Math.min(1, s * 2), filter: s < 0.97 ? `blur(${(1 - Math.min(1, s)) * 14}px)` : undefined}}>
      {children}
    </div>
  );
};
// Flotación 3D sutil para tarjetas.
export const useFlota = (amp = 1) => {
  const t = useT();
  return `rotateX(${Math.sin(t * 1.3) * 2.2 * amp}deg) rotateY(${Math.cos(t * 1.1) * 3 * amp}deg) translateY(${Math.sin(t * 1.7) * 6 * amp}px)`;
};
// Número gigante de paso, en contorno, detrás de las tarjetas.
export const NumeroPaso: React.FC<{n: string; c: string}> = ({n, c}) => {
  const s = useAp(0, {damping: 16, stiffness: 120});
  return (
    <div style={{position: 'absolute', left: 70, top: 170, fontFamily: SANS, fontWeight: 900, fontSize: 380, letterSpacing: -20, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${c}`, filter: `drop-shadow(0 0 18px ${c}88)`, transform: `translateX(${(1 - s) * -200}px)`, opacity: 0.6 * s}}>
      {n}
    </div>
  );
};

export const Sub: React.FC<{de: number; a: number; children: React.ReactNode}> = ({de, a, children}) => (
  <Sequence from={seg(de)} durationInFrames={seg(a + 0.25) - seg(de)} layout="none">
    <SubIn dur={a + 0.25 - de}>{children}</SubIn>
  </Sequence>
);
export const SubIn: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const e = spring({frame: f, fps: FPS, config: {damping: 15, stiffness: 160}});
  const s = tramo(t, dur - 0.25, dur, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{transform: `translateX(${(1 - e) * 500 - s * 700}px) rotateY(${(1 - e) * -25 + s * 25}deg) scale(${interpolate(e, [0, 1], [0.85, 1]) * (1 - s * 0.1)})`, opacity: Math.min(1, e * 2) * (1 - s), filter: (1 - e) + s > 0.03 ? `blur(${((1 - e) + s) * 18}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

export const Confeti: React.FC<{en: number; x: number; y: number}> = ({en, x: x0, y: y0}) => {
  const d = useT() - en;
  if (d < 0 || d > 1.6) return null;
  return (
    <>
      {Array.from({length: 40}, (_, i) => {
        const a = -Math.PI / 2 + (rnd(i) - 0.5) * 2.4;
        const v = 700 + rnd(i + 5) * 700;
        const x = x0 + Math.cos(a) * v * d * 0.6;
        const y = y0 + Math.sin(a) * v * d * 0.8 + 1300 * d * d;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 16, height: 26, borderRadius: 3, background: [C.acento, V.amarillo, V.rosa, V.azul, V.verde, V.morado, V.cian][i % 7], transform: `rotate(${d * 900 * (rnd(i + 2) - 0.5)}deg) rotateX(${d * 720}deg)`, opacity: 1 - Math.max(0, d - 1.1) * 2}} />;
      })}
    </>
  );
};
