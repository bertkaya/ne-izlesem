// Curated Offline / Fallback Catalog for Ne İzlesem?
// Used seamlessly when TMDB API key is missing, invalid (401), or network is unreachable.

import type { MediaItem, TmdbProvider } from '@/types/media';

export interface FallbackSeason {
  season_number: number;
  episode_count: number;
}

export interface FallbackCatalogEntry extends MediaItem {
  media_type: 'movie' | 'tv';
  original_language: string;
  moods: string[];
  seasons?: FallbackSeason[];
  episodesBySeason?: Record<
    number,
    Array<{
      name: string;
      overview: string;
      still_path: string | null;
      season_number: number;
      episode_number: number;
      vote_average: number;
    }>
  >;
}

const GENRE_NAMES: Record<number, string> = {
  28: 'Aksiyon',
  12: 'Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Dram',
  10751: 'Aile',
  14: 'Fantastik',
  36: 'Tarih',
  27: 'Korku',
  10402: 'Müzik',
  9648: 'Gizem',
  10749: 'Romantik',
  878: 'Bilim Kurgu',
  53: 'Gerilim',
  10752: 'Savaş',
  37: 'Vahşi Batı',
  10759: 'Aksiyon & Macera',
  10765: 'Bilim Kurgu & Fantazi',
  10768: 'Savaş & Politik',
};

const PROVIDERS: Record<string, TmdbProvider> = {
  netflix: { provider_id: 8, provider_name: 'Netflix', logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
  prime: { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/dQeAar5H991VYporEjUspolDarG.jpg' },
  disney: { provider_id: 337, provider_name: 'Disney Plus', logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg' },
  mubi: { provider_id: 11, provider_name: 'MUBI', logo_path: '/bVR4Z1LCHY7gidXAJF5pMa4QrDS.jpg' },
  blutv: { provider_id: 341, provider_name: 'BluTV', logo_path: '/hR9vWd8hWEVQKD6eOnBneKRFEW3.jpg' },
  apple: { provider_id: 350, provider_name: 'Apple TV+', logo_path: '/2E03IAZsX4ZaUqM7tXlctEPMGWS.jpg' },
};

function makeGenres(ids: number[]): { id: number; name: string }[] {
  return ids.map((id) => ({ id, name: GENRE_NAMES[id] || 'Dram' }));
}

function makeProviders(keys: Array<keyof typeof PROVIDERS>) {
  return {
    results: {
      TR: {
        flatrate: keys.map((k) => PROVIDERS[k]),
      },
    },
  };
}

function makeTrailer(key: string) {
  return {
    results: [
      {
        key,
        site: 'YouTube',
        type: 'Trailer',
        official: true,
      },
    ],
  };
}

export const FALLBACK_CATALOG: FallbackCatalogEntry[] = [
  // ======================== TURKISH MOVIES ========================
  {
    id: 245891,
    media_type: 'movie',
    title: 'Kış Uykusu',
    original_language: 'tr',
    overview:
      'Kapadokya’da küçük bir otel işleten emekli tiyatrocu Aydın, genç eşi Nihal ve boşanmış kız kardeşi Necla ile kış bastırdıkça derinleşen bir iç hesaplaşmaya girer.',
    poster_path: '/fM4n0jH2qE4rE8x5xH4u0jT0K1P.jpg',
    backdrop_path: '/kG9bF7vR1sT2wZ4yX8cP6mN3qL0.jpg',
    release_date: '2014-06-13',
    vote_average: 8.1,
    vote_count: 1450,
    runtime: 196,
    genre_ids: [18],
    genres: makeGenres([18]),
    videos: makeTrailer('PLb62Mm7bdM'),
    'watch/providers': makeProviders(['mubi', 'netflix']),
    moods: ['thought_provoking', 'emotional', 'oscar_worthy'],
    fromFallback: true,
  },
  {
    id: 72784,
    media_type: 'movie',
    title: "Bir Zamanlar Anadolu'da",
    original_language: 'tr',
    overview:
      'Bozkırın ortasında bir cinayet zanlısının gömdüğü cesedi arayan savcı, komiser ve doktorun gece boyunca süren vicdan ve hakikat yolculuğu.',
    poster_path: '/9xG4c8yT7mN2kL5pQ1vW3zR6jF0.jpg',
    backdrop_path: '/bN5mK2pL8vQ4xR7yW1zT3cG6jH0.jpg',
    release_date: '2011-09-23',
    vote_average: 7.9,
    vote_count: 1320,
    runtime: 157,
    genre_ids: [18, 80],
    genres: makeGenres([18, 80]),
    videos: makeTrailer('cfn3a5S1b2Q'),
    'watch/providers': makeProviders(['mubi']),
    moods: ['thought_provoking', 'dark', 'mystery'],
    fromFallback: true,
  },
  {
    id: 19404,
    media_type: 'movie',
    title: 'Babam ve Oğlum',
    original_language: 'tr',
    overview:
      '12 Eylül darbesinde eşini kaybeden gazeteci Sadık, yıllar sonra küçük oğlu Deniz ile Ege’deki baba evine döner. Kuşaklar arası kırgınlıklar yerini derin bir sevgiye bırakır.',
    poster_path: '/6xR2pL8vQ4mN7yW1zT3cG5jK9f0.jpg',
    backdrop_path: '/wZ4yX8cP6mN3qL0kG9bF7vR1sT2.jpg',
    release_date: '2005-11-18',
    vote_average: 8.2,
    vote_count: 1680,
    runtime: 112,
    genre_ids: [18, 10751],
    genres: makeGenres([18, 10751]),
    videos: makeTrailer('2h9xK4mN8pQ'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['emotional', 'tearjerker', 'family'],
    fromFallback: true,
  },
  {
    id: 313369,
    media_type: 'movie',
    title: 'Eşkıya',
    original_language: 'tr',
    overview:
      '35 yıl hapis yattıktan sonra serbest kalan Baran, kendisine ihanet eden en yakın arkadaşını ve çocukluk aşkı Keje’yi bulmak için İstanbul’un arka sokaklarına gelir.',
    poster_path: '/pL8vQ4mN7yW1zT3cG5jK9f06xR2.jpg',
    backdrop_path: '/mN3qL0kG9bF7vR1sT2wZ4yX8cP6.jpg',
    release_date: '1996-11-29',
    vote_average: 8.3,
    vote_count: 1520,
    runtime: 128,
    genre_ids: [18, 80, 53],
    genres: makeGenres([18, 80, 53]),
    videos: makeTrailer('7xR9mN2pL4Q'),
    'watch/providers': makeProviders(['netflix', 'blutv']),
    moods: ['emotional', 'crime', 'classic'],
    fromFallback: true,
  },
  {
    id: 21575,
    media_type: 'movie',
    title: 'G.O.R.A.',
    original_language: 'tr',
    overview:
      'Halı tüccarı Arif, uzaylılar tarafından kaçırılıp G.O.R.A. gezegenine götürülür. Gezegeni kurtarmak ve Dünya’ya dönmek için komik bir maceraya atılır.',
    poster_path: '/yW1zT3cG5jK9f06xR2pL8vQ4mN7.jpg',
    backdrop_path: '/kG9bF7vR1sT2wZ4yX8cP6mN3qL0.jpg',
    release_date: '2004-11-12',
    vote_average: 7.8,
    vote_count: 1890,
    runtime: 127,
    genre_ids: [35, 878, 12],
    genres: makeGenres([35, 878, 12]),
    videos: makeTrailer('fM4n0jH2qE4'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['feel_good', 'funny', 'scifi'],
    fromFallback: true,
  },
  {
    id: 416477,
    media_type: 'movie',
    title: 'Ahlat Ağacı',
    original_language: 'tr',
    overview:
      'Üniversiteden mezun olup yazdığı kitabı bastırmaya çalışan genç Sinan, kasabasına döndüğünde babası İdris’in borçları ve taşranın gerçekleriyle yüzleşir.',
    poster_path: '/cG5jK9f06xR2pL8vQ4mN7yW1zT3.jpg',
    backdrop_path: '/vR1sT2wZ4yX8cP6mN3qL0kG9bF7.jpg',
    release_date: '2018-06-01',
    vote_average: 8.0,
    vote_count: 980,
    runtime: 188,
    genre_ids: [18],
    genres: makeGenres([18]),
    videos: makeTrailer('zT3cG5jK9f0'),
    'watch/providers': makeProviders(['mubi']),
    moods: ['thought_provoking', 'emotional'],
    fromFallback: true,
  },
  {
    id: 899112,
    media_type: 'movie',
    title: 'Kurak Günler',
    original_language: 'tr',
    overview:
      'Su sorunu yaşayan Yanıklar kasabasına yeni atanan genç savcı Emre, yerel siyaset, gazeteci Murat ve kasaba eşrafı arasındaki gerilim dolu ağın ortasında kalır.',
    poster_path: '/qL0kG9bF7vR1sT2wZ4yX8cP6mN3.jpg',
    backdrop_path: '/x8cP6mN3qL0kG9bF7vR1sT2wZ4y.jpg',
    release_date: '2022-12-09',
    vote_average: 7.7,
    vote_count: 740,
    runtime: 129,
    genre_ids: [18, 53, 9648],
    genres: makeGenres([18, 53, 9648]),
    videos: makeTrailer('mN3qL0kG9bF'),
    'watch/providers': makeProviders(['netflix', 'mubi']),
    moods: ['tense', 'mystery', 'thought_provoking'],
    fromFallback: true,
  },
  {
    id: 484468,
    media_type: 'movie',
    title: 'Kelebeğin Rüyası',
    original_language: 'tr',
    overview:
      '1940’ların Zonguldak’ında yaşayan iki genç şair Rüştü Onur ve Muzaffer Tayyip Uslu, verem ve zorlu yaşam koşullarına rağmen şiir ve aşkla hayata tutunur.',
    poster_path: '/sT2wZ4yX8cP6mN3qL0kG9bF7vR1.jpg',
    backdrop_path: '/p6mN3qL0kG9bF7vR1sT2wZ4yX8c.jpg',
    release_date: '2013-02-22',
    vote_average: 7.7,
    vote_count: 860,
    runtime: 138,
    genre_ids: [18, 10749, 36],
    genres: makeGenres([18, 10749, 36]),
    videos: makeTrailer('bF7vR1sT2wZ'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['romantic', 'emotional', 'historical'],
    fromFallback: true,
  },
  {
    id: 40096,
    media_type: 'movie',
    title: 'Hababam Sınıfı',
    original_language: 'tr',
    overview:
      'Özel Çamlıca Lisesi’nin haylaz öğrencileri, yeni atanan disiplinli ama altın kalpli müdür muavini Mahmut Hoca ile unutulmaz bir dostluk ve ders süreci yaşar.',
    poster_path: '/h2qE4rE8x5xH4u0jT0K1PfM4n0j.jpg',
    backdrop_path: '/r1sT2wZ4yX8cP6mN3qL0kG9bF7v.jpg',
    release_date: '1975-04-01',
    vote_average: 8.8,
    vote_count: 1410,
    runtime: 87,
    genre_ids: [35, 18, 10751],
    genres: makeGenres([35, 18, 10751]),
    videos: makeTrailer('E4rE8x5xH4u'),
    'watch/providers': makeProviders(['blutv']),
    moods: ['feel_good', 'funny', 'classic', 'short'],
    fromFallback: true,
  },
  {
    id: 476335,
    media_type: 'movie',
    title: 'Ayla',
    original_language: 'tr',
    overview:
      'Kore Savaşı’nda kimsesiz kalan küçük bir kız çocuğunu sahiplenen Astsubay Süleyman Dilbirliği ile Ayla arasındaki sınırları aşan sevgi hikayesi.',
    poster_path: '/x5xH4u0jT0K1PfM4n0jh2qE4rE8.jpg',
    backdrop_path: '/wZ4yX8cP6mN3qL0kG9bF7vR1sT2.jpg',
    release_date: '2017-10-27',
    vote_average: 8.1,
    vote_count: 1120,
    runtime: 125,
    genre_ids: [18, 36, 10752],
    genres: makeGenres([18, 36, 10752]),
    videos: makeTrailer('u0jT0K1PfM4'),
    'watch/providers': makeProviders(['netflix', 'disney']),
    moods: ['emotional', 'tearjerker', 'historical'],
    fromFallback: true,
  },

  // ======================== WORLD CINEMA MOVIES ========================
  {
    id: 27205,
    media_type: 'movie',
    title: 'Başlangıç (Inception)',
    original_language: 'en',
    overview:
      'Bilinçaltının derinliklerinden sırları çalan yetenekli hırsız Dom Cobb, bu kez imkansız olanı başarmak ve bir fikri zihne yerleştirmek için rüya içinde rüya kurar.',
    poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    release_date: '2010-07-16',
    vote_average: 8.8,
    vote_count: 35400,
    runtime: 148,
    genre_ids: [28, 878, 12, 53],
    genres: makeGenres([28, 878, 12, 53]),
    videos: makeTrailer('YoHD9XEInc0'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['mind_bending', 'adrenaline', 'scifi'],
    fromFallback: true,
  },
  {
    id: 157336,
    media_type: 'movie',
    title: 'Yıldızlararası (Interstellar)',
    original_language: 'en',
    overview:
      'Dünya’daki yaşam sona yaklaşırken bir grup kaşif, insanlığın geleceğini kurtarmak için yeni keşfedilen bir solucan deliğinden geçerek yıldızlararası bir yolculuğa çıkar.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-05',
    vote_average: 8.7,
    vote_count: 34200,
    runtime: 169,
    genre_ids: [12, 18, 878],
    genres: makeGenres([12, 18, 878]),
    videos: makeTrailer('zSWdZVtXT7E'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['mind_bending', 'emotional', 'scifi'],
    fromFallback: true,
  },
  {
    id: 496243,
    media_type: 'movie',
    title: 'Parazit (Parasite)',
    original_language: 'ko',
    overview:
      'Yoksul Kim ailesi, kurnazca planlarla varlıklı Park ailesinin evinde teker teker işe girer; ancak evin bodrumundaki beklenmedik sır her şeyi altüst eder.',
    poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop_path: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
    release_date: '2019-05-30',
    vote_average: 8.5,
    vote_count: 17900,
    runtime: 132,
    genre_ids: [35, 53, 18],
    genres: makeGenres([35, 53, 18]),
    videos: makeTrailer('5xH0HfJHsaY'),
    'watch/providers': makeProviders(['mubi', 'prime']),
    moods: ['tense', 'thought_provoking', 'oscar_worthy'],
    fromFallback: true,
  },
  {
    id: 155,
    media_type: 'movie',
    title: 'Kara Şövalye (The Dark Knight)',
    original_language: 'en',
    overview:
      'Batman, Teğmen Gordon ve Savcı Harvey Dent, Gotham sokaklarını kaosa sürükleyen anarşist deha Joker’i durdurmak için kendi ahlaki sınırlarıyla yüzleşir.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    release_date: '2008-07-18',
    vote_average: 9.0,
    vote_count: 32100,
    runtime: 152,
    genre_ids: [18, 28, 80, 53],
    genres: makeGenres([18, 28, 80, 53]),
    videos: makeTrailer('EXeTwQWrcwY'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['adrenaline', 'dark', 'crime'],
    fromFallback: true,
  },
  {
    id: 244786,
    media_type: 'movie',
    title: 'Whiplash',
    original_language: 'en',
    overview:
      'Genç ve hırslı caz davulcusu Andrew, konservatuvarın acımasız orkestra şefi Terence Fletcher’ın sınırları zorlayan mükemmelliyetçiliğiyle psikolojik bir savaşa girer.',
    poster_path: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    backdrop_path: '/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg',
    release_date: '2014-10-10',
    vote_average: 8.5,
    vote_count: 14800,
    runtime: 107,
    genre_ids: [18, 10402],
    genres: makeGenres([18, 10402]),
    videos: makeTrailer('7d_jQycdQGo'),
    'watch/providers': makeProviders(['netflix', 'mubi']),
    moods: ['tense', 'adrenaline', 'oscar_worthy'],
    fromFallback: true,
  },
  {
    id: 120467,
    media_type: 'movie',
    title: 'Büyük Budapeşte Oteli (The Grand Budapest Hotel)',
    original_language: 'en',
    overview:
      'İki savaş arası dönemde ünlü bir Avrupa otelinin efsanevi konsiyerji Gustave H. ile genç lobi görevlisi Zero Moustafa’nın çalınan bir Rönesans tablosu etrafındaki serüveni.',
    poster_path: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',
    backdrop_path: '/xHDynIimfsgj0ZOs0j5ma8v1vmM.jpg',
    release_date: '2014-03-07',
    vote_average: 8.1,
    vote_count: 14200,
    runtime: 100,
    genre_ids: [35, 18, 12],
    genres: makeGenres([35, 18, 12]),
    videos: makeTrailer('1Fg5iWmQjwk'),
    'watch/providers': makeProviders(['disney']),
    moods: ['feel_good', 'funny', 'short'],
    fromFallback: true,
  },
  {
    id: 129,
    media_type: 'movie',
    title: 'Ruhların Kaçışı (Spirited Away)',
    original_language: 'ja',
    overview:
      'Yeni taşındıkları kasabada ailesiyle birlikte gizemli bir ruhlar dünyasına adım atan 10 yaşındaki Chihiro, anne ve babasını kurtarmak için cadı Yubaba’nın hamamında çalışmak zorunda kalır.',
    poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdrop_path: '/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
    release_date: '2001-07-20',
    vote_average: 8.6,
    vote_count: 16100,
    runtime: 125,
    genre_ids: [16, 10751, 14],
    genres: makeGenres([16, 10751, 14]),
    videos: makeTrailer('ByXuk9QqQkk'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['feel_good', 'family', 'fantasy'],
    fromFallback: true,
  },
  {
    id: 146233,
    media_type: 'movie',
    title: 'Tutsak (Prisoners)',
    original_language: 'en',
    overview:
      'Şükran Günü’nde küçük kızı ve arkadaşı kaybolan çaresiz baba Keller Dover, polisin yetersiz kaldığını düşünerek adaleti kendi elleriyle aramaya karar verir.',
    poster_path: '/uhviyknTT5cEQXbn6vWIqfM4vGm.jpg',
    backdrop_path: '/o6125k2c03G3R2s2C1wG5V6X8nZ.jpg',
    release_date: '2013-09-20',
    vote_average: 8.1,
    vote_count: 11500,
    runtime: 153,
    genre_ids: [18, 53, 80, 9648],
    genres: makeGenres([18, 53, 80, 9648]),
    videos: makeTrailer('bpXfcTF6iVk'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['tense', 'mystery', 'dark'],
    fromFallback: true,
  },
  {
    id: 419430,
    media_type: 'movie',
    title: 'Kapan (Get Out)',
    original_language: 'en',
    overview:
      'Genç fotoğrafçı Chris, kız arkadaşı Rose’un ailesiyle tanışmak için hafta sonu malikanelerine gider; ancak aşırı kibar başlayan ağırlama korkunç bir gerçeğe dönüşür.',
    poster_path: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    backdrop_path: '/vZ3h8R9bM2pL5qW1xT4cG7jK0nF.jpg',
    release_date: '2017-02-24',
    vote_average: 7.7,
    vote_count: 16900,
    runtime: 104,
    genre_ids: [9648, 53, 27],
    genres: makeGenres([9648, 53, 27]),
    videos: makeTrailer('DzfpyUB60YY'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['tense', 'horror', 'mystery', 'short'],
    fromFallback: true,
  },
  {
    id: 546554,
    media_type: 'movie',
    title: 'Bıçaklar Çekildi (Knives Out)',
    original_language: 'en',
    overview:
      'Ünlü polisiye yazarı Harlan Thrombey, 85. yaş günü partisinin hemen ardından malikanesinde ölü bulunur. Eksantrik dedektif Benoit Blanc, herkesin şüpheli olduğu aileyi sorgular.',
    poster_path: '/pThyQovXQrw2m0s9x82twj48Jq4.jpg',
    backdrop_path: '/4HWAQu28e2yaWrtupFPGFkdNU7V.jpg',
    release_date: '2019-11-27',
    vote_average: 7.9,
    vote_count: 12100,
    runtime: 130,
    genre_ids: [35, 80, 9648],
    genres: makeGenres([35, 80, 9648]),
    videos: makeTrailer('qGqiHJTsRkQ'),
    'watch/providers': makeProviders(['netflix', 'apple']),
    moods: ['mystery', 'feel_good', 'funny'],
    fromFallback: true,
  },
  {
    id: 693134,
    media_type: 'movie',
    title: 'Dune: Çöl Gezegeni Bölüm İki',
    original_language: 'en',
    overview:
      'Paul Atreides, ailesini yok eden komploculara karşı intikam yolunda Chani ve Fremenlerle birleşir; evrenin kaderiyle kalbinin sesi arasında destansı bir seçim yapar.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    release_date: '2024-02-28',
    vote_average: 8.5,
    vote_count: 9800,
    runtime: 166,
    genre_ids: [878, 12, 28],
    genres: makeGenres([878, 12, 28]),
    videos: makeTrailer('Way9Dexny3w'),
    'watch/providers': makeProviders(['blutv', 'apple']),
    moods: ['adrenaline', 'scifi', 'oscar_worthy'],
    fromFallback: true,
  },
  {
    id: 3133690,
    media_type: 'movie',
    title: 'Aşıklar Şehri (La La Land)',
    original_language: 'en',
    overview:
      'Los Angeles’ta tutkuyla hayallerinin peşinden koşan caz piyanisti Sebastian ve oyuncu adayı Mia, aşkları ile kariyer hedefleri arasında büyüleyici bir denge kurmaya çalışır.',
    poster_path: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    backdrop_path: '/qJeU7KM4nT2C1WpOrwPcSDGFUWE.jpg',
    release_date: '2016-12-09',
    vote_average: 8.0,
    vote_count: 19600,
    runtime: 128,
    genre_ids: [35, 18, 10749, 10402],
    genres: makeGenres([35, 18, 10749, 10402]),
    videos: makeTrailer('0pdqf4P9MB8'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['romantic', 'feel_good', 'emotional'],
    fromFallback: true,
  },
  {
    id: 329865,
    media_type: 'movie',
    title: 'Geliş (Arrival)',
    original_language: 'en',
    overview:
      'Dünya’nın on iki farklı noktasına gizemli uzay gemileri indiğinde, dilbilimci Louise Banks uzaylıların dilini çözmek ve küresel bir savaşı önlemek için zamana karşı yarışır.',
    poster_path: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
    backdrop_path: '/yIZ1xendyqKvY3FGeeUYUd5X9Mm.jpg',
    release_date: '2016-11-11',
    vote_average: 7.9,
    vote_count: 17400,
    runtime: 116,
    genre_ids: [18, 878, 9648],
    genres: makeGenres([18, 878, 9648]),
    videos: makeTrailer('tFMo3UJ4B4g'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['mind_bending', 'thought_provoking', 'scifi'],
    fromFallback: true,
  },
  {
    id: 278,
    media_type: 'movie',
    title: 'Esaretin Bedeli (The Shawshank Redemption)',
    original_language: 'en',
    overview:
      'Haksız yere müebbet hapse mahkum edilen bankacı Andy Dufresne, Shawshank Hapishanesi’nde Red ile kurduğu derin dostluk ve sarsılmaz umuduyla yıllara meydan okur.',
    poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    release_date: '1994-09-23',
    vote_average: 9.3,
    vote_count: 26800,
    runtime: 142,
    genre_ids: [18, 80],
    genres: makeGenres([18, 80]),
    videos: makeTrailer('PLl99DlL6b4'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['emotional', 'feel_good', 'oscar_worthy'],
    fromFallback: true,
  },
  {
    id: 807,
    media_type: 'movie',
    title: 'Yedi (Se7en)',
    original_language: 'en',
    overview:
      'Emekliliğine günler kalan kıdemli dedektif Somerset ve genç ortağı Mills, yedi ölümcül günahı temel alarak cinayetler işleyen zeki bir seri katilin peşine düşer.',
    poster_path: '/6yoghtyTpznpBik8EngEmJskVUO.jpg',
    backdrop_path: '/i5H7zusQGsysGQ8i6P361Vnr0n2.jpg',
    release_date: '1995-09-22',
    vote_average: 8.6,
    vote_count: 20400,
    runtime: 127,
    genre_ids: [80, 9648, 53],
    genres: makeGenres([80, 9648, 53]),
    videos: makeTrailer('znmZoVkCjpI'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['dark', 'tense', 'mystery'],
    fromFallback: true,
  },
  {
    id: 1124,
    media_type: 'movie',
    title: 'Prestij (The Prestige)',
    original_language: 'en',
    overview:
      '19. yüzyıl sonu Londra’sında iki rakip illüzyonist Robert Angier ve Alfred Borden, kusursuz ışınlanma numarasını yaratmak uğruna tehlikeli bir saplantıya sürüklenir.',
    poster_path: '/bdN3gXuIZYaJP7ftKK2sU0nPtEA.jpg',
    backdrop_path: '/mfJepkInUbiZ0mFXFhDNz8ko6Zr.jpg',
    release_date: '2006-10-20',
    vote_average: 8.5,
    vote_count: 15800,
    runtime: 130,
    genre_ids: [18, 9648, 878, 53],
    genres: makeGenres([18, 9648, 878, 53]),
    videos: makeTrailer('RLtaA9fFNXU'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['mind_bending', 'mystery', 'tense'],
    fromFallback: true,
  },

  // ======================== TURKISH TV SERIES ========================
  {
    id: 78191,
    media_type: 'tv',
    name: 'Şahsiyet',
    original_language: 'tr',
    overview:
      'Alzheimer başlangıcı teşhisi konulan emekli adliye memuru Agâh Beyoğlu, hastalığını bir fırsata çevirerek yıllar önce üstü örtülmüş suçların faillerini cezalandırmaya karar verir.',
    poster_path: '/pL8vQ4mN7yW1zT3cG5jK9f06xR3.jpg',
    backdrop_path: '/mN3qL0kG9bF7vR1sT2wZ4yX8cP7.jpg',
    first_air_date: '2018-03-17',
    vote_average: 8.9,
    vote_count: 1420,
    genre_ids: [80, 18, 9648],
    genres: makeGenres([80, 18, 9648]),
    videos: makeTrailer('a1b2c3d4e5f'),
    'watch/providers': makeProviders(['blutv', 'disney']),
    moods: ['dark', 'mystery', 'tense'],
    seasons: [
      { season_number: 1, episode_count: 12 },
      { season_number: 2, episode_count: 10 },
    ],
    episodesBySeason: {
      1: [
        {
          name: '1. Bölüm: Unutmak mı, Hatırlamak mı?',
          overview: 'Agâh Beyoğlu doktorundan aldığı teşhisin ardından hayatını değiştirecek kararı verir; Cinayet Büro’daki tek kadın polis Nevra ilk vakasıyla karşılaşır.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.9,
        },
        {
          name: '2. Bölüm: Kambura',
          overview: 'Kedi kostümlü gizemli cinayetlerin ardındaki mesajlar Nevra’yı geçmişteki Kambura kasabasına doğru çekmeye başlar.',
          still_path: null,
          season_number: 1,
          episode_number: 2,
          vote_average: 9.1,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 115916,
    media_type: 'tv',
    name: 'Gibi',
    original_language: 'tr',
    overview:
      'Yılmaz, İlkkan ve Ersoy’un sıradan günlük aksilikleri bir anda absürt ve içinden çıkılmaz felaketlere dönüştürme konusundaki eşsiz yetenekleri.',
    poster_path: '/g5jK9f06xR2pL8vQ4mN7yW1zT3c.jpg',
    backdrop_path: '/z4yX8cP6mN3qL0kG9bF7vR1sT2w.jpg',
    first_air_date: '2021-01-01',
    vote_average: 8.8,
    vote_count: 1950,
    genre_ids: [35],
    genres: makeGenres([35]),
    videos: makeTrailer('gibi1234567'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['funny', 'feel_good', 'sitcom'],
    seasons: [
      { season_number: 1, episode_count: 12 },
      { season_number: 2, episode_count: 10 },
      { season_number: 3, episode_count: 10 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Kokariç',
          overview: 'Yılmaz ve İlkkan’ın sahte kokoreç skandalı üzerine kurdukları ilkeli direniş beklenmedik boyutlara ulaşır.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.9,
        },
        {
          name: 'Erasmusla Gelen Yamyam',
          overview: 'Ersoy’un babaannesini yiyen Erasmus öğrencisiyle aynı masada medeni bir uzlaşı arayışı.',
          still_path: null,
          season_number: 1,
          episode_number: 4,
          vote_average: 9.4,
        },
      ],
      2: [
        {
          name: 'Kuki',
          overview: 'İlkkan’ın özgür iradesiyle aldığı tuhaf kararlar Yılmaz ve Ersoy’un sınırlarını zorlar.',
          still_path: null,
          season_number: 2,
          episode_number: 3,
          vote_average: 9.3,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 40564,
    media_type: 'tv',
    name: 'Leyla ile Mecnun',
    original_language: 'tr',
    overview:
      'Beşik kertmesi Leyla’ya kavuşmak için çölleri aşmaya hazır Mecnun; İskender Baba, İsmail Abi, Erdal Bakkal ve Yavuz Hırsız ile Kireçburnu sahilinde absürt ve sıcacık bir masal yaşar.',
    poster_path: '/t3cG5jK9f06xR2pL8vQ4mN7yW1z.jpg',
    backdrop_path: '/f7vR1sT2wZ4yX8cP6mN3qL0kG9b.jpg',
    first_air_date: '2011-02-09',
    vote_average: 9.0,
    vote_count: 2100,
    genre_ids: [35, 18, 10765],
    genres: makeGenres([35, 18, 10765]),
    videos: makeTrailer('leyla123456'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['funny', 'emotional', 'feel_good', 'sitcom'],
    seasons: [
      { season_number: 1, episode_count: 20 },
      { season_number: 2, episode_count: 41 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Pilot: O Gemi Bir Gün Gelecek',
          overview: 'Doğdukları gün hastanede yatakların yetersizliği yüzünden yan yana yatırılan Mecnun ve Leyla 25 yıl sonra yeniden karşılaşır.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 9.1,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 61818,
    media_type: 'tv',
    name: 'Avrupa Yakası',
    original_language: 'tr',
    overview:
      'Nişantaşı’nda yaşayan Sütçüoğlu ailesi ile Avrupa Yakası dergisi çalışanlarının Burhan Altıntop, Volkan ve Aslı etrafında dönen kahkaha dolu hikayesi.',
    poster_path: '/r2pL8vQ4mN7yW1zT3cG5jK9f06x.jpg',
    backdrop_path: '/n3qL0kG9bF7vR1sT2wZ4yX8cP6m.jpg',
    first_air_date: '2004-02-11',
    vote_average: 8.6,
    vote_count: 1380,
    genre_ids: [35, 10751],
    genres: makeGenres([35, 10751]),
    videos: makeTrailer('avrupa12345'),
    'watch/providers': makeProviders(['blutv']),
    moods: ['funny', 'feel_good', 'sitcom'],
    seasons: [
      { season_number: 1, episode_count: 19 },
      { season_number: 2, episode_count: 39 },
      { season_number: 3, episode_count: 35 },
    ],
    episodesBySeason: {
      3: [
        {
          name: 'Burhan Altıntop Dergide!',
          overview: 'İdari müdür olarak göreve başlayan Burhan Altıntop, Nişantaşı ve ofis dengelerini baştan aşağı değiştirir.',
          still_path: null,
          season_number: 3,
          episode_number: 1,
          vote_average: 9.2,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 112888,
    media_type: 'tv',
    name: 'Bir Başkadır',
    original_language: 'tr',
    overview:
      'Farklı sosyo-ekonomik geçmişlerden gelen bir grup insanın yolu, İstanbul’da psikiyatrist Peri’nin muayenehanesinde ve beklenmedik kesişmelerde bir araya gelir.',
    poster_path: '/mN7yW1zT3cG5jK9f06xR2pL8vQ4.jpg',
    backdrop_path: '/cP6mN3qL0kG9bF7vR1sT2wZ4yX8.jpg',
    first_air_date: '2020-11-12',
    vote_average: 8.5,
    vote_count: 1290,
    genre_ids: [18],
    genres: makeGenres([18]),
    videos: makeTrailer('birbaskadir'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['thought_provoking', 'emotional'],
    seasons: [{ season_number: 1, episode_count: 8 }],
    episodesBySeason: {
      1: [
        {
          name: '1. Bölüm',
          overview: 'Bayılma nöbetleri geçiren Meryem, psikiyatrist Peri ile ilk görüşmesini gerçekleştirir.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.7,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 37854,
    media_type: 'tv',
    name: 'Behzat Ç.: Bir Ankara Polisiyesi',
    original_language: 'tr',
    overview:
      'Ankara Cinayet Büro Başkomiseri Behzat Ç. ve ekibi Harun, Hayalet ve Akbaba; kuralları zorlayan yöntemleriyle başkentin karanlık cinayetlerini aydınlatır.',
    poster_path: '/w1zT3cG5jK9f06xR2pL8vQ4mN7y.jpg',
    backdrop_path: '/g9bF7vR1sT2wZ4yX8cP6mN3qL0k.jpg',
    first_air_date: '2010-09-19',
    vote_average: 8.8,
    vote_count: 1620,
    genre_ids: [80, 18, 9648],
    genres: makeGenres([80, 18, 9648]),
    videos: makeTrailer('behzat12345'),
    'watch/providers': makeProviders(['blutv']),
    moods: ['crime', 'dark', 'mystery'],
    seasons: [
      { season_number: 1, episode_count: 38 },
      { season_number: 2, episode_count: 31 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Pilot: Ankara Yanıyor',
          overview: 'Behzat Ç. ve Cinayet Büro ekibi, Ankara’da üst düzey bağlantıları olan karmaşık bir cinayeti çözmek için harekete geçer.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.9,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 229932,
    media_type: 'tv',
    name: 'Prens',
    original_language: 'tr',
    overview:
      'Kimsenin ciddiye almadığı Bongomia Krallığı’nın ortanca prensi, babasının ani ölümünün ardından taht oyunlarının ve absürt saray entrikalarının tam ortasına düşer.',
    poster_path: '/k9f06xR2pL8vQ4mN7yW1zT3cG5j.jpg',
    backdrop_path: '/t2wZ4yX8cP6mN3qL0kG9bF7vR1s.jpg',
    first_air_date: '2023-06-16',
    vote_average: 8.4,
    vote_count: 940,
    genre_ids: [35],
    genres: makeGenres([35]),
    videos: makeTrailer('prens123456'),
    'watch/providers': makeProviders(['blutv']),
    moods: ['funny', 'feel_good', 'sitcom'],
    seasons: [
      { season_number: 1, episode_count: 8 },
      { season_number: 2, episode_count: 7 },
    ],
    episodesBySeason: {
      1: [
        {
          name: '1. Bölüm: Hain Kim?',
          overview: 'Bongomia Kralı’nın şüpheli ölümü sonrası sarayda herkes birbirinden şüphelenir; Prens ise kendi derdindedir.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.6,
        },
      ],
    },
    fromFallback: true,
  },

  // ======================== WORLD TV SERIES ========================
  {
    id: 1396,
    media_type: 'tv',
    name: 'Breaking Bad',
    original_language: 'en',
    overview:
      'Akciğer kanseri teşhisi konulan lise kimya öğretmeni Walter White, ailesinin geleceğini güvenceye almak için eski öğrencisi Jesse Pinkman ile metamfetamin üretmeye başlar.',
    poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    first_air_date: '2008-01-20',
    vote_average: 9.5,
    vote_count: 14200,
    genre_ids: [18, 80],
    genres: makeGenres([18, 80]),
    videos: makeTrailer('HhesaQXLuRY'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['tense', 'crime', 'dark'],
    seasons: [
      { season_number: 1, episode_count: 7 },
      { season_number: 2, episode_count: 13 },
      { season_number: 5, episode_count: 16 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Pilot',
          overview: '50. yaş gününde kanser olduğunu öğrenen Walter White, karavanla çöle çıkarak hayatını değiştirecek ilk adımı atar.',
          still_path: '/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg',
          season_number: 1,
          episode_number: 1,
          vote_average: 9.0,
        },
      ],
      5: [
        {
          name: 'Ozymandias',
          overview: 'Çöldeki hesaplaşmanın ardından Walter’ın kurduğu imparatorluk ve ailesi geri dönülmez biçimde sarsılır.',
          still_path: '/kG9bF7vR1sT2wZ4yX8cP6mN3qL0.jpg',
          season_number: 5,
          episode_number: 14,
          vote_average: 9.9,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 70523,
    media_type: 'tv',
    name: 'Dark',
    original_language: 'de',
    overview:
      'Almanya’nın Winden kasabasında iki çocuğun kaybolması, dört aile arasındaki karanlık sırları ve üç kuşağı birbirine bağlayan bir zaman yolculuğu düğümünü ortaya çıkarır.',
    poster_path: '/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    backdrop_path: '/3lBDg3i6nn5R2NKFCJ6oKyUo2j5.jpg',
    first_air_date: '2017-12-01',
    vote_average: 8.8,
    vote_count: 6800,
    genre_ids: [80, 18, 9648, 10765],
    genres: makeGenres([80, 18, 9648, 10765]),
    videos: makeTrailer('rrwycJ08PSA'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['mind_bending', 'mystery', 'scifi', 'dark'],
    seasons: [
      { season_number: 1, episode_count: 10 },
      { season_number: 2, episode_count: 8 },
      { season_number: 3, episode_count: 8 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Sırlar (Geheimnisse)',
          overview: '2019 yılında Winden ormanındaki mağaranın yakınında kaybolan bir çocuk, kasabanın 33 yıl önceki travmasını yeniden canlandırır.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.6,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 95396,
    media_type: 'tv',
    name: 'Severance',
    original_language: 'en',
    overview:
      'Lumon Industries çalışanları, iş hayatı anıları ile özel hayat anılarını cerrahi bir çiple birbirinden ayıran "ayrıştırma" prosedürüne girer; ancak şirketin karanlık yüzü yavaşça aralanır.',
    poster_path: '/p1fB7vR1sT2wZ4yX8cP6mN3qL0k.jpg',
    backdrop_path: '/h8cP6mN3qL0kG9bF7vR1sT2wZ4y.jpg',
    first_air_date: '2022-02-18',
    vote_average: 8.7,
    vote_count: 3400,
    genre_ids: [18, 9648, 10765],
    genres: makeGenres([18, 9648, 10765]),
    videos: makeTrailer('xEQP4VVuyrY'),
    'watch/providers': makeProviders(['apple']),
    moods: ['mind_bending', 'mystery', 'tense'],
    seasons: [
      { season_number: 1, episode_count: 9 },
      { season_number: 2, episode_count: 10 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Ofis Hakkında İyi Haberler',
          overview: 'Mark Scout, Lumon’daki departmanın başına terfi eder ve yeni çalışan Helly R.’yi oryantasyona alır.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 8.7,
        },
        {
          name: 'Biz Kimiz? (The We We Are)',
          overview: 'Dış dünyadaki kimliklerinde মাত্র birkaç dakikalığına uyanan ekip, sarsıcı gerçeklerle yüzleşir.',
          still_path: null,
          season_number: 1,
          episode_number: 9,
          vote_average: 9.7,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 76331,
    media_type: 'tv',
    name: 'Succession',
    original_language: 'en',
    overview:
      'Küresel medya imparatorluğu Waystar RoyCo’nun yaşlanan patronu Logan Roy’un sağlığı bozulunca, dört çocuğu güç ve koltuk için acımasız bir aile içi savaşa tutuşur.',
    poster_path: '/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg',
    backdrop_path: '/aZ4yX8cP6mN3qL0kG9bF7vR1sT2.jpg',
    first_air_date: '2018-06-03',
    vote_average: 8.9,
    vote_count: 4200,
    genre_ids: [18, 35],
    genres: makeGenres([18, 35]),
    videos: makeTrailer('OzYxJV_rmE8'),
    'watch/providers': makeProviders(['blutv']),
    moods: ['tense', 'thought_provoking'],
    seasons: [
      { season_number: 1, episode_count: 10 },
      { season_number: 4, episode_count: 10 },
    ],
    episodesBySeason: {
      4: [
        {
          name: 'Connor’s Wedding',
          overview: 'Connor ve Willa’nın düğün günü gelen bir telefon, Roy kardeşlerin hayatını sonsuza dek değiştirir.',
          still_path: null,
          season_number: 4,
          episode_number: 3,
          vote_average: 9.9,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 136315,
    media_type: 'tv',
    name: 'The Bear',
    original_language: 'tr',
    overview:
      'Ödüllü genç şef Carmy Berzatto, abisinin ölümünün ardından ailesinin Chicago’daki kaotik sandviç dükkanını devralır ve mutfağı üst düzey bir restorana dönüştürmeye çalışır.',
    poster_path: '/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    backdrop_path: '/vR1sT2wZ4yX8cP6mN3qL0kG9bF8.jpg',
    first_air_date: '2022-06-23',
    vote_average: 8.6,
    vote_count: 3100,
    genre_ids: [18, 35],
    genres: makeGenres([18, 35]),
    videos: makeTrailer('y-cqqAJIXhs'),
    'watch/providers': makeProviders(['disney']),
    moods: ['tense', 'emotional', 'adrenaline'],
    seasons: [
      { season_number: 1, episode_count: 8 },
      { season_number: 2, episode_count: 10 },
    ],
    episodesBySeason: {
      2: [
        {
          name: 'Çatallar (Forks)',
          overview: 'Richie, dünyanın en prestijli restoranlarından birinde bir haftalık staja gönderilir ve mesleki amacını keşfeder.',
          still_path: null,
          season_number: 2,
          episode_number: 7,
          vote_average: 9.7,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 2316,
    media_type: 'tv',
    name: 'The Office',
    original_language: 'en',
    overview:
      'Scranton’daki Dunder Mifflin kağıt şirketinin bölge müdürü Michael Scott ve birbirinden renkli çalışanlarının sahte belgesel (mockumentary) tarzındaki kahkaha dolu ofis日常ı.',
    poster_path: '/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg',
    backdrop_path: '/vNpuAxGTl9HsUbHqam3E9CzqCvX.jpg',
    first_air_date: '2005-03-24',
    vote_average: 8.9,
    vote_count: 6400,
    genre_ids: [35],
    genres: makeGenres([35]),
    videos: makeTrailer('LHOtME2DL4g'),
    'watch/providers': makeProviders(['netflix', 'prime']),
    moods: ['funny', 'feel_good', 'sitcom'],
    seasons: [
      { season_number: 2, episode_count: 22 },
      { season_number: 4, episode_count: 19 },
      { season_number: 5, episode_count: 28 },
    ],
    episodesBySeason: {
      4: [
        {
          name: 'Akşam Yemeği Partisi (Dinner Party)',
          overview: 'Michael ve Jan, Jim, Pam, Andy ve Angela’yı evlerinde son derece gergin ve komik bir akşam yemeğinde ağırlar.',
          still_path: null,
          season_number: 4,
          episode_number: 13,
          vote_average: 9.5,
        },
      ],
      5: [
        {
          name: 'Stres Tahliyesi (Stress Relief)',
          overview: 'Dwight’ın sahte yangın tatbikatı ofiste tam bir paniğe yol açar; ardından ilk yardım eğitimi unutulmaz bir sahneye dönüşür.',
          still_path: null,
          season_number: 5,
          episode_number: 14,
          vote_average: 9.7,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 1668,
    media_type: 'tv',
    name: 'Friends',
    original_language: 'en',
    overview:
      'Manhattan’da yaşayan altı yakın arkadaş Rachel, Monica, Phoebe, Joey, Chandler ve Ross’un Central Perk’ten apartman dairelerine uzanan 10 yıllık dostluk ve aşk maceraları.',
    poster_path: '/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg',
    backdrop_path: '/l0qVZIpXtIo7km9u5Yqh0nKPOr5.jpg',
    first_air_date: '1994-09-22',
    vote_average: 8.9,
    vote_count: 8900,
    genre_ids: [35, 18],
    genres: makeGenres([35, 18]),
    videos: makeTrailer('IEEbUzffzrk'),
    'watch/providers': makeProviders(['blutv', 'netflix']),
    moods: ['funny', 'feel_good', 'sitcom'],
    seasons: [
      { season_number: 1, episode_count: 24 },
      { season_number: 4, episode_count: 24 },
      { season_number: 5, episode_count: 24 },
    ],
    episodesBySeason: {
      4: [
        {
          name: 'The One with the Embryos',
          overview: 'Ross’un hazırladığı bilgi yarışmasında kızlar ve erkekler daireyi ortaya koyarak kıyasıya yarışır.',
          still_path: null,
          season_number: 4,
          episode_number: 12,
          vote_average: 9.5,
        },
      ],
      5: [
        {
          name: 'The One Where Everybody Finds Out',
          overview: 'Phoebe, Monica ve Chandler’ın gizli ilişkisini öğrenir ve ikiliyi kimin önce pes edeceğini görmek için oyuna getirir.',
          still_path: null,
          season_number: 5,
          episode_number: 14,
          vote_average: 9.7,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 97546,
    media_type: 'tv',
    name: 'Ted Lasso',
    original_language: 'en',
    overview:
      'Futboldan hiç anlamayan iyimser Amerikan kolej futbolu koçu Ted Lasso, İngiltere Premier Lig takımı AFC Richmond’ı çalıştırmak üzere Londra’ya getirilir.',
    poster_path: '/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg',
    backdrop_path: '/wZ4yX8cP6mN3qL0kG9bF7vR1sT3.jpg',
    first_air_date: '2020-08-14',
    vote_average: 8.8,
    vote_count: 4100,
    genre_ids: [35, 18],
    genres: makeGenres([35, 18]),
    videos: makeTrailer('3u7EIiohs6U'),
    'watch/providers': makeProviders(['apple']),
    moods: ['feel_good', 'funny', 'emotional'],
    seasons: [
      { season_number: 1, episode_count: 10 },
      { season_number: 2, episode_count: 12 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Bisküviler (Biscuits)',
          overview: 'Ted, kulüp sahibi Rebecca’nın kalbini her sabah getirdiği gizemli kurabiyelerle kazanmaya çalışır.',
          still_path: null,
          season_number: 1,
          episode_number: 2,
          vote_average: 8.9,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 42009,
    media_type: 'tv',
    name: 'Black Mirror',
    original_language: 'en',
    overview:
      'Modern toplumun ve yakın gelecekteki yüksek teknolojinin insan doğası üzerindeki karanlık, şaşırtıcı ve düşündürücü etkilerini her bölümde farklı bir hikayeyle ele alan antoloji dizisi.',
    poster_path: '/5UaYsGZOFhjFDwQh6GuLjjA1WlF.jpg',
    backdrop_path: '/57vVjteucIF3bGnZj6PmaoJRScw.jpg',
    first_air_date: '2011-12-04',
    vote_average: 8.3,
    vote_count: 5800,
    genre_ids: [10765, 18, 9648],
    genres: makeGenres([10765, 18, 9648]),
    videos: makeTrailer('V0XOApF5nLU'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['mind_bending', 'scifi', 'dark'],
    seasons: [
      { season_number: 3, episode_count: 6 },
      { season_number: 4, episode_count: 6 },
    ],
    episodesBySeason: {
      3: [
        {
          name: 'San Junipero',
          overview: '1987 yılında sahil kasabası San Junipero’da tanışan utangaç Yorkie ve enerjik Kelly, zamanın ötesinde bir bağ kurar.',
          still_path: null,
          season_number: 3,
          episode_number: 4,
          vote_average: 9.0,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 87108,
    media_type: 'tv',
    name: 'Chernobyl',
    original_language: 'en',
    overview:
      'Nisan 1986’da Sovyetler Birliği’ndeki Çernobil Nükleer Santrali’nde meydana gelen patlamanın perde arkasını ve felaketi durdurmak için hayatını feda eden insanların hikayesini anlatır.',
    poster_path: '/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
    backdrop_path: '/900tHlUYUkp7Ol04XFSoAaEIXcT.jpg',
    first_air_date: '2019-05-06',
    vote_average: 9.3,
    vote_count: 6900,
    genre_ids: [18, 36],
    genres: makeGenres([18, 36]),
    videos: makeTrailer('s9APLXM9Ei8'),
    'watch/providers': makeProviders(['blutv']),
    moods: ['tense', 'historical', 'dark'],
    seasons: [{ season_number: 1, episode_count: 5 }],
    episodesBySeason: {
      1: [
        {
          name: '1:23:45',
          overview: '26 Nisan 1986 gecesi Reaktör 4’teki güvenlik testi felaketle sonuçlanır; santral çalışanları ve itfaiyeciler neyle karşılaştıklarını bilmeden müdahale eder.',
          still_path: null,
          season_number: 1,
          episode_number: 1,
          vote_average: 9.4,
        },
      ],
    },
    fromFallback: true,
  },
  {
    id: 94605,
    media_type: 'tv',
    name: 'Arcane',
    original_language: 'en',
    overview:
      'Zengin ütopya şehri Piltover ile yeraltı dünyası Zaun arasındaki gerilim tırmanırken, iki kız kardeş Vi ve Jinx kendilerini büyü ve teknolojinin çarpıştığı savaşın karşı cephelerinde bulur.',
    poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
    backdrop_path: '/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg',
    first_air_date: '2021-11-06',
    vote_average: 9.0,
    vote_count: 5100,
    genre_ids: [16, 10765, 10759, 18],
    genres: makeGenres([16, 10765, 10759, 18]),
    videos: makeTrailer('fXmAurh012s'),
    'watch/providers': makeProviders(['netflix']),
    moods: ['adrenaline', 'emotional', 'fantasy'],
    seasons: [
      { season_number: 1, episode_count: 9 },
      { season_number: 2, episode_count: 9 },
    ],
    episodesBySeason: {
      1: [
        {
          name: 'Canavarın Yarattığı Şiddet',
          overview: 'Vi ve Powder, Vander’ı kurtarmak için her şeylerini ortaya koyar; ancak gece trajik bir dönüm noktasıyla sona erer.',
          still_path: null,
          season_number: 1,
          episode_number: 3,
          vote_average: 9.6,
        },
      ],
    },
    fromFallback: true,
  },
];

export interface FallbackFilterOptions {
  genreIds?: number[];
  onlyTurkish?: boolean;
  yearFrom?: number;
  yearTo?: number;
  platforms?: number[];
  excludeIds?: number[];
  minVoteAverage?: number;
  maxRuntime?: number;
  moodQuery?: string;
}

function getEntryYear(item: FallbackCatalogEntry): number {
  const dateStr = item.release_date || item.first_air_date || '';
  const yr = parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(yr) ? yr : 2020;
}

export function discoverFallbackCatalog(
  type: 'movie' | 'tv',
  options: FallbackFilterOptions = {}
): FallbackCatalogEntry[] {
  const {
    genreIds = [],
    onlyTurkish = false,
    yearFrom,
    yearTo,
    platforms = [],
    excludeIds = [],
    minVoteAverage = 0,
    maxRuntime,
    moodQuery,
  } = options;

  const excludeSet = new Set(excludeIds);

  const filterPass = (strictGenre: boolean, strictPlatform: boolean, strictYear: boolean) =>
    FALLBACK_CATALOG.filter((item) => {
      if (item.media_type !== type) return false;
      if (excludeSet.has(item.id)) return false;
      if (onlyTurkish && item.original_language !== 'tr') return false;
      if ((item.vote_average ?? 0) < minVoteAverage) return false;
      if (maxRuntime && item.runtime && item.runtime > maxRuntime) return false;

      if (strictYear) {
        const yr = getEntryYear(item);
        if (yearFrom && yr < yearFrom) return false;
        if (yearTo && yr > yearTo) return false;
      }

      if (strictPlatform && platforms.length > 0) {
        const flatrate = item['watch/providers']?.results?.TR?.flatrate || [];
        const hasPlatform = flatrate.some((p) => platforms.includes(p.provider_id));
        if (!hasPlatform) return false;
      }

      if (strictGenre && genreIds.length > 0) {
        const ids = item.genre_ids || [];
        const hasGenre = genreIds.some((g) => ids.includes(g));
        if (!hasGenre) return false;
      }

      if (moodQuery) {
        const q = moodQuery.toLowerCase();
        const haystack = `${item.title || ''} ${item.name || ''} ${item.overview || ''} ${item.moods.join(' ')}`.toLowerCase();
        if (haystack.includes(q)) return true;
      }

      return true;
    });

  // Progressive relaxation so the user always gets rich results
  let matches = filterPass(true, true, true);
  if (matches.length === 0) matches = filterPass(true, false, true);
  if (matches.length === 0) matches = filterPass(true, false, false);
  if (matches.length === 0) matches = filterPass(false, false, false);

  return matches
    .slice()
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .map((item) => ({ ...item, fromFallback: true }));
}

export function getFallbackDetails(id: number, type: 'movie' | 'tv'): FallbackCatalogEntry | null {
  const found =
    FALLBACK_CATALOG.find((item) => item.id === id && item.media_type === type) ||
    FALLBACK_CATALOG.find((item) => item.id === id);
  return found ? { ...found, fromFallback: true } : null;
}

export function searchFallbackCatalog(query: string, type?: 'movie' | 'tv'): FallbackCatalogEntry[] {
  const q = query.trim().toLowerCase();
  const pool = type ? FALLBACK_CATALOG.filter((i) => i.media_type === type) : FALLBACK_CATALOG;
  if (!q) return pool.map((i) => ({ ...i, fromFallback: true }));

  const direct = pool.filter((item) => {
    const title = (item.title || item.name || '').toLowerCase();
    const overview = (item.overview || '').toLowerCase();
    const genreText = (item.genres || []).map((g) => g.name.toLowerCase()).join(' ');
    return title.includes(q) || overview.includes(q) || genreText.includes(q);
  });

  if (direct.length > 0) {
    return direct.map((i) => ({ ...i, fromFallback: true }));
  }

  return pool.slice(0, 6).map((i) => ({ ...i, fromFallback: true }));
}

export function getFallbackSimilar(
  id: number,
  type: 'movie' | 'tv',
  excludeIds: number[] = []
): FallbackCatalogEntry | null {
  const source = getFallbackDetails(id, type);
  const excludeSet = new Set([id, ...excludeIds]);
  const candidates = FALLBACK_CATALOG.filter(
    (item) => item.media_type === type && !excludeSet.has(item.id)
  );
  if (candidates.length === 0) return null;

  if (source) {
    const srcGenres = new Set(source.genre_ids || []);
    const ranked = candidates
      .map((c) => {
        const overlap = (c.genre_ids || []).filter((g) => srcGenres.has(g)).length;
        const sameLang = c.original_language === source.original_language ? 0.5 : 0;
        return { item: c, score: overlap + sameLang };
      })
      .sort((a, b) => b.score - a.score || (b.item.vote_average ?? 0) - (a.item.vote_average ?? 0));
    return { ...ranked[0].item, fromFallback: true };
  }

  return { ...candidates[0], fromFallback: true };
}

export function getFallbackRandomEpisode(
  tvId?: number | null,
  genreId?: number | null,
  platforms?: number[]
): MediaItem | null {
  let show: FallbackCatalogEntry | undefined;
  if (tvId) {
    show = FALLBACK_CATALOG.find((i) => i.media_type === 'tv' && i.id === tvId);
  }
  if (!show) {
    const shows = discoverFallbackCatalog('tv', {
      genreIds: genreId ? [genreId] : [35],
      platforms,
    });
    show = shows[0] || FALLBACK_CATALOG.find((i) => i.media_type === 'tv');
  }
  if (!show) return null;

  const episodesMap = show.episodesBySeason || {};
  const seasonNums = Object.keys(episodesMap).map(Number);
  const seasonNumber = seasonNums[0] || 1;
  const epList = episodesMap[seasonNumber] || [];
  const chosenEp = epList[Math.floor(Math.random() * Math.max(1, epList.length))] || {
    name: '1. Bölüm: Başlangıç',
    overview: show.overview || 'Dizinin unutulmaz açılış bölümü.',
    still_path: show.backdrop_path || null,
    season_number: 1,
    episode_number: 1,
    vote_average: show.vote_average || 8.5,
  };

  return {
    id: show.id,
    media_type: 'tv',
    showName: show.name || show.title,
    season: chosenEp.season_number,
    episode: chosenEp.episode_number,
    title: chosenEp.name,
    overview: chosenEp.overview,
    still_path: chosenEp.still_path || show.backdrop_path,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    vote_average: chosenEp.vote_average,
    videos: show.videos,
    'watch/providers': show['watch/providers'],
    fromFallback: true,
  };
}
