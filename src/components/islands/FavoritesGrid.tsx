import { useStore } from '@nanostores/react';
import { localFavorites, toggleFavorite } from '@stores/favorites';
import { useEffect, useState } from 'react';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
}

interface FavoritesGridProps {
    allProducts: Product[];
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

export default function FavoritesGrid({ allProducts }: FavoritesGridProps) {
    const favorites = useStore(localFavorites);
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [showContent, setShowContent] = useState(false);

    const [loadingMessage, setLoadingMessage] = useState(() =>
        MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    );

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setLoadingMessage(prev => {
                let next;
                do {
                    next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
                } while (next === prev);
                return next;
            });
        }, 4000);

        const filtered = allProducts.filter(product => favorites.includes(product.id));
        setFavoriteProducts(filtered);

        const mountTimer = setTimeout(() => {
            setIsMounted(true);
            setTimeout(() => setShowContent(true), 50);
        }, 200);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(mountTimer);
        };
    }, [favorites, allProducts]);

    return (
        <div className="relative min-h-[400px]">
            {/* Loading Overlay */}
            <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                <div className="sticky top-[20vh] flex flex-col items-center justify-center">
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

            {/* Skeletons */}
            <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0 absolute inset-0' : 'opacity-40 relative'}`}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-[3/4] bg-gray-200 rounded-sm"></div>
                    </div>
                ))}
            </div>

            {/* Content Logic */}
            {isMounted && (
                <div className={`transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {favoriteProducts.length === 0 ? (
                        <div className="text-center py-20 animate-fade-in">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
                                <img src="/brand/logo_c_horns.png" alt="" className="w-10 h-10 object-contain opacity-20" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes favoritos aún</h2>
                            <p className="text-gray-600 mb-6">Explora nuestros productos y añade tus favoritos haciendo clic en el corazón.</p>
                            <a href="/category/all" className="inline-block bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-all font-bold uppercase tracking-widest text-xs">
                                Ver todos los productos
                            </a>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                            {favoriteProducts.map((product) => (
                                <a
                                    key={product.id}
                                    href={`/productos/${product.slug}`}
                                    className="group block relative"
                                >
                                    <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                                        <img
                                            src={product.images[0] || '/placeholder.jpg'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        {product.stock > 0 && (
                                            <div className="absolute bottom-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                                New In
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleFavorite(product.id);
                                            }}
                                            className="absolute bottom-2 right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="pt-3">
                                        <h3 className="text-sm font-normal text-gray-600 mb-1 leading-tight group-hover:text-black transition-colors line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-bold text-black">
                                                €{product.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
