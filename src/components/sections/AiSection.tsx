// ... imports
import { Sparkles, Loader2, Zap, Heart, Ghost, Smile, Brain, Rocket, Coffee, Trophy } from 'lucide-react'

const MOOD_CATEGORIES = [
    {
        title: "Ruh Hali",
        icon: <Smile size={18} className="text-yellow-400" />,
        chips: [
            "🤣 Gülmekten Karnım Ağrısın", "😭 Hüngür Hüngür Ağlat", "😱 Altıma Yapayım", "🥰 Pamuk Gibi Yap",
            "🤯 Beyin Yakan", "😡 Sinirlerimi Boz", "😴 Kafa Boşaltmalık", "🤓 Ufkumu İkiye Katla"
        ]
    },
    {
        title: "Senaryo",
        icon: <Zap size={18} className="text-blue-400" />,
        chips: [
            "🧟 Dünyanın Sonu Geldi", "🏝️ Issız Ada", "💰 Büyük Soygun", "👽 Uzaylı İstilası",
            "🧙‍♂️ Büyülü Krallık", "⚔️ Epik Savaş", "🕵️‍♂️ Katil Kim?", "🕰️ Zaman Yolculuğu"
        ]
    },
    {
        title: "Gurme",
        icon: <Trophy size={18} className="text-purple-400" />,
        chips: [
            "🐐 IMDb Top 250", "🇹🇷 Yeşilçam Efsaneleri", "🎭 Arthouse / Festival", "🎌 Anime Başyapıtları",
            "🕵️ Neon Noir", "🤠 Spaghetti Western", "🤖 Cyberpunk", "🇰🇷 Kore Sineması"
        ]
    },
    {
        title: "Spesifik",
        icon: <Brain size={18} className="text-green-400" />,
        chips: [
            "📅 80'ler Nostaljisi", "📅 90'lar Klasikleri", "⏱️ Kısa ve Çarpıcı (<90dk)",
            "🏚️ Tek Mekan Gerilimi", "🍿 Çerezlik Aksiyon", "👪 Ailecek (Family Friendly)",
            "🩸 Slasher Korku", "🎸 Müzikal Şölen"
        ]
    }
];

interface AiSectionProps {
    fetchAiRecommendation: (overridePrompt?: string) => void;
    loading: boolean;
}

export default function AiSection({ fetchAiRecommendation, loading }: AiSectionProps) {
    return (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500 w-full max-w-5xl mx-auto text-center pb-24">
            <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">Film Sommelier 🤖</h2>
            <p className="text-gray-400 text-lg mb-8">Bugün canın ne çekiyor?</p>

            {loading && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 size={64} className="text-cyan-400 animate-spin mb-4" />
                    <p className="text-white text-xl font-bold animate-pulse">Yapay zeka en iyilerini seçiyor...</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {MOOD_CATEGORIES.map((category, idx) => (
                    <div key={idx} className="bg-gray-900/60 p-5 rounded-3xl border border-gray-800 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                            {category.icon}
                            <h3 className="text-white font-bold text-lg">{category.title}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {category.chips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => fetchAiRecommendation(chip)}
                                    disabled={loading}
                                    className="bg-gray-800 hover:bg-gray-700 hover:text-cyan-400 active:scale-95 border border-gray-700 px-3 py-3 rounded-xl text-sm font-medium transition-all text-gray-300 shadow-sm"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
