import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia' as any,
});

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

// Create supabase client with service role
const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request }) => {
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await request.text();

        // Verify webhook signature
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } else {
            // For development without signature verification
            event = JSON.parse(body) as Stripe.Event;
            console.warn('⚠️ Webhook signature verification skipped (no secret configured)');
        }
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log('✅ Payment successful for session:', session.id);

            const orderId = session.metadata?.order_id;

            if (orderId) {
                // Update order status to 'processing'
                const { error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update({
                        status: 'processing',
                        notes: JSON.stringify({
                            stripe_session_id: session.id,
                            stripe_payment_intent: session.payment_intent,
                            paid_at: new Date().toISOString(),
                        })
                    })
                    .eq('id', orderId);

                if (updateError) {
                    console.error('Failed to update order:', updateError);
                } else {
                    console.log(`✅ Order ${orderId} updated to 'processing'`);
                    // Note: Stock was already reserved at checkout.
                }
            } else {
                console.warn('No order_id in session metadata');
            }
            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;
            const orderId = session.metadata?.order_id;

            if (orderId) {
                console.log(`⚠️ Order ${orderId} session expired. Restoring stock...`);

                // Restore Stock
                await supabaseAdmin.rpc('restore_stock', { p_order_id: orderId });

                // Mark order as cancelled
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', orderId);

                console.log(`⚠️ Order ${orderId} cancelled`);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
