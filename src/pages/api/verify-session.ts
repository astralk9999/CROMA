import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@lib/supabase-admin';
import { sendOrderConfirmationEmail } from '@lib/email';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia' as any,
});

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
                // Fetch current order with items and product images
                const { data: currentOrder } = await supabaseAdmin
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            *,
                            product:products (
                                name,
                                images
                            )
                        ),
                        profiles (email)
                    `)
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

                    if (error) {
                        console.error("Error updating order via verification:", error);
                    } else {
                        console.log(`Order ${orderId} verified and updated to processing`);

                        // Send order confirmation email
                        const customerEmail = currentOrder.profiles?.email || (currentOrder.shipping_address as any)?.email;
                        if (customerEmail) {
                            // Map items to include product image from relation
                            const emailItems = currentOrder.order_items.map((item: any) => ({
                                ...item,
                                product_name: item.product?.name || item.product_name, // Fallback or override
                                product_image: item.product?.images?.[0] || null
                            }));

                            sendOrderConfirmationEmail(
                                customerEmail,
                                orderId,
                                emailItems,
                                Number(currentOrder.total_amount),
                                currentOrder.shipping_address
                            ).catch(e => console.error('[EMAIL_ERROR]:', e));
                        }
                    }
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
