import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { productId } = await request.json();

        if (!productId) {
            return new Response(JSON.stringify({ error: 'Product ID required' }), { status: 400 });
        }

        // Get user from session
        const accessToken = cookies.get('sb-access-token')?.value;
        if (!accessToken) {
            // Guest users - we don't track for now
            return new Response(JSON.stringify({ success: false, reason: 'guest' }), { status: 200 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
        if (authError || !user) {
            return new Response(JSON.stringify({ success: false, reason: 'invalid_session' }), { status: 200 });
        }

        // Upsert view record (update viewed_at if already exists)
        const { error } = await supabaseAdmin
            .from('recently_viewed')
            .upsert({
                user_id: user.id,
                product_id: productId,
                viewed_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,product_id'
            });

        if (error) {
            console.error('Track view error:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        console.error('Track view critical error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
