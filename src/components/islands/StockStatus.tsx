import { useState, useEffect } from 'react';

interface StockStatusProps {
    stock: number;
    isNotYetAvailable?: boolean;
    isLimitedDrop?: boolean;
    translations: {
        loading: string[];
        notAvailable: {
            title: string;
            subtitle: string;
            badge: string;
        };
        limited: {
            title: string;
            subtitle: string;
            badge: string;
        };
        inStock: {
            title: string;
            subtitle: string;
        };
        lowStock: {
            title: string;
            subtitle: string;
        };
        outOfStock: {
            title: string;
            subtitle: string;
        };
    };
}

export default function StockStatus({
    stock,
    isNotYetAvailable = false,
    isLimitedDrop = false,
    translations
}: StockStatusProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [showContent, setShowContent] = useState(false);

    // Immediate random message
    const [loadingMessage, setLoadingMessage] = useState(() =>
        translations.loading[Math.floor(Math.random() * translations.loading.length)]
    );

    useEffect(() => {
        // Message rotation
        const messageInterval = setInterval(() => {
            setLoadingMessage(prev => {
                let next;
                do {
                    next = translations.loading[Math.floor(Math.random() * translations.loading.length)];
                } while (next === prev);
                return next;
            });
        }, 4000);

        // Transition flow
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
            setTimeout(() => setShowContent(true), 50);
        }, 200);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(mountTimer);
        };
    }, []);

    return (
        <div className="mb-6 h-[74px] relative">
            {/* Skeleton / Loading State */}
            <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded flex items-center shadow-sm h-full">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <div className="absolute inset-0 border-2 border-zinc-200 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center p-1.5">
                                <img src="/brand/logo_c_horns.png" alt="" className="w-full h-auto object-contain opacity-20" />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1 overflow-hidden">
                            <div className="h-2.5 bg-zinc-200 rounded w-1/3 animate-pulse mb-1"></div>
                            <p key={loadingMessage} className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 animate-in fade-in slide-in-from-bottom-1 duration-500 truncate font-mono">
                                {loadingMessage}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Real Status Content */}
            {isMounted && (
                <div className={`absolute inset-0 transition-all duration-700 ease-out ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className={`p-4 border h-full flex items-center transition-all duration-300 ${isNotYetAvailable
                        ? 'bg-red-50 border-red-200 text-red-900 border-l-4 border-l-brand-red'
                        : isLimitedDrop
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 border-l-4 border-l-indigo-600'
                            : stock > 5 ? 'bg-zinc-50 border-zinc-200 text-zinc-900' :
                                stock > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' :
                                    'bg-red-50 border-red-200 text-red-900'
                        }`}>
                        {isNotYetAvailable ? (
                            <div className="flex items-center gap-3 w-full">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-brand-red rounded-full text-white text-[10px] font-bold animate-pulse">!</span>
                                <div>
                                    <p className="text-[10px] font-mono font-black uppercase tracking-widest leading-none mb-1">{translations.notAvailable.title}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-red-700 italic">{translations.notAvailable.subtitle}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5 bg-brand-red text-white px-2.5 py-1 rounded-sm text-[8px] font-black tracking-tighter">
                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                    {translations.notAvailable.badge}
                                </div>
                            </div>
                        ) : isLimitedDrop ? (
                            <div className="flex items-center gap-3 w-full">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-600 rounded-full text-white text-[10px] font-bold animate-pulse">!</span>
                                <div>
                                    <p className="text-[10px] font-mono font-black uppercase tracking-widest leading-none mb-1">{translations.limited.title}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 italic">{translations.limited.subtitle}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5 bg-indigo-600 text-white px-2.5 py-1 rounded-sm text-[8px] font-black tracking-tighter">
                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                    {translations.limited.badge}
                                </div>
                            </div>
                        ) : stock > 5 ? (
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-zinc-800 rounded-full text-white text-[10px] font-bold">✓</span>
                                <div>
                                    <p className="text-[10px] font-mono font-black uppercase tracking-widest leading-none mb-1">{translations.inStock.title}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 italic">{translations.inStock.subtitle}</p>
                                </div>
                            </div>
                        ) : stock > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-600 rounded-full text-white text-[10px] font-bold">!</span>
                                <div>
                                    <p className="text-[10px] font-mono font-black uppercase tracking-widest leading-none mb-1">{translations.lowStock.title.replace('{stock}', stock.toString())}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 italic">{translations.lowStock.subtitle}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white text-[10px] font-bold">✕</span>
                                <div>
                                    <p className="text-[10px] font-mono font-black uppercase tracking-widest leading-none mb-1">{translations.outOfStock.title}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-red-700 italic">{translations.outOfStock.subtitle}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
