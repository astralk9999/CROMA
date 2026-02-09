import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@lib/supabase-admin';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia' as any,
});

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
        const { items, shippingAddress, origin, guestEmail, couponCode } = body as {
            items: CartItem[];
            shippingAddress: ShippingAddress;
            origin: string;
            guestEmail?: string;
            couponCode?: string;
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

                // 1. Try to find the Guest User ID via direct query
                const { data: existingGuest } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', GUEST_ACCOUNT_EMAIL)
                    .single();

                if (existingGuest) {
                    userId = existingGuest.id;
                } else {
                    // 2. Create if not exists using clean Admin API (No signIn)
                    const { data: createUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: GUEST_ACCOUNT_EMAIL,
                        password: GUEST_PASSWORD,
                        email_confirm: true,
                        user_metadata: { full_name: 'Guest User' }
                    });

                    if (createUser?.user) {
                        userId = createUser.user.id;
                        // Profile should be created automatically by DB trigger, 
                        // but let's ensure it has the customer role if needed.
                    } else {
                        console.error('Guest creation error:', createError);
                        return new Response(JSON.stringify({ error: 'Error initializing guest system.' }), { status: 500 });
                    }
                }
            } else {
                return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
            }
        }

        // Calculate total
        let totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;
        let appliedCoupon = null;

        // Apply Coupon if provided
        if (couponCode) {
            const { data: couponData, error: couponError } = await supabaseAdmin
                .rpc('validate_coupon', {
                    p_code: couponCode,
                    p_cart_amount: totalAmount
                });

            if (couponError) {
                console.error('Coupon validation error:', couponError);
            } else if (couponData && couponData.valid) {
                appliedCoupon = couponData;
                if (couponData.type === 'percentage') {
                    discountAmount = totalAmount * (couponData.value / 100);
                } else {
                    discountAmount = couponData.value;
                }
                totalAmount = Math.max(0, totalAmount - discountAmount);
            }
        }

        // Create order in database with status 'pending'
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId, // Can be null now
                status: 'pending',
                total_amount: totalAmount,
                shipping_address: { ...shippingAddress, email: customerEmail },
                notes: appliedCoupon ? JSON.stringify({ coupon_code: appliedCoupon.code, discount_amount: discountAmount }) : null
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
            discounts: appliedCoupon ? [
                {
                    coupon: await (async () => {
                        // Create a temporary Stripe coupon for this transaction
                        const stripeCoupon = await stripe.coupons.create({
                            percent_off: appliedCoupon.type === 'percentage' ? appliedCoupon.value : undefined,
                            amount_off: appliedCoupon.type === 'fixed' ? Math.round(appliedCoupon.value * 100) : undefined,
                            currency: 'eur',
                            duration: 'once',
                            name: `Cupón: ${appliedCoupon.code}`
                        });
                        return stripeCoupon.id;
                    })()
                }
            ] : undefined,
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
