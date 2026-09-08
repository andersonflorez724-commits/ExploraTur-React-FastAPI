import montanas from '../assets/images/montanas.svg'
import playa from '../assets/images/playa.svg'
import ciudad from '../assets/images/ciudad.svg'
import bosque from '../assets/images/bosque.svg'
import desierto from '../assets/images/desierto.svg'
import atardecer from '../assets/images/atardecer.svg'
import aurora from '../assets/images/aurora.svg'
import cascada from '../assets/images/cascada.svg'
import estrellas from '../assets/images/estrellas.svg'
import flores from '../assets/images/flores.svg'

/**
 * Datos del carrusel: 10 imágenes con título y descripción.
 * Se mantienen en un archivo aparte para reutilizarlos
 * en cualquier parte de la aplicación (buena práctica).
 */
export const slides = [
  {
    id: 1,
    image: montanas,
    title: 'Montañas Majestuosas',
    description:
      'Paisajes andinos que combinan la calma de la madrugada con la imponencia de los picos nevados.',
  },
  {
    id: 2,
    image: playa,
    title: 'Playa del Paraíso',
    description:
      'Arenas doradas y aguas cristalinas perfectas para desconectarse y disfrutar del sol caribeño.',
  },
  {
    id: 3,
    image: ciudad,
    title: 'Ciudad Moderna',
    description:
      'Rascacielos, luces y ritmo acelerado: el corazón vibrante de la vida urbana de noche.',
  },
  {
    id: 4,
    image: bosque,
    title: 'Bosque Encantado',
    description:
      'Senderos entre árboles centenarios donde la naturaleza respira en cada rincón de niebla.',
  },
  {
    id: 5,
    image: desierto,
    title: 'Desierto Dorado',
    description:
      'Dunas infinitas bajo un sol ardiente que pinta el paisaje de tonos cálidos al atardecer.',
  },
  {
    id: 6,
    image: atardecer,
    title: 'Atardecer Caribeño',
    description:
      'El sol se despide sobre el mar en un espectáculo de colores que enamora a cada visitante.',
  },
  {
    id: 7,
    image: aurora,
    title: 'Aurora Boreal',
    description:
      'Luces verdes y violetas que bailan en el cielo polar, uno de los fenómenos más mágicos del planeta.',
  },
  {
    id: 8,
    image: cascada,
    title: 'Cascada Esmeralda',
    description:
      'Agua pura que cae entre la selva tropical creando piscinas naturales de color esmeralda.',
  },
  {
    id: 9,
    image: estrellas,
    title: 'Noche Estrellada',
    description:
      'Cielos despejados lejos de la ciudad donde la vía láctea se observa en todo su esplendor.',
  },
  {
    id: 10,
    image: flores,
    title: 'Jardín de Flores',
    description:
      'Campos de flores de mil colores que convierten el paisaje en un lienzo vivo y perfumado.',
  },
]
