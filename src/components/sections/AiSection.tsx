import { Loader2, Zap, Smile, Brain, Trophy } from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'

interface AiSectionProps {
    fetchAiRecommendation: (overridePrompt?: string) => void;
    loading: boolean;
}

const CATEGORY_ICONS = [
    <Smile key="smile" size={18} className="text-yellow-400" />,
    <Zap key="zap" size={18} className="text-blue-400" />,
    <Trophy key="trophy" size={18} className="text-purple-400" />,
    <Brain key="brain" size={18} className="text-green-400" />
];

export default function AiSection({ fetchAiRecommendation, loading }: AiSectionProps) {
    const { t } = useLanguage()

    return (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500 w-full max-w-5xl mx-auto text-center pb-24">
            <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">{t.ai.title}</h2>
            <p className="text-gray-400 text-lg mb-8">{t.ai.subtitle}</p>

            {/* Custom prompt input */}
            <div className="w-full max-w-xl mx-auto mb-8 flex gap-2">
                <input
                    type="text"
                    placeholder={t.ai.placeholder}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-500 text-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            fetchAiRecommendation((e.target as HTMLInputElement).value.trim());
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                    disabled={loading}
                />
                <button
                    onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        if (input.value.trim()) {
                            fetchAiRecommendation(input.value.trim());
                            input.value = '';
                        }
                    }}
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
                >
                    {t.ai.askButton}
                </button>
            </div>

            {loading && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 size={64} className="text-cyan-400 animate-spin mb-4" />
                    <p className="text-white text-xl font-bold animate-pulse">{t.ai.thinking}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {t.ai.moodCategories.map((category, idx) => (
                    <div key={idx} className="bg-gray-900/60 p-5 rounded-3xl border border-gray-800 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                            {CATEGORY_ICONS[idx % CATEGORY_ICONS.length]}
                            <h3 className="text-white font-bold text-lg">{category.title}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {category.chips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => fetchAiRecommendation(chip)}
                                    disabled={loading}
                                    className="bg-gray-800 hover:bg-gray-700 hover:text-cyan-400 active:scale-95 border border-gray-700 px-3 py-3 rounded-xl text-xs md:text-sm font-medium transition-all text-gray-300 shadow-sm"
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
