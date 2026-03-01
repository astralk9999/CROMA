export const prerender = false;
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@lib/supabase-admin';
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabaseAdmin } from '@lib/supabase-admin';

const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.error('CRITICAL: STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(stripeKey || '', {
    apiVersion: '2024-12-18.acacia' as any,
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
};


export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const body = await request.json();
        const { items, shippingAddress, email, userId: paramUserId } = body;

        if (!items || items.length === 0) return new Response(JSON.stringify({ error: 'No items' }), { 
            status: 400,
            headers: CORS_HEADERS 
        });

        // User Resolution
        let userId = paramUserId;
        let customerEmail = email || shippingAddress?.email;

        if (!userId) {
            const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (accessToken) {
                const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
                if (user) userId = user.id;
            }
        }

        // Guest handling: use env var or profile lookup (no listUsers!)
        if (!userId) {
            const guestUserId = import.meta.env.GUEST_USER_ID;
            if (guestUserId) {
                userId = guestUserId;
            } else {
                const { data: guestProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', 'guest@croma.shop')
                    .single();

                if (guestProfile) {
                    userId = guestProfile.id;
                } else {
                    console.error('Guest user not found. Set GUEST_USER_ID env var.');
                    return new Response(JSON.stringify({ error: 'Error en sistema de invitados' }), { 
                        status: 500,
                        headers: CORS_HEADERS
                    });

                }
            }
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
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order create failed:', orderError);
            return new Response(JSON.stringify({ error: 'Error creando el pedido' }), { 
                status: 500,
                headers: CORS_HEADERS
            });
        }

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

        const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);

        if (itemsError) {
            console.error('Order items creation error:', itemsError);
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return new Response(JSON.stringify({ error: 'Error creando los items del pedido' }), { 
                status: 500,
                headers: CORS_HEADERS
            });
        }

        // 3. Reserve Stock (same logic as checkout.ts)
        const decrementedItems: any[] = [];
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
                            p_quantity: -prev.quantity
                        });
                    } catch (restoreErr) {
                        console.error('Stock restore failed:', restoreErr);
                    }
                }
                await supabaseAdmin.from('order_items').delete().eq('order_id', order.id);
                await supabaseAdmin.from('orders').delete().eq('id', order.id);
                return new Response(JSON.stringify({ error: `Sin stock suficiente para ${item.name} (${item.size})` }), { 
                    status: 400,
                    headers: CORS_HEADERS
                });
            }
            decrementedItems.push(item);
        }

        // 4. Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'eur',
            metadata: {
                order_id: order.id,
                user_id: userId || 'guest'
            },
            payment_method_types: ['card'],
        });

        // 5. Update Order with PI ID
        await supabaseAdmin.from('orders').update({
            notes: JSON.stringify({ stripe_payment_intent: paymentIntent.id })
        }).eq('id', order.id);

        return new Response(JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            orderId: order.id
        }), { 
            status: 200,
            headers: CORS_HEADERS
        });

    } catch (e: any) {
        console.error('Mobile checkout error:', e);
        return new Response(JSON.stringify({ error: 'Error procesando el pago móvil' }), { 
            status: 500,
            headers: CORS_HEADERS
        });
    }
};
