import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {BotonSeguir, Camara, Fondo, FuentesMarca, Hoja, S, Sfx, Subtitulos, TituloGolpe, seg, usarTiempos, type Chunk, type TramoCamara} from '../marca/kit';
import subs from './subs.json';
import tiempos from './tiempos.json';

// Esqueleto de un video. Se copia a src/vN/ (datos.py deja ahí subs.json y tiempos.json).
// fr(n) = inicio/fin de la frase n del corte · A.palabra = segundo en que se dice una palabra ancla.
const CARPETA = 'vN';
const {fr, A, duracion} = usarTiempos(tiempos);
export const DURACION_VIDEO = duracion + 0.35;

const DEMO = {ini: fr(2).ini, fin: fr(Math.max(2, tiempos.frases.length - 1)).ini};
const CAMARA: TramoCamara[] = [{ini: DEMO.ini, fin: DEMO.fin, modo: 'burbuja'}];
const enDemo = (t: number) => t >= DEMO.ini + 0.3 && t < DEMO.fin;

export const Video: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <FuentesMarca />
    <Audio src={staticFile(`${CARPETA}/musica.wav`)} volume={1} />
    <S de={DEMO.ini - 0.05} a={DEMO.fin + 0.3}>
      <Hoja dur={seg(DEMO.fin + 0.3) - seg(DEMO.ini - 0.05)}><Fondo tipo="claro" /></Hoja>
    </S>
    {/* aquí van las piezas de la demostración (ver piezas.md) */}
    <Camara src={`${CARPETA}/camara.mp4`} tramos={CAMARA} golpes={[0.5]} />
    <AbsoluteFill style={{zIndex: 6}}>
      <S de={fr(1).ini} a={fr(1).fin}><TituloGolpe linea1="TÍTULO DEL" linea2="GANCHO" /></S>
      <S de={fr(tiempos.frases.length).ini} a={DURACION_VIDEO}><BotonSeguir tap={seg(1)} /></S>
    </AbsoluteFill>
    <Subtitulos chunks={subs as Chunk[]} variante="subrayado" zona={(t) => (enDemo(t) ? {top: 1600, size: 56, claro: true} : {top: 1500})} />
    <Sfx en={0.45} src="impacto" vol={0.5} />
    <Sfx en={DEMO.ini - 0.05} src="whoosh" vol={0.3} />
    <Sfx en={DEMO.fin} src="whoosh" vol={0.3} />
    {A.siganme !== undefined && <Sfx en={A.siganme} src="click" vol={0.5} />}
  </AbsoluteFill>
);
