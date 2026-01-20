import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia' as any,
});

// Admin Supabase client to bypass RLS for updates
const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
        return new Response(JSON.stringify({ error: 'Missing session_id' }), { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const orderId = session.metadata?.order_id;
            if (orderId) {
                // Update order to 'processing' if it is pending
                // Fetch current status first to avoid overwriting Cancelled or Shipped status from race conditions
                const { data: currentOrder } = await supabaseAdmin
                    .from('orders')
                    .select('status')
                    .eq('id', orderId)
                    .single();

                if (currentOrder && currentOrder.status === 'pending') {
                    const { error } = await supabaseAdmin
                        .from('orders')
                        .update({
                            status: 'processing',
                            notes: JSON.stringify({
                                stripe_session_id: session.id,
                                stripe_payment_intent: session.payment_intent as string,
                                verified_at: new Date().toISOString(),
                                method: 'client-verification'
                            })
                        })
                        .eq('id', orderId);

                    if (error) console.error("Error updating order via verification:", error);
                    else console.log(`Order ${orderId} verified and updated to processing`);
                }
            }
        }

        return new Response(JSON.stringify({
            status: session.payment_status,
            orderId: session.metadata?.order_id
        }), { status: 200 });
    } catch (error: any) {
        console.error('Verify Session Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
