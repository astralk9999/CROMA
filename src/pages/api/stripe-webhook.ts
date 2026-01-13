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

                    // Decrement stock for each item
                    const { data: orderItems } = await supabaseAdmin
                        .from('order_items')
                        .select('product_id, size, quantity')
                        .eq('order_id', orderId);

                    if (orderItems) {
                        for (const item of orderItems) {
                            // Get current stock
                            const { data: product } = await supabaseAdmin
                                .from('products')
                                .select('stock_by_sizes')
                                .eq('id', item.product_id)
                                .single();

                            if (product?.stock_by_sizes) {
                                const stockBySizes = product.stock_by_sizes as Record<string, number>;
                                if (stockBySizes[item.size] !== undefined) {
                                    stockBySizes[item.size] = Math.max(0, stockBySizes[item.size] - item.quantity);

                                    await supabaseAdmin
                                        .from('products')
                                        .update({ stock_by_sizes: stockBySizes })
                                        .eq('id', item.product_id);
                                }
                            }
                        }
                        console.log('✅ Stock decremented for order items');
                    }
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
                // Mark order as cancelled
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', orderId);

                console.log(`⚠️ Order ${orderId} cancelled (session expired)`);
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
