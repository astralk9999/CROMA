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
    // Just mark as ready. persistentAtom handles the read from localStorage.
    storeReady.set(true);

    // Sync if we have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            syncFavoritesWithSupabase();
        }
    });
} else {
    storeReady.set(true);
}

// Sync local favorites with Supabase if user is logged in
export async function syncFavoritesWithSupabase() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;
        const localIds = localFavorites.get();

        // Fetch remote favorites
        const { data: remoteFavorites, error } = await supabase
            .from('favorites')
            .select('product_id')
            .eq('user_id', userId);

        if (error) throw error;

        const remoteIds = remoteFavorites?.map(f => f.product_id) || [];

        // Reconciliation Strategy:
        // 1. Items in remote but NOT in local: Add to local (someone favorited on another device)
        // 2. Items in local but NOT in remote: Add to remote (someone favorited while offline)
        // 3. To avoid re-adding deleted items, we trust the remote source if it differs significantly 
        //    from local, but for simplicity, we'll do a one-time merge on the first sync ever.

        const localIdsSet = new Set(localIds);
        const remoteIdsSet = new Set(remoteIds);

        // Calculate differences
        const missingLocally = remoteIds.filter(id => !localIdsSet.has(id));
        const missingRemotely = localIds.filter(id => !remoteIdsSet.has(id));

        if (missingLocally.length > 0) {
            localFavorites.set([...new Set([...localIds, ...missingLocally])]);
        }

        if (missingRemotely.length > 0) {
            await supabase
                .from('favorites')
                .upsert(missingRemotely.map(id => ({
                    user_id: userId,
                    product_id: id
                })));
        }
    } catch (e) {
        console.warn('Failed to sync favorites:', e);
    }
}

export const isFavorite = (productId: string): boolean => {
    const favorites = localFavorites.get();
    return favorites.includes(productId);
};

export async function toggleFavorite(productId: string) {
    const favorites = localFavorites.get();
    const isAdding = !favorites.includes(productId);

    // 1. Optimistic Local Update
    if (isAdding) {
        localFavorites.set([...favorites, productId]);
    } else {
        localFavorites.set(favorites.filter(id => id !== productId));
    }

    // 2. Background Remote Sync (Don't block the UI)
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        if (isAdding) {
            await supabase
                .from('favorites')
                .upsert({ user_id: userId, product_id: productId });
        } else {
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('product_id', productId);
        }
    } catch (error) {
        console.error('Error syncing favorite with Supabase:', error);
        // We could revert local state here if strict consistency is needed, 
        // but for favorites, eventual consistency or next-load sync is usually enough.
    }
}

export const favoritesCount = computed(localFavorites, (favorites) => {
    return favorites.length;
});
