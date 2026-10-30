import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACENTOS as V, C, Encabezado, FuentesMarca, SANS, Sfx, Subtitulos, useT, type Chunk} from './marca/kit';
import {Ap, Chispas, Confeti, Etq, FONDO, Fichas, Grano, HiloCapa, Mundo, NumeroPaso, Onda, Plano as PlanoBase, type PlanoDef, Rafaga, Titular, type Tramo, puntaHilo, sacudida, vidrioDe} from './marca/animacion';

// Muestra del formato "animación sin cámara" (voz en off): 3 planos con cámara virtual y un hilo de luz que los une.
// Para un video real, los tiempos salen de tiempos.json (fr(n) y anclas) en lugar de números fijos.
export const DURACION_ANIMADA = 10;
const PLANOS: PlanoDef[] = [
  {ini: 0, fin: 3, ent: 'ninguna'},
  {ini: 3, fin: 6.6, ent: 'zoom'},
  {ini: 6.6, fin: 99, ent: 'barrido'},
];
const GOLPES = [0.02, 3.6, 7.4];
const TRAMOS: Tramo[] = [
  {pts: [[-40, 1180], [140, 1000], [940, 1000]], k: [[0.05, 0], [0.8, 2]]},
  {pts: [[940, 1000], [1010, 1000], [1010, 520], [70, 520], [70, 960], [1010, 960]], k: [[3.05, 0], [4.2, 5]]},
  {pts: [[1010, 960], [1010, 980], [960, 980], [120, 980]], k: [[6.6, 0], [6.8, 2], [7.6, 3]]},
];
const SUBS: Chunk[] = [
  {start: 0.1, end: 1.4, words: [{t: 'Videos', s: 0.1}, {t: 'animados', s: 0.6}]},
  {start: 1.5, end: 2.9, words: [{t: 'sin', s: 1.5}, {t: 'grabarte', s: 1.9}]},
  {start: 3.1, end: 4.8, words: [{t: 'Solo', s: 3.1}, {t: 'tu', s: 3.6}, {t: 'voz', s: 3.9}]},
  {start: 4.9, end: 6.5, words: [{t: 'y', s: 4.9}, {t: 'tu', s: 5.2}, {t: 'guion', s: 5.5}]},
  {start: 6.7, end: 8.4, words: [{t: 'listo', s: 6.7}, {t: 'para', s: 7.2}, {t: 'publicar', s: 7.6}]},
];

const Plano: React.FC<{i: number; children: React.ReactNode}> = ({i, children}) => <PlanoBase planos={PLANOS} i={i}>{children}</PlanoBase>;

const Gancho: React.FC = () => (
  <AbsoluteFill>
    <Onda en={0.02} x={540} y={760} r={900} />
    <Rafaga en={0.02} x={540} y={760} />
    <Chispas en={0.02} x={540} y={760} n={30} fuerza={1.4} />
    <Titular texto="Videos animados" en={0.1} top={500} size={104} acento={[1]} />
    <Titular texto="sin grabarte" en={0.5} top={700} size={84} />
  </AbsoluteFill>
);

const Paso: React.FC = () => (
  <AbsoluteFill>
    <NumeroPaso n="01" c={V.azul} />
    <Ap en={0.25} style={{position: 'absolute', left: 140, top: 560, width: 800, padding: '44px 48px', borderRadius: 36, ...vidrioDe(V.azul)}}>
      <Etq color={V.azul}>PASO 1</Etq>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: C.claro, marginTop: 10}}>Graba solo tu voz</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 30}}>
        <Fichas valor="30" color={V.azul} />
        <Etq color={C.apagado} size={30}>SEGUNDOS</Etq>
      </div>
    </Ap>
  </AbsoluteFill>
);

const Cierre: React.FC = () => (
  <AbsoluteFill>
    <Titular texto="Listo para publicar" en={0.2} top={820} size={92} acento={[2]} />
    <Confeti en={0.9} x={540} y={900} />
  </AbsoluteFill>
);

export const MuestraAnimada: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: FONDO}}>
      <FuentesMarca />
      <Mundo punta={(t) => puntaHilo(TRAMOS, PLANOS, t)} />
      <Escenas />
      <Encabezado claro={false} items={[{de: 0.3, a: 6.6, etiqueta: 'VIDEOS CON IA'}, {de: 6.6, a: DURACION_ANIMADA, etiqueta: 'RESULTADO'}]} />
      <Subtitulos chunks={SUBS} variante="pildora" zona={() => ({top: 1580, size: 60})} />
      <Grano />
      <Sfx en={0} src="impacto" vol={0.55} />
      <Sfx en={3} src="whoosh" vol={0.32} />
      <Sfx en={6.6} src="whoosh" vol={0.3} />
      <Sfx en={7.5} src="ding" vol={0.35} />
    </AbsoluteFill>
  );
};

const Escenas: React.FC = () => {
  const [sx, sy] = sacudida(GOLPES, useT());
  return (
    <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
      <HiloCapa tramos={TRAMOS} planos={PLANOS} encima={false} />
      <Plano i={0}><Gancho /></Plano>
      <Plano i={1}><Paso /></Plano>
      <Plano i={2}><Cierre /></Plano>
      <HiloCapa tramos={TRAMOS} planos={PLANOS} encima />
    </AbsoluteFill>
  );
};
