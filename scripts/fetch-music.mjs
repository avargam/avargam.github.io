/**
 * Completa la música de la estantería (Fuera del código) desde la API de búsqueda de iTunes.
 * Es opcional: no corre en el build.
 *
 * `src/data/music.json` es la fuente. Por cada entrada:
 *   - si falta la portada (`src/assets/music/<id>.jpg|png|webp`), baja la de iTunes (400×400);
 *   - si `audio` está vacío, lo llena con la URL de la vista previa de 30 s.
 * No toca lo que ya existe: se pueden poner portadas propias, o un clip propio en `public/audio/`
 * con `"audio": "/audio/<archivo>"`.
 *
 * Uso: node scripts/fetch-music.mjs          (completa lo que falta)
 *      node scripts/fetch-music.mjs miley    (vuelve a buscar esa entrada)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DATA = new URL('../src/data/music.json', import.meta.url);
const COVERS = new URL('../src/assets/music/', import.meta.url);
/** Algunos discos solo están en ciertas tiendas. */
const STORES = ['us', 'cl', 'se'];

const get = async (endpoint, params) => {
  const res = await fetch(`https://itunes.apple.com/${endpoint}?${new URLSearchParams(params)}`);
  return (await res.json()).results;
};

const match = (results, { artist, track }) =>
  results.find(
    (r) =>
      r.wrapperType === 'track' &&
      r.artistName.toLowerCase().startsWith(artist.toLowerCase()) &&
      r.trackName.toLowerCase().startsWith(track.toLowerCase()),
  );

async function find(song) {
  for (const country of STORES) {
    const term = `${song.artist} ${song.track}`;
    const found = match(await get('search', { term, entity: 'song', limit: 25, country }), song);
    if (found) return found;
  }
  // La búsqueda a veces no indexa temas nuevos: se recorren los discos del artista.
  for (const country of STORES) {
    const [artist] = await get('search', {
      term: song.artist,
      entity: 'musicArtist',
      limit: 1,
      country,
    });
    if (!artist) continue;
    const albums = await get('lookup', {
      id: artist.artistId,
      entity: 'album',
      limit: 50,
      country,
    });
    for (const album of albums.slice(1)) {
      const found = match(
        await get('lookup', { id: album.collectionId, entity: 'song', country }),
        song,
      );
      if (found) return found;
    }
  }
  return null;
}

const songs = JSON.parse(readFileSync(DATA, 'utf8'));
const force = new Set(process.argv.slice(2));
for (const song of songs) {
  const hasCover = ['jpg', 'png', 'webp'].some((ext) =>
    existsSync(new URL(`${song.id}.${ext}`, COVERS)),
  );
  const needCover = force.has(song.id) || !hasCover;
  const needAudio = force.has(song.id) || !song.audio;
  if (!needCover && !needAudio) {
    console.log(`${song.id}: ok`);
    continue;
  }
  const found = await find(song);
  if (!found) {
    console.log(`${song.id}: no está en iTunes; agrega la portada y el audio a mano`);
    continue;
  }
  if (needCover) {
    const art = await fetch(found.artworkUrl100.replace('100x100bb', '400x400bb'));
    writeFileSync(new URL(`${song.id}.jpg`, COVERS), Buffer.from(await art.arrayBuffer()));
  }
  if (needAudio && found.previewUrl) song.audio = found.previewUrl;
  console.log(`${song.id}: ${found.collectionName}`);
}
writeFileSync(DATA, `${JSON.stringify(songs, null, 2)}\n`);
