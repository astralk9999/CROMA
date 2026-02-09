import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@lib/supabase-admin';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia' as any,
});

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { orderId, origin } = await request.json();

        if (!orderId) {
            return new Response(JSON.stringify({ error: 'Order ID is required' }), { status: 400 });
        }

        // Get user from session
        const accessToken = cookies.get('sb-access-token')?.value;
        if (!accessToken) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
        }

        // Fetch order and verify ownership and status
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    *
                )
            `)
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        if (order.status !== 'pending') {
            return new Response(JSON.stringify({ error: 'Only pending orders can be paid' }), { status: 400 });
        }

        // Create Stripe line items
        const lineItems = order.order_items.map((item: any) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `${item.product_name} (Talla: ${item.size})`,
                    images: item.product_image ? [item.product_image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        // Handle possible discounts if stored in notes (optional refinement)
        let discountItems = undefined;
        try {
            const notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
            if (notes?.coupon_code && notes?.discount_amount) {
                // Since Stripe coupons are usually duration: 'once', we'd need to recreate one or use original
                // For simplicity in resume, if it was already discounted in total_amount, 
                // we might need to apply a one-time Stripe discount to match the total_amount.
                // However, our checkout.ts calculates totalAmount AFTER discount.
                // If lineItems sum > total_amount, we add a negative line item or a coupon.
            }
        } catch (e) { }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            customer_email: user.email,
            metadata: {
                order_id: order.id,
                user_id: user.id,
                resumed: 'true'
            }
        });

        // Update order with new Stripe session ID
        await supabaseAdmin
            .from('orders')
            .update({
                notes: JSON.stringify({
                    ...(typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes || {}),
                    stripe_session_id: session.id
                })
            })
            .eq('id', order.id);

        return new Response(JSON.stringify({
            url: session.url
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Resume payment error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
