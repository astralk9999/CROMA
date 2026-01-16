import { useStore } from '@nanostores/react';
import { toggleFavorite, localFavorites, storeReady } from '@stores/favorites';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@lib/supabase';

interface FavoriteButtonProps {
    productId: string;
}

export default function FavoriteButton({ productId }: FavoriteButtonProps) {
    const [mounted, setMounted] = useState(false);
    const favorites = useStore(localFavorites);
    const isReady = useStore(storeReady);
    const isFavorited = favorites.includes(productId);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[FavoriteButton] Click detected');

        if (!mounted) {
            console.log('[FavoriteButton] Not mounted');
            return;
        }

        // Check auth on click immediately
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[FavoriteButton] Session check:', !!session);

        if (!session) {
            console.log('[FavoriteButton] No session, showing popup');
            setShowLoginPopup(true);
            return;
        }

        try {
            setIsAnimating(true);
            toggleFavorite(productId);
            setTimeout(() => setIsAnimating(false), 300);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const closePopup = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowLoginPopup(false);
    };

    // Portal for popup to ensure it renders at body level
    const popupPortal = showLoginPopup && mounted ? createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closePopup}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={closePopup}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                    ¡Guarda tus favoritos!
                </h3>
                <p className="text-gray-600 mb-6">
                    Inicia sesión para guardar tus productos favoritos y acceder a ellos desde cualquier dispositivo.
                </p>

                <div className="space-y-3">
                    <a
                        href="/auth/login"
                        className="block w-full py-3 px-6 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors uppercase tracking-wider"
                    >
                        Iniciar Sesión
                    </a>
                    <a
                        href="/auth/register"
                        className="block w-full py-3 px-6 border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:border-black hover:text-black transition-colors uppercase tracking-wider"
                    >
                        Crear Cuenta
                    </a>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <img src="/brand/logo_c_horns.png" alt="CROMA" className="h-6 mx-auto opacity-30" />
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button
                onClick={handleToggle}
                disabled={!mounted}
                className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-300 z-10 ${isAnimating ? 'scale-125' : 'scale-100'
                    } ${isFavorited
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                        : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500 border border-gray-100'
                    } ${!mounted ? 'opacity-50 cursor-wait' : ''}`}
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

            {popupPortal}
        </>
    );
}
