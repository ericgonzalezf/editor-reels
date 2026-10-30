import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {MARCA} from './marca';

// Carga las fuentes de marca.ts antes de dibujar. Poner <FuentesMarca /> al inicio de cada composición.
let cargadas: Promise<void> | null = null;
const cargar = () => {
  if (!cargadas) {
    cargadas = Promise.all(
      [MARCA.fuentes.titulos, MARCA.fuentes.mono].map(async ({familia, archivo}) => {
        const f = new FontFace(familia, `url(${staticFile(archivo)})`, {weight: '100 900'});
        await f.load();
        document.fonts.add(f);
      }),
    ).then(() => undefined);
  }
  return cargadas;
};

export const FuentesMarca: React.FC = () => {
  const [handle] = React.useState(() => delayRender('Cargando fuentes'));
  React.useEffect(() => {
    cargar()
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return null;
};
