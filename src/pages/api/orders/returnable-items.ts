import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const GET: APIRoute = async ({ params, locals, request }) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), { status: 401 });
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
        return new Response(JSON.stringify({ success: false, message: 'Falta Order ID' }), { status: 400 });
    }

    try {
        // 1. Verify order belongs to user
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('user_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order || order.user_id !== user.id) {
            return new Response(JSON.stringify({ success: false, message: 'Pedido no encontrado o acceso denegado' }), { status: 404 });
        }

        // 2. Get all items for this order
        const { data: items, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // 3. Get all items already returned for this order (across all requests)
        // We look for return_requests -> return_request_items
        const { data: returnedItems, error: returnedError } = await supabaseAdmin
            .from('return_request_items')
            .select('order_item_id')
            .eq('return_requests.order_id', orderId) // This join might not work directly without setup, let's step back
            // Alternative: Get all return_requests for this order, then get all items for those requests
            // OR: simpler query
            ;

        // Let's do it in two steps for safety with Supabase syntax
        const { data: requests } = await supabaseAdmin
            .from('return_requests')
            .select('id')
            .eq('order_id', orderId);

        const requestIds = requests?.map(r => r.id) || [];

        let alreadyReturnedItemIds: string[] = [];

        if (requestIds.length > 0) {
            const { data: rItems } = await supabaseAdmin
                .from('return_request_items')
                .select('order_item_id')
                .in('return_request_id', requestIds);

            alreadyReturnedItemIds = rItems?.map(i => i.order_item_id) || [];
        }

        return new Response(JSON.stringify({
            success: true,
            items: items.map(item => ({
                ...item,
                is_returned: alreadyReturnedItemIds.includes(item.id)
            }))
        }), { status: 200 });

    } catch (err: any) {
        console.error('[API Returnables] Error:', err);
        return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
    }
};
