import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2025-12-15.clover' as any,
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { items, origin } = body;

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items in cart' }), { status: 400 });
        }

        const lineItems = items.map((item: any) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `${item.name} (${item.size})`,
                    images: [item.image],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
        });

        return new Response(JSON.stringify({ id: session.id, url: session.url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Stripe error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
