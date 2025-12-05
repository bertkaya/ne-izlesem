import { Sparkles, Loader2 } from 'lucide-react'

const AI_CHIPS = ["😭 Hüngür hüngür ağlamak istiyorum", "🤯 Beyin yakan bir film bul", "🤣 Gülmekten karnıma ağrılar girsin", "👻 Gece uyutmayacak bir korku filmi", "🚀 Uzay ve bilim kurgu olsun", "🕵️‍♂️ Katil kim temalı gizem", "🦁 Vahşi yaşam belgeseli", "🎥 Yeşilçam filmi öner"];

interface AiSectionProps {
    aiPrompt: string;
    setAiPrompt: (prompt: string) => void;
    fetchAiRecommendation: (overridePrompt?: string) => void;
    loading: boolean;
}

export default function AiSection({ aiPrompt, setAiPrompt, fetchAiRecommendation, loading }: AiSectionProps) {
    return (
        <div className="flex flex-col items-center mt-12 px-4 animate-in fade-in duration-500 w-full max-w-lg mx-auto text-center">
            <h2 className="text-3xl font-black mb-2 text-cyan-400">Film Sommelier 🤖</h2>
            <p className="text-gray-400 mb-8">Ne hissettiğini söyle veya aşağıdan seç.</p>
            <div className="w-full relative mb-8">
                <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Örn: 90'larda geçen, beni ağlatacak bir dram..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 min-h-[120px] resize-none text-lg"
                />
                <button
                    onClick={() => fetchAiRecommendation()}
                    disabled={!aiPrompt || loading}
                    className="absolute bottom-4 right-4 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-cyan-900/50 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
                </button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {AI_CHIPS.map((chip, i) => (
                    <button
                        key={i}
                        onClick={() => { setAiPrompt(chip); fetchAiRecommendation(chip); }}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-full text-sm transition-colors"
                    >
                        {chip}
                    </button>
                ))}
            </div>
        </div>
    )
}
