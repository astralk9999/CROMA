import { useStore } from '@nanostores/react';
import { toggleFavorite, localFavorites, storeReady } from '@stores/favorites';
import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
    productId: string;
}

export default function FavoriteButton({ productId }: FavoriteButtonProps) {
    const favorites = useStore(localFavorites);
    const isReady = useStore(storeReady);
    const isFavorited = favorites.includes(productId);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent multiple rapid clicks
        if (isToggling || !isReady) return;

        try {
            setIsToggling(true);
            setIsAnimating(true);

            await toggleFavorite(productId);

            setTimeout(() => setIsAnimating(false), 300);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={!isReady || isToggling}
            className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-300 ${isAnimating ? 'scale-125' : 'scale-100'
                } ${isFavorited
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                } ${(!isReady || isToggling) ? 'opacity-50 cursor-wait' : ''}`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
            <svg
                className="w-5 h-5"
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={isFavorited ? 0 : 2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
}

