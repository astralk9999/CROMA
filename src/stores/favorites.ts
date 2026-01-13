import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { supabase } from '@lib/supabase';

export interface Favorite {
    productId: string;
    addedAt: number;
}

// Track if store has been initialized from localStorage
export const storeReady = atom<boolean>(false);

// Store favorites in localStorage for non-authenticated users
export const localFavorites = persistentAtom<string[]>('croma-favorites', [], {
    encode: JSON.stringify,
    decode: (str) => {
        try {
            return JSON.parse(str) || [];
        } catch {
            return [];
        }
    },
});

// Initialize store immediately when in browser
if (typeof window !== 'undefined') {
    // Mark store as ready immediately - persistentAtom handles localStorage sync
    storeReady.set(true);
}

// Sync local favorites with Supabase if user is logged in
export async function syncFavoritesWithSupabase() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const localIds = localFavorites.get();

    // Fetch remote favorites
    const { data: remoteFavorites } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

    const remoteIds = remoteFavorites?.map(f => f.product_id) || [];

    // Combine and remove duplicates
    const combinedIds = [...new Set([...localIds, ...remoteIds])];

    // Update local store
    localFavorites.set(combinedIds);

    // Update remote store for any missing ones
    const missingInRemote = localIds.filter(id => !remoteIds.includes(id));
    if (missingInRemote.length > 0) {
        await supabase
            .from('favorites')
            .upsert(missingInRemote.map(id => ({
                user_id: userId,
                product_id: id
            })));
    }
}

export const isFavorite = (productId: string): boolean => {
    const favorites = localFavorites.get();
    return favorites.includes(productId);
};

export async function toggleFavorite(productId: string) {
    const favorites = localFavorites.get();
    const { data: { session } } = await supabase.auth.getSession();

    if (favorites.includes(productId)) {
        // Remove from local
        localFavorites.set(favorites.filter(id => id !== productId));

        // Remove from remote if logged in
        if (session) {
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', session.user.id)
                .eq('product_id', productId);
        }
    } else {
        // Add to local
        localFavorites.set([...favorites, productId]);

        // Add to remote if logged in
        if (session) {
            await supabase
                .from('favorites')
                .upsert({
                    user_id: session.user.id,
                    product_id: productId
                });
        }
    }
}

export const favoritesCount = computed(localFavorites, (favorites) => {
    return favorites.length;
});
