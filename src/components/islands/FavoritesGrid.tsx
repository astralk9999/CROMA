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

export default function FavoritesGrid({ allProducts }: FavoritesGridProps) {
    const favorites = useStore(localFavorites);
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

    useEffect(() => {
        const filtered = allProducts.filter(product => favorites.includes(product.id));
        setFavoriteProducts(filtered);
    }, [favorites, allProducts]);

    if (favoriteProducts.length === 0) {
        return (
            <div className="text-center py-20">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes favoritos aún</h2>
                <p className="text-gray-600 mb-6">Explora nuestros productos y añade tus favoritos haciendo clic en el corazón.</p>
                <a href="/category/all" className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                    Ver todos los productos
                </a>
            </div>
        );
    }

    return (
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
                            <div className="absolute bottom-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 uppercase tracking-wider">
                                New In
                            </div>
                        )}

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(product.id);
                            }}
                            className="absolute bottom-2 right-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                    </div>

                    <div className="pt-3">
                        <h3 className="text-sm font-normal text-gray-600 mb-1 leading-tight group-hover:text-black transition-colors">
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
    );
}
