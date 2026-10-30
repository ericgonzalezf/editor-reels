import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './marca/kit';
import {Muestra, DURACION_MUESTRA} from './Muestra';
import {MuestraAnimada, DURACION_ANIMADA} from './MuestraAnimada';

// Cada video nuevo se registra aquí (Claude lo hace por ti).
export const Root: React.FC = () => (
  <>
    <Composition id="Muestra" component={Muestra} durationInFrames={Math.round(DURACION_MUESTRA * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="MuestraAnimada" component={MuestraAnimada} durationInFrames={Math.round(DURACION_ANIMADA * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
