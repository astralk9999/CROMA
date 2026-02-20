import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ cookies }) => {
    try {
        const accessToken = cookies.get('sb-access-token')?.value;
        if (!accessToken) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // 1. Get current authenticated user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

        if (authError || !user || !user.email) {
            return new Response(JSON.stringify({ error: 'Invalid Session' }), { status: 401 });
        }

        // 2. Find the Guest Placeholder User ID
        // (We reuse the logic/credentials from checkout.ts)
        const GUEST_ACCOUNT_EMAIL = 'guest@croma.shop';
        let guestUserId = null;

        // Try to find the guest user by email
        // Admin listUsers is the cleanest way if available, but simplest is signIn or getting by known metadata?
        // Let's rely on the same hack: Sign In to get ID (fast and consistent) or create.
        // Actually, just searching by email is better if we can.
        // We can't strictly search by email with basic client easily without scope.
        // Let's assume the checkout process created it. If not, no guest orders exist.

        // We will try to fetch the ID via a "dummy" sign in or just query profiles if we have access? 
        // Profiles RLS might block listing.

        // Let's just 'getUser' if we had the ID? No.
        // Let's use the 'signIn' check again, it's reliable.
        const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
            email: GUEST_ACCOUNT_EMAIL,
            password: 'GuestPassword123!@#'
        });

        if (signInData.user) {
            guestUserId = signInData.user.id;
        } else {
            // If guest user doesn't exist, there are no orders to claim.
            return new Response(JSON.stringify({ message: 'No guest system active' }), { status: 200 });
        }

        // 3. Update Orders
        // "Transfer all orders FROM guestUserId WITH shipping_email == current_user_email TO current_user_id"
        // Note: JSONB query for shipping_address->>'email'

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ user_id: user.id })
            .eq('user_id', guestUserId)
            .ilike('shipping_address->>email', user.email) // Case insensitive match? JSON->> returns text. ilike is good.
            .select();

        if (error) {
            console.error('Error claiming orders:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({
            success: true,
            claimed: data.length,
            message: `Successfully linked ${data.length} orders.`
        }), { status: 200 });

    } catch (error: any) {
        console.error('Claim orders error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
