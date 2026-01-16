import { useState, useEffect } from 'react';

interface StockStatusProps {
    stock: number;
    isNotYetAvailable?: boolean;
}

const STOCK_MESSAGES = [
    'Consultando inventario...',
    'Verificando disponibilidad...',
    'Conectando con almacén...',
    'Sincronizando stock...',
    'Preparando logística...',
    'Validando existencias...'
];

export default function StockStatus({ stock, isNotYetAvailable = false }: StockStatusProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [showContent, setShowContent] = useState(false);

    // Immediate random message
    const [loadingMessage, setLoadingMessage] = useState(() =>
        STOCK_MESSAGES[Math.floor(Math.random() * STOCK_MESSAGES.length)]
    );

    useEffect(() => {
        // Message rotation
        const messageInterval = setInterval(() => {
            setLoadingMessage(prev => {
                let next;
                do {
                    next = STOCK_MESSAGES[Math.floor(Math.random() * STOCK_MESSAGES.length)];
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

    if (isNotYetAvailable) return null;

    return (
        <div className="mb-6 h-[74px] relative">
            {/* Skeleton / Loading State */}
            <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex items-center shadow-sm h-full">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center p-1.5">
                                <img src="/brand/logo_c_horns.png" alt="" className="w-full h-auto object-contain" />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1 overflow-hidden">
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mb-1"></div>
                            <p key={loadingMessage} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 animate-in fade-in slide-in-from-bottom-1 duration-500 truncate">
                                {loadingMessage}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Real Status Content */}
            {isMounted && (
                <div className={`absolute inset-0 transition-all duration-700 ease-out ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className={`p-4 rounded-lg border h-full flex items-center shadow-sm transition-all duration-300 ${stock > 5 ? 'bg-green-100 border-green-200 text-green-900' :
                            stock > 0 ? 'bg-amber-100 border-amber-200 text-amber-900' :
                                'bg-red-100 border-red-200 text-red-900'
                        }`}>
                        {stock > 5 ? (
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-600 rounded-full text-white text-[10px] font-bold">✓</span>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-tight">En stock</p>
                                    <p className="text-xs font-medium opacity-80 text-green-800">Listo para enviar inmediatamente</p>
                                </div>
                            </div>
                        ) : stock > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-amber-600 rounded-full text-white text-[10px] font-bold">!</span>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-tight">Stock bajo</p>
                                    <p className="text-xs font-medium opacity-80 text-amber-800">Solo quedan {stock} unidades</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white text-[10px] font-bold">✕</span>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-tight">Agotado</p>
                                    <p className="text-xs font-medium opacity-80 text-red-800">Temporalmente fuera de stock</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
