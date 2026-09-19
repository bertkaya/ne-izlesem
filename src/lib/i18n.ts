export type Language = 'tr' | 'en';

export interface TranslationSchema {
  nav: {
    brand: string;
    tagline: string;
    profile: string;
    login: string;
    switchTheme: string;
    switchLang: string;
  };
  modes: {
    youtube: string;
    tmdb: string;
    ai: string;
    swipe: string;
    match: string;
  };
  youtube: {
    durationTitle: string;
    langFilterTr: string;
    langFilterAll: string;
    snack: string;
    snackSub: string;
    meal: string;
    mealSub: string;
    feast: string;
    feastSub: string;
    moodTitle: string;
    moodSub: string;
    autoPlay: string;
    autoPlayOff: string;
    muteOn: string;
    muteOff: string;
    tvMode: string;
    findAndWatch: string;
    surpriseMe: string;
    lightsOut: string;
    lightsOn: string;
    openYoutube: string;
    companionReady: string;
    skip: string;
    watched: string;
    moreFromChannel: string;
    brokenVideo: string;
    wrongCategory: string;
    mealTimerTitle: string;
    mealTimerPrompt: string;
    mealTimerRemaining: string;
    mealTimerDone: string;
    reset: string;
    minuteShort: string;
  };
  tmdb: {
    movie: string;
    tv: string;
    genresTitle: string;
    onlyTurkish: string;
    searchTvPlaceholder: string;
    find: string;
    geminiPicks: string;
    sommelierNote: string;
    watchOnProvider: string;
    rent: string;
    buy: string;
    trailer: string;
    watch: string;
    pass: string;
    suggestAnother: string;
    watched: string;
    season: string;
    episode: string;
    fallbackNotice: string;
  };
  ai: {
    title: string;
    subtitle: string;
    placeholder: string;
    askButton: string;
    thinking: string;
    moodCategories: {
      title: string;
      chips: string[];
    }[];
  };
  swipe: {
    title: string;
    movie: string;
    tv: string;
    autoFavoriteNote: string;
  };
  footer: {
    brand: string;
    desc: string;
    disclaimer: string;
  };
}

export const DICTIONARY: Record<Language, TranslationSchema> = {
  tr: {
    nav: {
      brand: 'NE İZLESEM?',
      tagline: 'Karar yorgunluğuna son',
      profile: 'Profilim',
      login: 'Giriş Yap',
      switchTheme: 'Temayı Değiştir',
      switchLang: 'Change to English'
    },
    modes: {
      youtube: 'Yemek',
      tmdb: 'Gurme',
      ai: 'Asistan',
      swipe: 'Keşfet',
      match: 'Eşleş'
    },
    youtube: {
      durationTitle: 'Yemek Süresi',
      langFilterTr: 'Sadece Türkçe 🇹🇷',
      langFilterAll: 'Tüm Diller 🌍',
      snack: 'Atıştır',
      snackSub: '(0-2 dk)',
      meal: 'Doyur',
      mealSub: '(2-20 dk)',
      feast: 'Ziyafet',
      feastSub: '(20+ dk)',
      moodTitle: 'Modunu Seç',
      moodSub: 'Masanın havasını değiştir',
      autoPlay: 'Otomatik Oynat',
      autoPlayOff: 'Oynatmayı Durdur',
      muteOn: 'Sessiz Başla',
      muteOff: 'Sesli Başla',
      tvMode: 'TV Modu',
      findAndWatch: 'BUL & İZLE',
      surpriseMe: 'Beni Şaşırt 🎲',
      lightsOut: 'Işıkları Kapat',
      lightsOn: 'Işıkları Aç',
      openYoutube: "YouTube'da Aç",
      companionReady: 'Yemek Arkadaşın Hazır',
      skip: 'Pas Geç',
      watched: 'İzledim',
      moreFromChannel: 'Bu Kanaldan Başka',
      brokenVideo: 'Açılmıyor mu?',
      wrongCategory: 'Hatalı Kategori',
      mealTimerTitle: 'Yemek Soğuma Sayacı 🍲',
      mealTimerPrompt: 'Yemeğinin tahmini süresini seç:',
      mealTimerRemaining: 'Yemeğin bitmesine:',
      mealTimerDone: '🎉 Afiyet olsun! Yemeğin bitti.',
      reset: 'Sıfırla',
      minuteShort: 'dk'
    },
    tmdb: {
      movie: 'Film',
      tv: 'Dizi',
      genresTitle: 'Türler (Çoklu Seçim)',
      onlyTurkish: 'Yerli',
      searchTvPlaceholder: 'Dizi Ara...',
      find: 'BUL',
      geminiPicks: "Gemini'nin Seçimleri:",
      sommelierNote: "Sommelier'in Notu",
      watchOnProvider: 'ABONELİK İLE İZLE',
      rent: 'KİRALA',
      buy: 'SATIN AL',
      trailer: 'Fragman',
      watch: 'İzle',
      pass: 'Pas Geç',
      suggestAnother: 'Başka Öner',
      watched: 'İzledim',
      season: 'SEZON',
      episode: 'BÖLÜM',
      fallbackNotice: 'Seçtiğin platformda yok, genel öneri.'
    },
    ai: {
      title: 'Film Sommelier 🤖',
      subtitle: 'Bugün canın ne çekiyor?',
      placeholder: "Örn: 90'lar nostaljisi, yağmurlu bir gece filmi...",
      askButton: 'Sor',
      thinking: 'Yapay zeka en iyilerini seçiyor...',
      moodCategories: [
        {
          title: "Ruh Hali",
          chips: [
            "🤣 Gülmekten Karnım Ağrısın", "😭 Hüngür Hüngür Ağlat", "😱 Altıma Yapayım", "🥰 Pamuk Gibi Yap",
            "🤯 Beyin Yakan", "😡 Sinirlerimi Boz", "😴 Kafa Boşaltmalık", "🤓 Ufkumu İkiye Katla"
          ]
        },
        {
          title: "Senaryo",
          chips: [
            "🧟 Dünyanın Sonu Geldi", "🏝️ Issız Ada", "💰 Büyük Soygun", "👽 Uzaylı İstilası",
            "🧙‍♂️ Büyülü Krallık", "⚔️ Epik Savaş", "🕵️‍♂️ Katil Kim?", "🕰️ Zaman Yolculuğu"
          ]
        },
        {
          title: "Gurme",
          chips: [
            "🐐 IMDb Top 250", "🇹🇷 Yeşilçam Efsaneleri", "🎭 Arthouse / Festival", "🎌 Anime Başyapıtları",
            "🕵️ Neon Noir", "🤠 Spaghetti Western", "🤖 Cyberpunk", "🇰🇷 Kore Sineması"
          ]
        },
        {
          title: "Spesifik",
          chips: [
            "📅 80'ler Nostaljisi", "📅 90'lar Klasikleri", "⏱️ Kısa ve Çarpıcı (<90dk)",
            "🏚️ Tek Mekan Gerilimi", "🍿 Çerezlik Aksiyon", "👪 Ailecek (Family Friendly)",
            "🩸 Slasher Korku", "🎸 Müzikal Şölen"
          ]
        }
      ]
    },
    swipe: {
      title: 'Keşfet',
      movie: 'Film',
      tv: 'Dizi',
      autoFavoriteNote: 'Beğendiklerin otomatik favorilere ekleniyor'
    },
    footer: {
      brand: 'Ne İzlesem?',
      desc: 'Yemek sürenize uygun YouTube videoları, Gurme film/dizi önerileri ve Yapay Zeka Sommelier.',
      disclaimer: 'Bu ürün TMDB API kullanmaktadır fakat TMDB tarafından onaylanmamıştır.'
    }
  },
  en: {
    nav: {
      brand: 'WHAT TO WATCH?',
      tagline: 'No more decision fatigue',
      profile: 'My Profile',
      login: 'Sign In',
      switchTheme: 'Toggle Theme',
      switchLang: 'Türkçe’ye Geç'
    },
    modes: {
      youtube: 'Watch & Eat',
      tmdb: 'Gourmet',
      ai: 'Sommelier',
      swipe: 'Discover',
      match: 'Match'
    },
    youtube: {
      durationTitle: 'Eating Duration',
      langFilterTr: 'Turkish Only 🇹🇷',
      langFilterAll: 'All Languages 🌍',
      snack: 'Snack',
      snackSub: '(0-2 min)',
      meal: 'Meal',
      mealSub: '(2-20 min)',
      feast: 'Feast',
      feastSub: '(20+ min)',
      moodTitle: 'Select Your Vibe',
      moodSub: 'Set the tone for your meal',
      autoPlay: 'Auto Play',
      autoPlayOff: 'Pause Auto Play',
      muteOn: 'Start Muted',
      muteOff: 'Start Unmuted',
      tvMode: 'TV Mode',
      findAndWatch: 'FIND & PLAY',
      surpriseMe: 'Surprise Me 🎲',
      lightsOut: 'Lights Out',
      lightsOn: 'Lights On',
      openYoutube: 'Open in YouTube',
      companionReady: 'Your Dining Companion is Ready',
      skip: 'Skip',
      watched: 'Watched',
      moreFromChannel: 'More From Channel',
      brokenVideo: "Won't play?",
      wrongCategory: 'Wrong Category',
      mealTimerTitle: 'Meal Cool-down Timer 🍲',
      mealTimerPrompt: 'Pick estimated meal time:',
      mealTimerRemaining: 'Time left to eat:',
      mealTimerDone: '🎉 Bon appétit! Meal time finished.',
      reset: 'Reset',
      minuteShort: 'min'
    },
    tmdb: {
      movie: 'Movies',
      tv: 'TV Shows',
      genresTitle: 'Genres (Multi-select)',
      onlyTurkish: 'Local (TR)',
      searchTvPlaceholder: 'Search TV Show...',
      find: 'DISCOVER',
      geminiPicks: "Gemini's Curated Picks:",
      sommelierNote: "Sommelier's Note",
      watchOnProvider: 'STREAM WITH SUBSCRIPTION',
      rent: 'RENT',
      buy: 'BUY',
      trailer: 'Trailer',
      watch: 'Watch',
      pass: 'Skip',
      suggestAnother: 'Suggest Another',
      watched: 'Watched',
      season: 'SEASON',
      episode: 'EPISODE',
      fallbackNotice: 'Not on selected streaming platform, general recommendation.'
    },
    ai: {
      title: 'Film Sommelier 🤖',
      subtitle: 'What are you craving to watch today?',
      placeholder: 'E.g., 90s nostalgia crime thriller, cozy rainy night movie...',
      askButton: 'Ask',
      thinking: 'AI Sommelier is curating the finest picks...',
      moodCategories: [
        {
          title: "Mood & Vibe",
          chips: [
            "🤣 Belly Laughs & Comedy", "😭 Make Me Cry Tears", "😱 Edge of My Seat Thrills", "🥰 Feel-Good & Warm",
            "🤯 Mind-Bending Twists", "😡 Intense & Gripping", "😴 Brain-Off Comfort", "🤓 Expand My Mind"
          ]
        },
        {
          title: "Scenario & Tropes",
          chips: [
            "🧟 Post-Apocalyptic", "🏝️ Stranded Island Survival", "💰 The Big Heist", "👽 Alien Invasion",
            "🧙‍♂️ Magical Fantasy Kingdom", "⚔️ Epic Historical Battles", "🕵️‍♂️ Murder Mystery Whodunit", "🕰️ Time Travel Dilemma"
          ]
        },
        {
          title: "Gourmet Cinema",
          chips: [
            "🐐 IMDb Top 250 Gems", "🇹🇷 Turkish Cinema Classics", "🎭 Arthouse & Cannes Winners", "🎌 Anime Masterpieces",
            "🕵️ Neon Cyberpunk Noir", "🤠 Spaghetti Westerns", "🤖 Sci-Fi Dystopia", "🇰🇷 Korean Cinema Thrillers"
          ]
        },
        {
          title: "Specific Cravings",
          chips: [
            "📅 80s Retro Nostalgia", "📅 90s Golden Era Classics", "⏱️ Short & Punchy (<90 min)",
            "🏚️ Single-Room Tension", "🍿 Easy-Watch Popcorn Action", "👪 Family Movie Night",
            "🩸 Psychological Horror", "🎸 Musical Extravaganza"
          ]
        }
      ]
    },
    swipe: {
      title: 'Discover',
      movie: 'Movies',
      tv: 'TV Shows',
      autoFavoriteNote: 'Items you like are automatically saved to favorites'
    },
    footer: {
      brand: 'What To Watch?',
      desc: 'Bite-sized YouTube videos for your meal time, Gourmet film/TV picks, and an AI Sommelier.',
      disclaimer: 'This product uses the TMDB API but is not endorsed or certified by TMDB.'
    }
  }
};

// YouTube Küresel ve Yerel Arama Anahtar Kelimeleri
export const GLOBAL_YOUTUBE_KEYWORDS = {
  tr: {
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
  },
  en: {
    funny: ['Stand up comedy highlights', 'SNL best sketches', 'Comedy Central best roasts', 'Funniest talk show moments', 'Impractical Jokers'],
    eat: ['First We Feast Hot Ones', 'Gordon Ramsay best moments', 'Street food tour around the world', 'Binging with Babish', 'Mark Wiens food tour'],
    classic: ['Best movie scenes of all time', 'Classic comedy clips', 'Unforgettable TV moments', 'Late Night with Conan O Brien funny'],
    pets: ['Funny cats compilation', 'Cute dogs doing funny things', 'Animals being hilarious', 'Heartwarming pet rescues'],
    relax: ['4K walking tour Tokyo rain', 'Lofi hip hop beats to relax/study to', 'Art restoration satisfying', 'Scenic relaxation 4K nature'],
    learn: ['Kurzgesagt in a nutshell', 'Veritasium', 'TED-Ed animation', 'Vox borders explained', 'How it is made documentary'],
    drama: ['Award winning short films', 'Dramatic short cinema', 'Omeleto short film'],
    travel: ['GeoWizard travel', 'Yes Theory adventure', 'Solo travel Japan vlog', 'World travel documentary 4K'],
    sport: ['NBA incredible moments', 'Premier League best goals of season', 'Red Bull extreme sports compilation', 'F1 intense overtakes'],
    tech: ['MKBHD latest review', 'Linus Tech Tips best project', 'Mrwhosetheboss tech gadgets', 'Verge tech deep dive'],
    news: ['Global news analysis', 'Vox documentary breakdown', 'Johnny Harris visual documentary'],
    music: ['NPR Music Tiny Desk Concert', 'Colors show live performance', 'Acoustic live sessions', 'Coke Studio world music'],
    popculture: ['Vanity Fair celebrity interview', 'Architectural Digest celebrity homes', 'Wired autocomplete interview']
  }
};
