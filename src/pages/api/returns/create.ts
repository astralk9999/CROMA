import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    if (!user) {
        return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), { status: 401 });
    }

    try {
        const { orderId, reason, details, images, items: itemIds } = await request.json();

        if (!orderId || !reason || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'Faltan parámetros o artículos no seleccionados' }), { status: 400 });
        }

        // 1. Verify order belongs to user and is delivered
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('user_id, status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({ success: false, message: 'Pedido no encontrado' }), { status: 404 });
        }

        if (order.user_id !== user.id) {
            return new Response(JSON.stringify({ success: false, message: 'Acceso denegado' }), { status: 403 });
        }

        if (order.status !== 'delivered') {
            return new Response(JSON.stringify({ success: false, message: 'Solo se pueden devolver pedidos entregados' }), { status: 400 });
        }

        // 2. Verify items belong to order and haven't been returned yet
        // A. Check ownership
        const { data: orderItems, error: itemsCheckError } = await supabaseAdmin
            .from('order_items')
            .select('id')
            .eq('order_id', orderId)
            .in('id', itemIds);

        if (itemsCheckError || !orderItems || orderItems.length !== itemIds.length) {
            return new Response(JSON.stringify({ success: false, message: 'Artículos inválidos para este pedido' }), { status: 400 });
        }

        // B. Check for duplicates (already returned)
        // Helper: Get all return requests for this order -> get all items for those requests
        const { data: existingRequests } = await supabaseAdmin
            .from('return_requests')
            .select('id')
            .eq('order_id', orderId);

        if (existingRequests && existingRequests.length > 0) {
            const requestIds = existingRequests.map(r => r.id);
            const { data: alreadyReturned } = await supabaseAdmin
                .from('return_request_items')
                .select('order_item_id')
                .in('return_request_id', requestIds)
                .in('order_item_id', itemIds);

            if (alreadyReturned && alreadyReturned.length > 0) {
                return new Response(JSON.stringify({ success: false, message: 'Uno o más artículos ya han sido devueltos previamente' }), { status: 400 });
            }
        }

        // 3. Create return request header
        const { data: newReturn, error: returnError } = await supabaseAdmin
            .from('return_requests')
            .insert({
                order_id: orderId,
                user_id: user.id,
                reason,
                details,
                images,
                status: 'pending'
            })
            .select() // Neccesary to get ID
            .single();

        if (returnError) throw returnError;

        // 4. Create return request items
        const returnItemsData = itemIds.map(itemId => ({
            return_request_id: newReturn.id,
            order_item_id: itemId,
            quantity: 1 // Defaulting to 1 as per current logic
        }));

        const { error: itemsInsertError } = await supabaseAdmin
            .from('return_request_items')
            .insert(returnItemsData);

        if (itemsInsertError) {
            // Rollback? Supabase doesn't support easy rollback in HTTP API without stored procedures.
            // We'll log it and user calls support, or we leave the header empty (not ideal).
            // For now, throw.
            console.error('Error inserting items:', itemsInsertError);
            throw new Error('Error al registrar artículos de la devolución');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Solicitud de devolución creada correctamente'
        }), { status: 200 });

    } catch (err: any) {
        console.error('[API Returns] Error:', err);
        return new Response(JSON.stringify({
            success: false,
            message: err.message || 'Error interno'
        }), { status: 500 });
    }
};
