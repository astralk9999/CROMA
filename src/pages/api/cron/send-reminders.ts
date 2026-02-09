import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';
import { sendRecentlyViewedEmail } from '@lib/email';

// This endpoint should be called by a CRON job (e.g., daily at 10:00 AM)
// Security: Add a secret header check in production

export const GET: APIRoute = async ({ request }) => {
    // Optional: Add secret validation for CRON security
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = import.meta.env.CRON_SECRET || 'dev-secret';

    if (cronSecret !== expectedSecret && import.meta.env.PROD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        // Find users who viewed products in the last 24-48 hours but haven't purchased
        const cutoffRecent = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h ago
        const cutoffOld = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago

        // Get users with recent views
        const { data: recentViews, error } = await supabaseAdmin
            .from('recently_viewed')
            .select(`
                user_id,
                profiles!inner (
                    id,
                    email
                ),
                products!inner (
                    id,
                    name,
                    slug,
                    price,
                    images
                )
            `)
            .gte('viewed_at', cutoffOld)
            .lte('viewed_at', cutoffRecent)
            .order('viewed_at', { ascending: false });

        if (error) {
            console.error('Fetch recent views error:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Group by user
        const userProducts: Record<string, { email: string; products: any[] }> = {};

        for (const view of recentViews || []) {
            const userId = view.user_id;
            const profile = view.profiles as any;
            const product = view.products as any;

            if (!userProducts[userId]) {
                userProducts[userId] = {
                    email: profile.email,
                    products: []
                };
            }

            // Only add up to 3 products per user
            if (userProducts[userId].products.length < 3) {
                userProducts[userId].products.push(product);
            }
        }

        // Send emails
        let sentCount = 0;
        for (const userId of Object.keys(userProducts)) {
            const { email, products } = userProducts[userId];

            // Check if user has made a purchase recently (skip if they have)
            const { data: recentOrders } = await supabaseAdmin
                .from('orders')
                .select('id')
                .eq('user_id', userId)
                .gte('created_at', cutoffOld)
                .limit(1);

            if (recentOrders && recentOrders.length > 0) {
                continue; // Skip users who already purchased
            }

            // Send the reminder email
            await sendRecentlyViewedEmail(email, products);
            sentCount++;
        }

        return new Response(JSON.stringify({
            success: true,
            emailsSent: sentCount,
            usersFound: Object.keys(userProducts).length
        }), { status: 200 });

    } catch (error: any) {
        console.error('CRON reminder error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
