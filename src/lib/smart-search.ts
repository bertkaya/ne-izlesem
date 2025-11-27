import { MOOD_TO_MOVIE_GENRE } from './tmdb'

interface SearchParams {
  genreIds: string;
  year?: string;
  sort: string;
}

export function analyzePrompt(text: string): SearchParams {
  const lowerText = text.toLowerCase();
  
  let genreIds = '35'; // Varsayılan: Komedi
  let sort = 'popularity.desc';
  let year = '';

  // --- 1. TÜR ANALİZİ ---
  if (lowerText.includes('korku') || lowerText.includes('gerilim') || lowerText.includes('ürpertici')) genreIds = MOOD_TO_MOVIE_GENRE.scary;
  else if (lowerText.includes('komik') || lowerText.includes('eğlence') || lowerText.includes('gülmek')) genreIds = MOOD_TO_MOVIE_GENRE.funny;
  else if (lowerText.includes('ağlamak') || lowerText.includes('duygusal') || lowerText.includes('dram')) genreIds = MOOD_TO_MOVIE_GENRE.emotional;
  else if (lowerText.includes('aksiyon') || lowerText.includes('vurdu') || lowerText.includes('macera')) genreIds = MOOD_TO_MOVIE_GENRE.action;
  else if (lowerText.includes('bilim') || lowerText.includes('uzay') || lowerText.includes('gelecek')) genreIds = MOOD_TO_MOVIE_GENRE.scifi;
  else if (lowerText.includes('suç') || lowerText.includes('polis') || lowerText.includes('mafya')) genreIds = MOOD_TO_MOVIE_GENRE.crime;
  else if (lowerText.includes('belgesel') || lowerText.includes('öğren') || lowerText.includes('sakin')) genreIds = MOOD_TO_MOVIE_GENRE.relax;

  // --- 2. YIL ANALİZİ ---
  if (lowerText.includes('90lar') || lowerText.includes('90\'lar') || lowerText.includes('eski')) year = '1990-2000';
  if (lowerText.includes('80ler') || lowerText.includes('80\'ler')) year = '1980-1990';
  if (lowerText.includes('yeni') || lowerText.includes('güncel') || lowerText.includes('vizyon')) year = '2023-2025';

  // --- 3. SIRALAMA ANALİZİ ---
  if (lowerText.includes('en iyi') || lowerText.includes('puanı yüksek') || lowerText.includes('kaliteli')) sort = 'vote_average.desc';

  return { genreIds, sort, year };
}