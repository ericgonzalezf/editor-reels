// TU MARCA — el único archivo que tienes que cambiar para que los videos se vean tuyos.
// Claude lo llena contigo la primera vez que usas el skill (paso "Configurar mi marca").
export const MARCA = {
  nombre: 'Tu nombre',
  sitio: 'tusitio.com', // sale en los encabezados; pon tu @ si no tienes sitio
  colores: {
    fondo: '#0A0A0B', // fondo oscuro principal
    tarjeta: '#141416', // tarjetas y cajas sobre el fondo
    borde: '#2A2A2E', // bordes finos
    acento: '#C6F432', // TU color: palabra activa, stickers, botones
    claro: '#F4F4EF', // fondo claro de escenas y texto sobre oscuro
    apagado: '#9A9AA0', // texto secundario
    tinta: '#0E0F0A', // texto sobre el acento y sobre el fondo claro
  },
  calidez: '#ffb36b', // tinte suave de la cámara (cálido = naranja, frío = '#7fb2ff')
  // Fuentes en public/fonts/. familia = el nombre con que se usan en CSS.
  fuentes: {
    titulos: {familia: 'Geist', archivo: 'fonts/Geist-Variable.ttf'},
    mono: {familia: 'Geist Mono', archivo: 'fonts/GeistMono-Variable.ttf'},
  },
  // Colores de otras marcas: solo para identificarlas (logos, equipos en un versus).
  otras: {
    claude: '#D97757',
    gem1: '#5B7CFA',
    gem2: '#A56BE0',
    gpt1: '#10A37F',
    gpt2: '#3FD3A8',
    verde: '#1D9E5A',
  },
};
