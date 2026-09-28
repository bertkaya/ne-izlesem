// Client-safe constants shared by server and client code.
// (Kept out of tmdb.ts because 'use server' modules may only export async functions.)

// --- PLATFORMLAR (RENK KODLARIYLA) ---
export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'border-red-600 text-red-500 bg-red-500/10' },
  { id: 119, name: 'Prime Video', color: 'border-blue-500 text-blue-500 bg-blue-500/10' },
  { id: 337, name: 'Disney+', color: 'border-blue-400 text-blue-400 bg-blue-400/10' },
  { id: 342, name: 'HBO Max (BluTV)', color: 'border-teal-500 text-teal-500 bg-teal-500/10' },
  { id: 365, name: 'TV+', color: 'border-yellow-500 text-yellow-500 bg-yellow-500/10' },
  { id: 345, name: 'TOD', color: 'border-purple-500 text-purple-500 bg-purple-500/10' }
];

export const MOOD_TO_MOVIE_GENRE = {
  funny: '35', scary: '27,53', emotional: '18,10749', action: '28,12', scifi: '878,14', crime: '80', relax: '99',
  fantasy: '14,12', history: '36', war: '10752', western: '37', music: '10402', mystery: '9648',
  anime: '16', family: '10751', doc: '99',
  travel: '99,12', sport: '99,18', tech: '99,878', news: '99', popculture: '99'
};

export const MOOD_TO_TV_GENRE = {
  funny: '35', scary: '9648,10765', emotional: '18', action: '10759', scifi: '10765', crime: '80', relax: '99,10764',
  fantasy: '10765', war: '10768', soap: '10766', kids: '10762', reality: '10764',
  anime: '16', family: '10751', doc: '99',
  travel: '99,10764', sport: '10764', tech: '99', news: '10763', music: '10402', popculture: '10764'
};

export const MOOD_TO_YOUTUBE_KEYWORDS = {
  funny: ['Güldür Güldür', 'Konuşanlar', 'Stand up', 'Komik Anlar', 'Cem Yılmaz'],
  eat: ['Sokak Lezzetleri', 'Yemek Yeme', 'Mukbang', 'Gurme', 'Kebap', 'Burger'],
  classic: ['Vine Compilation', 'Efsane Replikler', 'Beyaz Show Komik', 'Unutulmaz Anlar'],
  pets: ['Komik Kediler', 'Yavru Köpek', 'Sevimli Hayvanlar', 'Kedi Videoları'],
  relax: ['Doğa Yürüyüşü', 'Rahatlatıcı Müzik', 'Manzara 4K', 'Restorasyon'],
  learn: ['Barış Özcan', 'Ruhi Çenet', 'Belgesel', 'Nasıl Yapılır', 'TEDx'],
  drama: ['Kısa Film', 'Dramatik Sahne', 'Hayat Hikayesi'],
  travel: ['Gezi Vlog', 'Dünya Turu', 'Tatil', 'Kamp', 'Şehir Rehberi', 'Rotasız Seyyah'],
  sport: ['Maç Özetleri', 'Spor Haberleri', 'NBA Highlights', 'Formula 1', 'Goller'],
  tech: ['Teknoloji Haberleri', 'Ürün İnceleme', 'Telefon Karşılaştırma', 'Bilgisayar Toplama', 'Webtekno'],
  news: ['Haber Bülteni', 'Gündem', 'Tartışma Programı', 'Dünya Ekonomisi', 'Cüneyt Özdemir'],
  music: ['Akustik Performans', 'Konser Kaydı', 'Canlı Müzik', 'Lo-Fi Hip Hop', 'Tiny Desk'],
  popculture: ['Magazin D', 'Ünlülerin Hayatı', 'Röportaj', 'Paparazzi', 'Magazin Haberleri']
};

// YouTube video kategorileri (admin paneli ve server action doğrulaması için tek kaynak)
export const VIDEO_MOODS = Object.keys(MOOD_TO_YOUTUBE_KEYWORDS) as (keyof typeof MOOD_TO_YOUTUBE_KEYWORDS)[];
export const VIDEO_DURATIONS = ['snack', 'meal', 'feast'] as const;
export const VIDEO_LANGUAGES = ['tr', 'en'] as const;

// TMDB tür ID'lerinin okunabilir adları (Sommelier gerekçeleri için)
export const TMDB_GENRE_NAMES: Record<'tr' | 'en', Record<number, string>> = {
  tr: {
    28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi', 80: 'Suç', 99: 'Belgesel', 18: 'Dram',
    10751: 'Aile', 14: 'Fantastik', 36: 'Tarih', 27: 'Korku', 10402: 'Müzik', 9648: 'Gizem', 10749: 'Romantik',
    878: 'Bilim Kurgu', 10770: 'TV Filmi', 53: 'Gerilim', 10752: 'Savaş', 37: 'Western',
    10759: 'Aksiyon & Macera', 10762: 'Çocuk', 10763: 'Haber', 10764: 'Reality', 10765: 'Bilim Kurgu & Fantastik',
    10766: 'Pembe Dizi', 10767: 'Talk Show', 10768: 'Savaş & Politika'
  },
  en: {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama',
    10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
    878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
    10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  }
};
