/**
 * Fuera del código: los favoritos de cada repisa de la estantería. La música está aparte, en
 * `music.ts` (con `music.json` y sus portadas), para cambiarla sin tocar código.
 */

export type TopicId = 'juegos' | 'anime' | 'cine' | 'musica';

export interface Topic {
  id: TopicId;
  /** Texto del chip numerado. */
  chip: string;
  /** Placa de la repisa. */
  plate: string;
  /** Qué hay en la repisa, para el anuncio al elegirla y el botón de la repisa. */
  name: string;
}

export const topics: Topic[] = [
  { id: 'juegos', chip: 'Juegos', plate: 'JUEGOS', name: 'Juegos de mesa y videojuegos' },
  { id: 'anime', chip: 'Anime y cómics', plate: 'ANIME, MANGA Y CÓMICS', name: 'Anime y manga' },
  { id: 'cine', chip: 'Cine y series', plate: 'CINE Y SERIES', name: 'Películas' },
  { id: 'musica', chip: 'Música', plate: 'MÚSICA', name: 'Música' },
];

/** Un favorito de una repisa: un objeto con su nombre que se elige y muestra su detalle. */
interface Favorite {
  /** Ancla del detalle (`#anime-frieren`): con el prefijo del tema, porque los ids son globales. */
  id: string;
  title: string;
  /** Color del objeto (lomo, caja, cartucho) y, si hace falta, el del texto encima. */
  color: string;
  textColor?: string;
}

export interface Manga extends Favorite {
  /** Alto del lomo en la repisa. */
  height: number;
  description: string;
}

/** Un tomo por título. La ilustración del libro es `art/anime/<id sin prefijo>.svg`. */
export const anime: Manga[] = [
  {
    id: 'anime-frieren',
    title: 'Frieren',
    color: '#8ADBC8',
    height: 232,
    description:
      'Una elfa maga que ya venció al Rey Demonio vuelve a recorrer el mundo, esta vez para entender a los compañeros humanos que el tiempo se llevó.',
  },
  {
    id: 'anime-chainsaw',
    title: 'Chainsaw Man',
    color: '#FF9E7A',
    height: 214,
    description:
      'Denji, ahogado en deudas, se fusiona con Pochita, su perro motosierra, y termina cazando demonios para el gobierno. Caótico, brutal y extrañamente tierno.',
  },
  {
    id: 'anime-madoka',
    title: 'Madoka Magica',
    color: '#FF6FA3',
    height: 238,
    description:
      'Kyubey cumple cualquier deseo a cambio de volverse chica mágica. Bajo los colores pastel, el contrato esconde algo mucho más oscuro.',
  },
  {
    id: 'anime-msik',
    title: 'Mahou Shoujo Ikusei Keikaku',
    color: '#C6B8FF',
    height: 226,
    description:
      'Un juego para el celular convierte a sus jugadoras en chicas mágicas de verdad, hasta que anuncia que solo la mitad puede quedarse.',
  },
  {
    id: 'anime-wha',
    title: 'Witch Hat Atelier',
    color: '#7B6CF6',
    textColor: '#FFFFFF',
    height: 218,
    description:
      'Coco descubre que la magia se dibuja con tinta. Después de un hechizo que sale mal, se vuelve aprendiz de bruja para arreglarlo.',
  },
  {
    id: 'anime-chiikawa',
    title: 'Chiikawa',
    color: '#FFFDF7',
    height: 206,
    description:
      'Criaturas pequeñas y redondas que arrancan maleza para vivir, comen rico y lloran seguido, en un mundo tierno pero sorprendentemente duro.',
  },
  {
    id: 'anime-ansatsu',
    title: 'Ansatsu Kyoshitsu',
    color: '#FFE86B',
    height: 236,
    description:
      'La criatura que destruyó parte de la Luna se vuelve profesor de la clase 3‑E. Sus alumnos tienen un año para asesinarlo.',
  },
  {
    id: 'anime-wixoss',
    title: 'Wixoss',
    color: '#3B2A80',
    textColor: '#FFFFFF',
    height: 210,
    description:
      'En un juego de cartas, las chicas que ganan pueden cumplir su deseo. Lo que cuesta perder (y ganar) es más de lo que parece.',
  },
];

export interface Film extends Favorite {
  year: number;
  director: string;
  /**
   * Clip de 8 s con dos escenas del trailer oficial (`public/clips/…`, 640×360, sin audio); dura
   * lo mismo que una vuelta de la barra de progreso. Sin clip, se muestran escenas de relleno.
   */
  clip?: string;
  /** Colores de las escenas de relleno. */
  scenes: [string, string];
}

export const films: Film[] = [
  {
    id: 'cine-parasite',
    title: 'Parasite',
    year: 2019,
    director: 'Bong Joon-ho',
    color: '#2B2D42',
    clip: '/clips/parasite.mp4',
    scenes: ['#3E5C4A', '#C9A36B'],
  },
  {
    id: 'cine-leviticus',
    title: 'Leviticus',
    year: 2025,
    director: 'Adrian Chiarella',
    color: '#3B2A80',
    clip: '/clips/leviticus.mp4',
    scenes: ['#2A1B6B', '#B23A5A'],
  },
  {
    id: 'cine-substance',
    title: 'The Substance',
    year: 2024,
    director: 'Coralie Fargeat',
    color: '#FF4FA3',
    clip: '/clips/substance.mp4',
    scenes: ['#FF4FA3', '#FFE86B'],
  },
  {
    id: 'cine-coraline',
    title: 'Coraline',
    year: 2009,
    director: 'Henry Selick',
    color: '#2A1B6B',
    clip: '/clips/coraline.mp4',
    scenes: ['#2A1B6B', '#7B6CF6'],
  },
  {
    id: 'cine-chihiro',
    title: 'El viaje de Chihiro',
    year: 2001,
    director: 'Hayao Miyazaki',
    color: '#8ADBC8',
    textColor: '#2B2D42',
    clip: '/clips/chihiro.mp4',
    scenes: ['#3E9C7E', '#FF9E7A'],
  },
  {
    id: 'cine-cisne',
    title: 'El cisne negro',
    year: 2010,
    director: 'Darren Aronofsky',
    color: '#1B1245',
    clip: '/clips/cisne.mp4',
    scenes: ['#1B1245', '#8A8AA0'],
  },
];

interface GameBase extends Favorite {
  genre: string;
  /** Datos de la etiqueta: [nombre, valor]. */
  facts: [string, string][];
}

/** Juego de mesa: una caja parada en la repisa. Su componente es `art/juegos/<art>.svg`. */
export interface BoardGame extends GameBase {
  kind: 'mesa';
  height: number;
  art: 'dnd' | 'tren' | 'munchkin' | 'exit';
}

/** Videojuego: un cartucho sobre la pila. Por ahora, la consola muestra escenas de relleno. */
export interface VideoGame extends GameBase {
  kind: 'video';
  /** Etiqueta del cartucho, en dos líneas. */
  label: [string, string];
  scenes: [string, string];
}

export type Game = BoardGame | VideoGame;

/**
 * Jugadores, duración, géneros y plataformas son de relleno hasta confirmarlos. El número de cada
 * juego (el que sale en el d20) es su posición en esta lista.
 */
export const games: Game[] = [
  {
    id: 'juegos-dnd',
    kind: 'mesa',
    title: 'Dungeons & Dragons',
    color: '#B23A5A',
    textColor: '#FFFFFF',
    height: 204,
    art: 'dnd',
    genre: 'Rol cooperativo',
    facts: [
      ['Jugadores', '3–6'],
      ['Duración', 'sesiones de 3–4 h'],
    ],
  },
  {
    id: 'juegos-tren',
    kind: 'mesa',
    title: 'Aventureros al Tren',
    color: '#FFE86B',
    height: 182,
    art: 'tren',
    genre: 'Rutas y cartas',
    facts: [
      ['Jugadores', '2–5'],
      ['Duración', '30–60 min'],
    ],
  },
  {
    id: 'juegos-munchkin',
    kind: 'mesa',
    title: 'Munchkin',
    color: '#FF9E7A',
    height: 196,
    art: 'munchkin',
    genre: 'Cartas, todos contra todos',
    facts: [
      ['Jugadores', '3–6'],
      ['Duración', '1–2 h'],
    ],
  },
  {
    id: 'juegos-exit',
    kind: 'mesa',
    title: 'Exit',
    color: '#2B2D42',
    textColor: '#FFFFFF',
    height: 188,
    art: 'exit',
    genre: 'Escape room cooperativo',
    facts: [
      ['Jugadores', '1–4'],
      ['Duración', '45–90 min'],
    ],
  },
  {
    id: 'juegos-animal-crossing',
    kind: 'video',
    title: 'Animal Crossing',
    label: ['ANIMAL', 'CROSSING'],
    color: '#8ADBC8',
    scenes: ['#3E9C7E', '#FFE86B'],
    genre: 'Simulación de vida',
    facts: [['Plataforma', 'Nintendo · serie']],
  },
  {
    id: 'juegos-isaac',
    kind: 'video',
    title: 'The Binding of Isaac',
    label: ['BINDING', 'OF ISAAC'],
    color: '#FF9E7A',
    scenes: ['#5A2F6B', '#B23A5A'],
    genre: 'Roguelike',
    facts: [['Plataforma', 'PC · 2011']],
  },
  {
    id: 'juegos-galaxy',
    kind: 'video',
    title: 'Super Mario Galaxy',
    label: ['MARIO', 'GALAXY'],
    color: '#7B6CF6',
    scenes: ['#2A1B6B', '#7B6CF6'],
    genre: 'Plataformas 3D',
    facts: [['Plataforma', 'Wii · 2007']],
  },
  {
    id: 'juegos-xd',
    kind: 'video',
    title: 'Pokémon XD: Gale of Darkness',
    label: ['POKÉMON', 'XD'],
    color: '#C6B8FF',
    scenes: ['#3B2A80', '#FF6FA3'],
    genre: 'RPG de captura',
    facts: [['Plataforma', 'GameCube · 2005']],
  },
];
