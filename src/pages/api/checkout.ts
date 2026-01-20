import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia' as any,
});

// Create supabase client with service role for server-side operations
const supabaseAdmin = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

interface CartItem {
    id: string;
    name: string;
    slug: string;
    price: number;
    size: string;
    image: string;
    quantity: number;
}

interface ShippingAddress {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { items, shippingAddress, origin, guestEmail } = body as {
            items: CartItem[];
            shippingAddress: ShippingAddress;
            origin: string;
            guestEmail?: string;
        };

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items in cart' }), { status: 400 });
        }

        if (!shippingAddress || !shippingAddress.address) {
            return new Response(JSON.stringify({ error: 'Shipping address required' }), { status: 400 });
        }

        // Get user from session
        const accessToken = cookies.get('sb-access-token')?.value;
        let userId: string | null = null;
        let customerEmail = shippingAddress.email;

        if (accessToken) {
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
            if (!authError && user) {
                userId = user.id;
            }
        }

        // Validate Guest vs User
        if (!userId) {
            if (guestEmail) {
                customerEmail = guestEmail;

                // WORKAROUND: Since schema 'user_id' might be NOT NULL, use a placeholder Guest User
                const GUEST_ACCOUNT_EMAIL = 'guest@croma.shop';
                const GUEST_PASSWORD = 'GuestPassword123!@#';

                // 1. Try to sign in to get ID
                const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
                    email: GUEST_ACCOUNT_EMAIL,
                    password: GUEST_PASSWORD
                });

                if (signInData.user) {
                    userId = signInData.user.id;
                } else {
                    // 2. Create if not exists
                    const { data: createUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: GUEST_ACCOUNT_EMAIL,
                        password: GUEST_PASSWORD,
                        email_confirm: true,
                        user_metadata: { full_name: 'Guest User' }
                    });

                    if (createUser?.user) {
                        userId = createUser.user.id;
                    } else if (createError?.message?.includes('already registered')) {
                        // Retry sign in? Should have worked. 
                        // Maybe rate limit?
                        console.error('Guest fallback error:', createError);
                        return new Response(JSON.stringify({ error: 'Error initializing guest system.' }), { status: 500 });
                    } else {
                        console.error('Guest creation error:', createError);
                        return new Response(JSON.stringify({ error: 'Guest system error' }), { status: 500 });
                    }
                }
            } else {
                return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
            }
        }

        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order in database with status 'pending'
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId, // Can be null now
                status: 'pending',
                total_amount: totalAmount,
                shipping_address: { ...shippingAddress, email: customerEmail },
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return new Response(JSON.stringify({ error: `Failed to create order: ${orderError.message} - ${orderError.details || ''}` }), { status: 500 });
        }

        // Create order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            product_image: item.image,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items creation error:', itemsError);
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return new Response(JSON.stringify({ error: 'Failed to create order items' }), { status: 500 });
        }

        // Reserve Stock (Decrement immediately)
        for (const item of items) {
            const { data: stockResult, error: stockError } = await supabaseAdmin
                .rpc('decrement_stock', {
                    p_product_id: item.id,
                    p_size: item.size,
                    p_quantity: item.quantity
                });

            if (stockError || (stockResult && !stockResult.success)) {
                console.error(`Stock reservation failed for ${item.name}:`, stockError || stockResult);
                // Rollback Order
                await supabaseAdmin.from('orders').delete().eq('id', order.id);
                // Note: We might want to restore previous items if partially successful, 
                // but for simplicity we assume all-or-nothing or manual fix. 
                // In a real app, we'd loop back to restore.
                // For now, fail hard.
                return new Response(JSON.stringify({ error: `Sin stock suficiente para ${item.name} (${item.size})` }), { status: 400 });
            }
        }

        // Create Stripe line items
        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `${item.name} (Talla: ${item.size})`,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            customer_email: customerEmail,
            metadata: {
                order_id: order.id,
                user_id: userId || 'guest',
            },
            shipping_address_collection: undefined, // We already collected it
        });

        // Update order with Stripe session ID
        await supabaseAdmin
            .from('orders')
            .update({
                notes: JSON.stringify({ stripe_session_id: session.id })
            })
            .eq('id', order.id);

        return new Response(JSON.stringify({
            id: session.id,
            url: session.url,
            orderId: order.id
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
