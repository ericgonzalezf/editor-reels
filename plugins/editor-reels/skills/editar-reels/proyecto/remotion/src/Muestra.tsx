import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  BotonSeguir,
  Camara,
  ComentarioTecleado,
  Encabezado,
  Etiquetas,
  Fondo,
  FuentesMarca,
  Hoja,
  S,
  Sfx,
  Sticker,
  Subtitulos,
  TituloGolpe,
  seg,
  type Chunk,
} from './marca/kit';

// Muestra de 12 s sin grabaciones: sirve para probar la instalación y ver tu marca (colores y fuentes de marca.ts).
export const DURACION_MUESTRA = 12;
const sub = (start: number, txt: string): Chunk => {
  const p = txt.split(' ');
  return {start, end: start + 0.95, words: p.map((t, i) => ({t, s: start + (i * 0.9) / p.length}))};
};
const SUBS = [
  sub(0.2, 'Edita tus Reels'), sub(1.2, 'con IA,'), sub(2.6, 'paso a paso.'), sub(3.6, 'Corta silencios,'),
  sub(4.6, 'pon subtítulos'), sub(5.6, 'y animaciones'), sub(6.6, 'con tu marca.'), sub(9.2, 'Coméntame REEL'), sub(10.6, 'y sígueme.'),
];
const DEMO = {ini: 2.5, fin: 8.8};

export const Muestra: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <FuentesMarca />
    <S de={DEMO.ini - 0.05} a={DEMO.fin + 0.3}>
      <Hoja dur={seg(DEMO.fin + 0.3) - seg(DEMO.ini - 0.05)}><Fondo tipo="puntos" /></Hoja>
    </S>
    <Encabezado items={[{de: DEMO.ini + 0.2, a: DEMO.fin, etiqueta: 'PASO 1 / 3', titulo: 'Corta y subtitula', paso: 1, total: 3}]} />
    <Etiquetas top={520} hasta={DEMO.fin - 0.5} items={[{t: 3.7, txt: 'sin silencios'}, {t: 4.7, txt: 'subtítulos'}, {t: 5.7, txt: 'animaciones'}, {t: 6.7, txt: 'tu marca'}]} />
    <S de={5.2} a={DEMO.fin}><div style={{position: 'absolute', right: 80, top: 760}}><Sticker texto="¡SIN EDITOR!" rot={4} /></div></S>
    <Camara src="" tramos={[{ini: DEMO.ini, fin: DEMO.fin, modo: 'tarjeta'}]} golpes={[0.5]} />
    <AbsoluteFill style={{zIndex: 6}}>
      <S de={0} a={DEMO.ini}><TituloGolpe linea1="EDITA CON IA" linea2="EN MINUTOS" /></S>
      <S de={9} a={10.5}><ComentarioTecleado texto="REEL" inicio={8} /></S>
      <S de={10.5} a={DURACION_MUESTRA}><BotonSeguir tap={30} /></S>
    </AbsoluteFill>
    <Subtitulos chunks={SUBS} variante="recuadro" zona={(t) => (t >= DEMO.ini + 0.3 && t < DEMO.fin ? {top: 1560, left: 450, size: 54, claro: true} : {top: 1500})} />
    <Sfx en={0.45} src="impacto" vol={0.5} />
    <Sfx en={DEMO.ini - 0.05} src="whoosh" vol={0.3} />
    {[3.7, 4.7, 5.7, 6.7].map((t) => <Sfx key={t} en={t} src="pop" vol={0.18} />)}
    <Sfx en={DEMO.fin} src="whoosh" vol={0.3} />
    <Sfx en={11.5} src="click" vol={0.5} />
  </AbsoluteFill>
);
