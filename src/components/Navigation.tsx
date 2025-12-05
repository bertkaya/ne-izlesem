import { User } from 'lucide-react'

interface NavigationProps {
    user: any;
}

export default function Navigation({ user }: NavigationProps) {
    return (
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-40 bg-[#0f1014]/80">
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-yellow-500 cursor-pointer" onClick={() => window.location.href = '/'}>NE İZLESEM?</h1>
            {user ? (
                <div className="flex items-center gap-4">
                    <a href="/profile" className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded-full border border-gray-700">
                        <User size={18} /> <span className="hidden md:inline">Profilim</span>
                    </a>
                </div>
            ) : (
                <a href="/login" className="flex items-center gap-2 text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition">
                    <User size={18} /> Giriş Yap
                </a>
            )}
        </nav>
    )
}
