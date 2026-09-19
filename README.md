# Ne İzlesem? 🎬🍿

Yapay zeka destekli film, dizi ve YouTube video öneri platformu. Yemek süresine göre video bul, AI sommelier ile film keşfet, çiftler için eşleşme modu ve daha fazlası.

## Özellikler

- 🍔 **Yemek Modu** — Yemek süresine göre (atıştırmalık/öğün/ziyafet) YouTube videoları
- 🎬 **Gurme Modu** — TMDB üzerinden platform bazlı film/dizi önerisi
- 🤖 **AI Sommelier** — Gemini destekli akıllı film önerileri
- 🔥 **Keşfet (Swipe)** — Tinder tarzı film keşif modu
- 💘 **Sinema Eşi** — Çiftler için gerçek zamanlı eşleşme modu
- 👤 **Profil** — İzleme geçmişi, favoriler, rozet sistemi
- 🛡️ **Admin Panel** — Video yönetimi, güvenli kanal sistemi

## Teknolojiler

- **Framework**: Next.js 16 (App Router, React Compiler)
- **Stil**: Tailwind CSS 4
- **Veritabanı**: Supabase (PostgreSQL + Realtime)
- **AI**: Google Gemini API
- **API**: TMDB, YouTube Data API v3
- **Animasyon**: Framer Motion

## Başlangıç

```bash
npm install
npm run dev
```

`.env.local` dosyasına aşağıdaki değişkenleri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TMDB_API_KEY=
YOUTUBE_API_KEY=
GOOGLE_GEMINI_API_KEY=
```

## Lisans

Bu proje TMDB API kullanmaktadır ancak TMDB tarafından onaylanmamıştır.
