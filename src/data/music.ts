/**
 * Música de la estantería: un disco por artista, con un tema que suena en el mini reproductor.
 *
 * Para cambiar un tema se edita `music.json`. La portada es `src/assets/music/<id>.jpg` (o .png,
 * .webp) y `audio` es una URL o una ruta de `public/` (p. ej. `/audio/<archivo>.m4a`).
 * `node scripts/fetch-music.mjs` completa desde iTunes la portada y el audio que falten.
 */
import type { ImageMetadata } from 'astro';
import songs from './music.json';

export interface Song {
  /** Ancla del disco (`#musica-<id>`) y nombre de su portada. */
  id: string;
  artist: string;
  track: string;
  album: string;
  year: number;
  audio: string;
  cover: ImageMetadata;
}

const covers = import.meta.glob<{ default: ImageMetadata }>('../assets/music/*.{jpg,png,webp}', {
  eager: true,
});

const coverOf = (id: string): ImageMetadata => {
  const entry = Object.entries(covers).find(
    ([path]) => path.split('/').pop()?.split('.')[0] === id,
  );
  if (!entry) throw new Error(`Falta la portada de "${id}" en src/assets/music/`);
  return entry[1].default;
};

export const music: Song[] = songs.map((song) => ({ ...song, cover: coverOf(song.id) }));
