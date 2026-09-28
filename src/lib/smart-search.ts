import { MOOD_TO_MOVIE_GENRE } from './tmdb'

interface SearchParams {
  genreIds: string;
  year?: string;
  sort: string;
  keywords?: string;
  minVoteCount?: number;
  minVoteAverage?: number;
}

export function analyzePrompt(text: string): SearchParams {
  const lower = text.toLowerCase();

  let genreIds = MOOD_TO_MOVIE_GENRE.funny;
  let sort = 'popularity.desc';
  let year = '';
  let minVoteCount = 100;
  let minVoteAverage: number | undefined = undefined;

  // --- 1. TÜR & TEMA ANALİZİ (TR & EN) ---
  if (
    lower.includes('korku') || lower.includes('gerilim') || lower.includes('ürpertici') ||
    lower.includes('altıma yap') || lower.includes('slasher') || lower.includes('horror') ||
    lower.includes('thriller') || lower.includes('scary') || lower.includes('spooky')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.scary;
  } else if (
    lower.includes('komik') || lower.includes('eğlence') || lower.includes('gülmek') ||
    lower.includes('güldür') || lower.includes('karnım ağr') || lower.includes('comedy') ||
    lower.includes('laugh') || lower.includes('funny') || lower.includes('humor')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.funny;
  } else if (
    lower.includes('ağla') || lower.includes('hüngür') || lower.includes('duygusal') ||
    lower.includes('dram') || lower.includes('gözyaş') || lower.includes('üzgün') ||
    lower.includes('cry') || lower.includes('tear') || lower.includes('emotional') ||
    lower.includes('drama') || lower.includes('heartbreaking')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.emotional;
  } else if (
    lower.includes('aksiyon') || lower.includes('vurdu') || lower.includes('macera') ||
    lower.includes('çerezlik') || lower.includes('action') || lower.includes('adventure') ||
    lower.includes('popcorn') || lower.includes('fight')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.action;
  } else if (
    lower.includes('bilim') || lower.includes('uzay') || lower.includes('gelecek') ||
    lower.includes('beyin yak') || lower.includes('sci-fi') || lower.includes('scifi') ||
    lower.includes('space') || lower.includes('alien') || lower.includes('cyberpunk') ||
    lower.includes('dystopia') || lower.includes('mind-bend')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.scifi;
  } else if (
    lower.includes('suç') || lower.includes('polis') || lower.includes('mafya') ||
    lower.includes('katil kim') || lower.includes('soygun') || lower.includes('crime') ||
    lower.includes('detective') || lower.includes('heist') || lower.includes('whodunit') ||
    lower.includes('mystery') || lower.includes('noir')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.crime;
  } else if (
    lower.includes('belgesel') || lower.includes('öğren') || lower.includes('sakin') ||
    lower.includes('kafa boşalt') || lower.includes('documentary') || lower.includes('nature') ||
    lower.includes('chill') || lower.includes('relax') || lower.includes('mind')
  ) {
    genreIds = MOOD_TO_MOVIE_GENRE.relax;
  } else if (
    lower.includes('anime') || lower.includes('animasyon') || lower.includes('japon') ||
    lower.includes('animation')
  ) {
    genreIds = '16'; // Animation
  } else if (
    lower.includes('aile') || lower.includes('pamuk') || lower.includes('çocuk') ||
    lower.includes('family') || lower.includes('feel-good') || lower.includes('warm')
  ) {
    genreIds = '10751,35'; // Family / Comedy
  } else if (
    lower.includes('fantastik') || lower.includes('büyü') || lower.includes('fantasy') ||
    lower.includes('magic') || lower.includes('kingdom')
  ) {
    genreIds = '14'; // Fantasy
  } else if (
    lower.includes('savaş') || lower.includes('tarih') || lower.includes('war') ||
    lower.includes('historical') || lower.includes('battle')
  ) {
    genreIds = '10752,36'; // War / History
  } else if (
    lower.includes('western') || lower.includes('kovboy') || lower.includes('spaghetti')
  ) {
    genreIds = '37'; // Western
  }

  // --- 2. YIL & DÖNEM ANALİZİ ---
  if (lower.includes('90lar') || lower.includes("90'lar") || lower.includes('90s') || lower.includes('eski')) {
    year = '1990-2000';
  } else if (lower.includes('80ler') || lower.includes("80'ler") || lower.includes('80s')) {
    year = '1980-1990';
  } else if (lower.includes('70ler') || lower.includes("70'ler") || lower.includes('70s')) {
    year = '1970-1980';
  } else if (lower.includes('yeni') || lower.includes('güncel') || lower.includes('vizyon') || lower.includes('recent') || lower.includes('latest')) {
    year = '2023-2026';
  }

  // --- 3. KALİTE & SIRALAMA ANALİZİ ---
  if (
    lower.includes('en iyi') || lower.includes('puanı yüksek') || lower.includes('kaliteli') ||
    lower.includes('top 250') || lower.includes('masterpiece') || lower.includes('best') ||
    lower.includes('award') || lower.includes('cannes')
  ) {
    sort = 'vote_average.desc';
    minVoteCount = 300;
    minVoteAverage = 7.5;
  }

  return { genreIds, sort, year, minVoteCount, minVoteAverage };
}