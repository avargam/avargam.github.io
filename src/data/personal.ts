export interface Topic {
  id: string;
  title: string;
  blurb: string;
  /** Marcadores de posición hasta que escribas tus favoritos reales. */
  favorites: string[];
}

export const topics: Topic[] = [
  {
    id: 'juegos',
    title: 'Juegos',
    blurb: 'Juegos de mesa y de rol, y videojuegos cozy y relajados.',
    favorites: ['[Tu juego de mesa favorito]', '[Tu juego cozy favorito]'],
  },
  {
    id: 'anime',
    title: 'Anime, manga y cómics',
    blurb: 'Narrativa visual con identidad propia.',
    favorites: ['[Una serie o manga que recomiendes]'],
  },
  {
    id: 'policial',
    title: 'Policial y thriller',
    blurb: 'Misterios con giros, en libros, series o cine.',
    favorites: ['[Un título que te marcó]'],
  },
  {
    id: 'musica',
    title: 'Música',
    blurb: 'Hip-hop, urbano y pop; electrónica, lo-fi y ambient para concentrarme.',
    favorites: ['[Un artista]', '[Un álbum o playlist]'],
  },
];
