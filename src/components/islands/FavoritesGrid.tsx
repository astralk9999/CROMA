import { useStore } from '@nanostores/react';
import { localFavorites, toggleFavorite } from '@stores/favorites';
import FavoriteButton from './FavoriteButton';
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
                                        {/* Use the shared FavoriteButton component for consistency */}
                                        <div className="absolute bottom-2 right-2 z-20">
                                            <FavoriteButton productId={product.id} variant="red-circle" />
                                        </div>
                                    </div>
                                    <a
                                        href={`/productos/${product.slug}`}
                                        className="block pt-3 text-left"
                                    >
                                        <h3 className="text-[10px] font-medium text-zinc-800 uppercase tracking-wide leading-tight group-hover:underline decoration-1 underline-offset-4 line-clamp-2">
                                            {product.name}
                                        </h3>

                                        <div className="mt-1 flex items-center gap-2">
                                            <p className="text-xs font-bold text-zinc-900">
                                                €{product.price.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="mt-1 text-[9px] text-zinc-400 font-medium">
                                            +1 Color
                                        </div>
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
