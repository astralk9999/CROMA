import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as any,
});

const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { items, shippingAddress, email, userId: paramUserId } = body;

        if (!items || items.length === 0) return new Response(JSON.stringify({ error: 'No items' }), { status: 400 });

        // User Resolution (similar to checkout.ts)
        let userId = paramUserId;
        let customerEmail = email || shippingAddress?.email;

        if (!userId) {
            const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (accessToken) {
                const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
                if (user) userId = user.id;
            }
        }

        // Guest handling fallback (simplified for mobile)
        if (!userId) {
            // For mobile, we might just allow null or create guest
            // Adapting logic from checkout.ts:
            const GUEST_ACCOUNT_EMAIL = 'guest@croma.shop';
            // If guest, we just assign to the Guest User ID if we can find it
            // Or leave user_id null if DB allows. checkout.ts ensures user_id is set.
            // We will query the guest user.
            const { data } = await supabaseAdmin.from('users').select('id').eq('email', GUEST_ACCOUNT_EMAIL).single();
            // Note: 'users' table might not be accessible, usually auth.users. 
            // checkout.ts used signIn to get ID. We'll skip complex guest auth for now and try to insert with null if allowed, or fail.
            // Accessing auth.users directly via admin:
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const guestUser = users.find(u => u.email === GUEST_ACCOUNT_EMAIL);
            if (guestUser) userId = guestUser.id;
        }

        // Calculate Amount
        const amount = Math.round(items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * 100);

        // 1. Create Order (Pending)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId,
                status: 'pending',
                total_amount: amount / 100,
                shipping_address: shippingAddress,
                platform: 'mobile_app'
            })
            .select()
            .single();

        if (orderError) throw new Error(`Order create failed: ${orderError.message}`);

        // 2. Create Order Items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            product_image: item.images?.[0] || item.image,
            size: item.size,
            quantity: item.quantity,
            price: item.price
        }));

        await supabaseAdmin.from('order_items').insert(orderItems);

        // 3. Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'eur',
            customer: undefined, // We could create a customer object here
            metadata: {
                order_id: order.id,
                user_id: userId || 'guest'
            },
            payment_method_types: ['card'], // Add others if needed
        });

        // 4. Update Order with PI ID
        await supabaseAdmin.from('orders').update({
            notes: { stripe_payment_intent: paymentIntent.id }
        }).eq('id', order.id);

        return new Response(JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            orderId: order.id
        }), { status: 200 });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
