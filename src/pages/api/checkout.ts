export const prerender = false;
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@lib/supabase-admin';
import { RateLimiter } from '@lib/rate-limit';

const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    throw new Error('CRITICAL_INFRA_FAILURE: STRIPE_SECRET_KEY is missing from environment variables');
}

const stripe = new Stripe(stripeKey, {
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
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
        const rateLimit = RateLimiter.check(`checkout_${ip}`, 10, 60000); // 10 checkouts per minute per IP

        if (!rateLimit.success) {
            return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
                status: 429, headers: { 'Content-Type': 'application/json' }
            });
        }

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

                // Use the pre-existing guest user ID (set via env var or lookup)
                const guestUserId = import.meta.env.GUEST_USER_ID;
                if (guestUserId) {
                    userId = guestUserId;
                } else {
                    // Fallback: find guest user by email in profiles
                    const { data: existingGuest } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .eq('email', 'guest@croma.shop')
                        .single();

                    if (existingGuest) {
                        userId = existingGuest.id;
                    } else {
                        console.error('Guest user not found. Set GUEST_USER_ID env var.');
                        return new Response(JSON.stringify({ error: 'Error en el sistema de invitados.' }), { status: 500 });
                    }
                }
            } else {
                return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
            }
        }

        // IMPORTANT: Validate products and calculate total securely
        const productIds = items.map((item: CartItem) => item.id);

        // Ensure all IDs are valid UUIDs to prevent Postgres syntax errors
        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!productIds.every(isValidUUID)) {
            return new Response(JSON.stringify({ error: 'Se han detectado productos inválidos en tu carrito. Por favor elimínalos y vuelve a añadirlos.' }), { status: 400 });
        }

        const { data: dbProducts, error: dbError } = await supabaseAdmin
            .from('products')
            .select('id, name, price, stock_by_sizes, is_hidden')
            .in('id', productIds);

        if (dbError) {
            console.error('Database error fetching products:', dbError);
            return new Response(JSON.stringify({ error: 'Error validating cart products.' }), { status: 500 });
        }

        // Check if any product is missing or archived
        let subtotal = 0;
        for (const item of items) {
            const dbProduct = dbProducts?.find(p => p.id === item.id);
            if (!dbProduct || dbProduct.is_hidden) {
                return new Response(JSON.stringify({ error: `El producto "${item.name}" ya no está disponible en la tienda.` }), { status: 400 });
            }
            // Update item price to real DB price
            item.price = dbProduct.price;
            subtotal += item.price * item.quantity;
        }

        let totalAmount = subtotal; // Base for coupon
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
                    discountAmount = subtotal * (couponData.value / 100);
                } else if (couponData.type === 'fixed') {
                    discountAmount = couponData.value;
                }
            }
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);
        totalAmount = parseFloat((subtotal - discountAmount).toFixed(2));

        // Create order in database with status 'pending'
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId,
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
            return new Response(JSON.stringify({ error: `Failed to create order items: ${itemsError.message} - ${itemsError.details} - ${itemsError.hint}` }), { status: 500 });
        }

        // Reserve Stock (Decrement immediately)
        const decrementedItems: CartItem[] = [];
        for (const item of items) {
            const { data: stockResult, error: stockError } = await supabaseAdmin
                .rpc('decrement_stock', {
                    p_product_id: item.id,
                    p_size: item.size,
                    p_quantity: item.quantity
                });

            if (stockError || (stockResult && !stockResult.success)) {
                console.error(`Stock reservation failed for ${item.name}:`, stockError || stockResult);
                // Rollback previously decremented stock
                for (const prev of decrementedItems) {
                    try {
                        await supabaseAdmin.rpc('decrement_stock', {
                            p_product_id: prev.id,
                            p_size: prev.size,
                            p_quantity: -prev.quantity  // Negative to restore
                        });
                    } catch (restoreErr) {
                        console.error('Stock restore failed for', prev.name, restoreErr);
                    }
                }
                // Rollback Order
                await supabaseAdmin.from('order_items').delete().eq('order_id', order.id);
                await supabaseAdmin.from('orders').delete().eq('id', order.id);
                return new Response(JSON.stringify({ error: `Sin stock suficiente para ${item.name} (${item.size})` }), { status: 400 });
            }
            decrementedItems.push(item);
        }

        // Create Stripe line items
        const lineItems = items.map((item) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `${item.name} (Talla: ${item.size})`,
                    images: item.image && item.image.startsWith('http') ? [item.image] : [],
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
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
            cancel_url: `${origin}/checkout/cancel`,
            customer_email: customerEmail,
            metadata: {
                order_id: order.id,
                user_id: userId || 'guest',
            },
            discounts: appliedCoupon ? [
                {
                    coupon: await (async () => {
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
        return new Response(JSON.stringify({ error: 'Error procesando el pago. Inténtalo de nuevo.' }), { status: 500 });
    }
};
