import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';
import { sendRecentlyViewedEmail } from '@lib/email';

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const forceEmail = url.searchParams.get('email'); // Optional: filter by email
        const ignoreTime = url.searchParams.get('ignoreTime') === 'true'; // Force send even if viewed recently

        // 1. Get ALL recently viewed items (or filtered)
        let query = supabaseAdmin
            .from('recently_viewed')
            .select(`
                user_id,
                viewed_at,
                profiles!inner (email),
                products!inner (id, name, slug, price, images)
            `)
            .order('viewed_at', { ascending: false })
            .limit(50);

        const { data: views, error } = await query;

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // 2. Group by User
        const userProducts: Record<string, { email: string; products: any[] }> = {};
        for (const view of views || []) {
            // @ts-ignore
            const email = view.profiles?.email;
            if (forceEmail && email !== forceEmail) continue;

            const userId = view.user_id;
            if (!userProducts[userId]) {
                userProducts[userId] = { email, products: [] };
            }
            // @ts-ignore
            userProducts[userId].products.push(view.products);
        }

        // 3. Send Emails
        const results = [];
        for (const userId in userProducts) {
            const { email, products } = userProducts[userId];

            // Check if purchased recently (skipped if purchased in last 48h) unless ignoring check
            if (!ignoreTime) {
                const { data: orders } = await supabaseAdmin
                    .from('orders')
                    .select('id')
                    .eq('user_id', userId)
                    .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
                    .limit(1);

                if (orders && orders.length > 0) {
                    results.push({ email, status: 'Skipped (Recently Purchased)' });
                    continue;
                }
            }

            try {
                await sendRecentlyViewedEmail(email, products);
                results.push({ email, status: 'Sent' });
            } catch (err: any) {
                results.push({ email, status: 'Failed', error: err.message });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            results,
            viewCount: views?.length
        }, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
