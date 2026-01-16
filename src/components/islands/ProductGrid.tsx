import { useState, useEffect } from 'react';
import FavoriteButton from './FavoriteButton';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
}

interface ProductGridProps {
    products: Product[];
}

const MESSAGES = [
    'Curando tu estilo...',
    'Sincronizando la colección...',
    'Preparando lo último de CROMA...',
    'Ajustando los detalles...',
    'Trayendo la tendencia...',
    'Desplegando moda urbana...',
    'Cargando piezas exclusivas...',
    'Conectando con el Streetwear...',
    'Escaneando el hype...',
    'Desbloqueando el próximo drop...',
    'Sintonizando la cultura urban...',
    'Preparando la cápsula CROMA...',
    'Tejiendo el futuro del estilo...',
    'Definiendo tu estética...',
    'Buscando inspiración en las calles...',
    'Filtros de estilo activados...',
    'La ciudad es tu pasarela...',
    'Elevando tu outfit...',
    'Moda con actitud y propósito...',
    'Cargando el outfit perfecto...'
];

export default function ProductGrid({ products }: ProductGridProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [showContent, setShowContent] = useState(false);

    // Picks a random message right at the start
    const [loadingMessage, setLoadingMessage] = useState(() =>
        MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    );

    useEffect(() => {
        // Message rotation
        const messageInterval = setInterval(() => {
            setLoadingMessage(prev => {
                let next;
                do {
                    next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
                } while (next === prev);
                return next;
            });
        }, 4000);

        // Mount process: first hydrations, then show content with transition
        const mountTimer = setTimeout(() => {
            setIsMounted(true);
            // Small delay to allow fade-out of skeleton before fade-in of content
            setTimeout(() => setShowContent(true), 50);
        }, 200);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(mountTimer);
        };
    }, []);

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(price);
    };

    return (
        <div className="relative min-h-[400px]">
            {/* Loading Overlay: Only visible while NOT showContent */}
            <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                <div className="sticky top-[40vh] flex flex-col items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-black rounded-full animate-spin border-t-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center p-3">
                                <img src="/brand/logo_c_horns.png" alt="" className="w-full h-auto object-contain" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">CROMA</span>
                            <span key={loadingMessage} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                {loadingMessage}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skeletons: Fade out while showContent becomes true */}
            <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0 absolute inset-0' : 'opacity-40 relative'}`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] bg-gray-200 rounded-sm mb-4"></div>
                    </div>
                ))}
            </div>

            {/* Real Content: Fade in while showContent becomes true */}
            {isMounted && (
                <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {products.map((product) => (
                        <div key={product.id} className="group relative">
                            <div className="relative overflow-hidden bg-gray-100">
                                <a
                                    href={`/productos/${product.slug}`}
                                    className="block aspect-[3/4]"
                                >
                                    <img
                                        src={product.images[0] || '/placeholder.jpg'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                </a>
                                {product.stock > 0 && (
                                    <div className="absolute bottom-2 left-2 pointer-events-none bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                        New In
                                    </div>
                                )}
                                <FavoriteButton productId={product.id} />
                            </div>
                            <a
                                href={`/productos/${product.slug}`}
                                className="block pt-3"
                            >
                                <h3 className="text-sm font-normal text-gray-600 mb-1 leading-tight group-hover:text-black transition-colors line-clamp-1">
                                    {product.name}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-bold text-black">
                                        {formatPrice(product.price)}
                                    </p>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
