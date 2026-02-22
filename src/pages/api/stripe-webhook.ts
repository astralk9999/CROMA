export const prerender = false;
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@lib/supabase-admin';

const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    throw new Error('CRITICAL_INFRA_FAILURE: STRIPE_SECRET_KEY is missing from environment variables');
}

const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-12-18.acacia' as any,
});

const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET || '';

export const POST: APIRoute = async ({ request }) => {
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await request.text();

        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } else {
            // SECURITY: Block unverified webhooks in production
            console.error('CRITICAL: STRIPE_WEBHOOK_SECRET not configured. Rejecting webhook.');
            return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 });
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
                // Fetch the order first to check for an applied coupon
                const { data: orderData, error: orderFetchError } = await supabaseAdmin
                    .from('orders')
                    .select('notes')
                    .eq('id', orderId)
                    .single();

                if (!orderFetchError && orderData?.notes) {
                    try {
                        let parsedNotes = typeof orderData.notes === 'string' ? JSON.parse(orderData.notes) : orderData.notes;
                        if (parsedNotes?.coupon_code) {
                            // Increment coupon usage using direct update (fetching first to get current value)
                            console.log(`Incrementing usage for coupon: ${parsedNotes.coupon_code}`);
                            const { data: couponData } = await supabaseAdmin
                                .from('coupons')
                                .select('uses')
                                .eq('code', parsedNotes.coupon_code)
                                .single();

                            const currentUses = couponData?.uses || 0;

                            await supabaseAdmin
                                .from('coupons')
                                .update({ uses: currentUses + 1 })
                                .eq('code', parsedNotes.coupon_code);
                        }
                    } catch (e) {
                        console.error('Failed to parse order notes for coupon usage tracking', e);
                    }
                }

                // Update order status to 'processing'
                const { error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update({
                        status: 'processing',
                        notes: JSON.stringify({
                            ...(typeof orderData?.notes === 'string' ? JSON.parse(orderData?.notes || '{}') : (orderData?.notes || {})),
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
                    // Enviar la notificación de email original (fuego y olvido)
                    // sendOrderConfirmationEmail(orderId).catch(console.error); // Assuming this function exists elsewhere

                    // --- Nivel 3 Rúbrica: Generación de Factura Standard ---
                    try {
                        const amountInEuros = (session.amount_total || 0) / 100;
                        const { data: invData, error: invError } = await supabaseAdmin.rpc('generate_invoice', {
                            p_order_id: orderId,
                            p_type: 'standard',
                            p_amount: amountInEuros
                        });
                        if (invError) console.error('Error generando Factura webhook:', invError);
                        else console.log('✅ Factura Standard generada:', invData);
                    } catch (invoiceErr) {
                        console.error('Fallo de generación de factura:', invoiceErr);
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
                console.warn(`⚠️ Order ${orderId} session expired. Restoring stock...`);

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
