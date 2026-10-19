import { describe, expect, it } from 'vitest';
import {
  FALLBACK_CATALOG,
  discoverFallbackCatalog,
  getFallbackDetails,
  getFallbackRandomEpisode,
  getFallbackSimilar,
  searchFallbackCatalog,
} from './fallback-catalog';

describe('fallback-catalog (yerel çevrimdışı küratör kataloğu)', () => {
  it('en az 40 adet zengin Türk ve dünya sineması/dizi kaydı içerir', () => {
    expect(FALLBACK_CATALOG.length).toBeGreaterThanOrEqual(40);
    const movies = FALLBACK_CATALOG.filter((i) => i.media_type === 'movie');
    const tvShows = FALLBACK_CATALOG.filter((i) => i.media_type === 'tv');
    expect(movies.length).toBeGreaterThanOrEqual(24);
    expect(tvShows.length).toBeGreaterThanOrEqual(16);
  });

  it('her kayıtta geçerli id, özet, puan ve platform bilgisi bulunur', () => {
    const ids = new Set<string>();
    for (const item of FALLBACK_CATALOG) {
      const key = `${item.media_type}-${item.id}`;
      expect(ids.has(key)).toBe(false);
      ids.add(key);
      expect(item.overview?.length).toBeGreaterThan(20);
      expect(item.vote_average).toBeGreaterThanOrEqual(7.0);
      expect(item.genre_ids?.length).toBeGreaterThan(0);
    }
  });

  it('discoverFallbackCatalog film ve dizi ayrımını doğru yapar', () => {
    const movies = discoverFallbackCatalog('movie');
    const tvShows = discoverFallbackCatalog('tv');
    expect(movies.every((m) => m.media_type === 'movie' && m.fromFallback)).toBe(true);
    expect(tvShows.every((t) => t.media_type === 'tv' && t.fromFallback)).toBe(true);
  });

  it('discoverFallbackCatalog sadece yerli (onlyTurkish) filtresini doğru uygular', () => {
    const trMovies = discoverFallbackCatalog('movie', { onlyTurkish: true });
    expect(trMovies.length).toBeGreaterThanOrEqual(8);
    expect(trMovies.every((m) => m.original_language === 'tr')).toBe(true);

    const trTv = discoverFallbackCatalog('tv', { onlyTurkish: true });
    expect(trTv.length).toBeGreaterThanOrEqual(6);
    expect(trTv.every((t) => t.original_language === 'tr')).toBe(true);
  });

  it('discoverFallbackCatalog tür (genreIds) filtresini uygular', () => {
    const comedies = discoverFallbackCatalog('movie', { genreIds: [35] });
    expect(comedies.length).toBeGreaterThan(0);
    expect(comedies.every((m) => m.genre_ids?.includes(35))).toBe(true);
  });

  it('discoverFallbackCatalog yıl aralığı (yearFrom/yearTo) filtresini uygular', () => {
    const classics = discoverFallbackCatalog('movie', { yearFrom: 1970, yearTo: 2005 });
    expect(classics.length).toBeGreaterThan(0);
    for (const item of classics) {
      const yr = parseInt((item.release_date || '').slice(0, 4), 10);
      expect(yr).toBeGreaterThanOrEqual(1970);
      expect(yr).toBeLessThanOrEqual(2005);
    }
  });

  it('discoverFallbackCatalog izlenen/kara liste (excludeIds) kayıtlarını hariç tutar', () => {
    const all = discoverFallbackCatalog('movie');
    const excludedId = all[0].id;
    const filtered = discoverFallbackCatalog('movie', { excludeIds: [excludedId] });
    expect(filtered.some((m) => m.id === excludedId)).toBe(false);
  });

  it('discoverFallbackCatalog aşırı dar filtrelerde aşamalı gevşetme ile boş dönmez', () => {
    const relaxed = discoverFallbackCatalog('movie', {
      genreIds: [37], // Vahşi Batı
      platforms: [9999],
      yearFrom: 1920,
      yearTo: 1925,
    });
    expect(relaxed.length).toBeGreaterThan(0);
  });

  it('getFallbackDetails bilinen ID için detay döner, bilinmeyen için null döner', () => {
    const kisUykusu = getFallbackDetails(245891, 'movie');
    expect(kisUykusu).not.toBeNull();
    expect(kisUykusu?.title).toBe('Kış Uykusu');
    expect(kisUykusu?.fromFallback).toBe(true);

    const unknown = getFallbackDetails(99999999, 'movie');
    expect(unknown).toBeNull();
  });

  it('searchFallbackCatalog başlık ve özet içinde arama yapar', () => {
    const gibi = searchFallbackCatalog('Gibi', 'tv');
    expect(gibi.length).toBeGreaterThan(0);
    expect(gibi[0].name).toBe('Gibi');

    const inception = searchFallbackCatalog('Inception', 'movie');
    expect(inception.length).toBeGreaterThan(0);
    expect(inception[0].id).toBe(27205);
  });

  it('searchFallbackCatalog eşleşme yoksa popüler varsayılanları döner', () => {
    const fallbackList = searchFallbackCatalog('xyznonexistent12345', 'tv');
    expect(fallbackList.length).toBeGreaterThan(0);
  });

  it('getFallbackSimilar ortak tür ve dile göre benzer yapım önerir ve excludeIds listesine uyar', () => {
    const similar = getFallbackSimilar(245891, 'movie', [72784]);
    expect(similar).not.toBeNull();
    expect(similar?.id).not.toBe(245891);
    expect(similar?.id).not.toBe(72784);
    expect(similar?.fromFallback).toBe(true);
  });

  it('getFallbackRandomEpisode belirli bir dizi için rastgele bölüm döner', () => {
    const ep = getFallbackRandomEpisode(115916); // Gibi
    expect(ep).not.toBeNull();
    expect(ep?.showName).toBe('Gibi');
    expect(ep?.season).toBeGreaterThanOrEqual(1);
    expect(ep?.episode).toBeGreaterThanOrEqual(1);
    expect(ep?.fromFallback).toBe(true);
  });

  it('getFallbackRandomEpisode dizi seçilmediğinde türe göre sitcom bölümü döner', () => {
    const ep = getFallbackRandomEpisode(null, 35, [8]);
    expect(ep).not.toBeNull();
    expect(ep?.media_type).toBe('tv');
    expect(ep?.title).toBeTruthy();
  });
});
