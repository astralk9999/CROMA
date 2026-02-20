import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';
import { sendOrderStatusEmail } from '@lib/email';

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return new Response(JSON.stringify({ success: false, message: 'Order ID is required' }), { status: 400 });
        }

        // Get user session
        const accessToken = cookies.get('sb-access-token')?.value;
        if (!accessToken) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
        if (authError || !user) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
        }

        // Fetch order to verify ownership, check status, and get email data
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                id, 
                user_id, 
                status,
                total_amount,
                shipping_address,
                profiles ( email ),
                order_items (
                    id,
                    product_id,
                    product_name,
                    quantity,
                    price,
                    size,
                    product:products ( name, images )
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({ success: false, message: 'Order not found' }), { status: 404 });
        }

        if (order.user_id !== user.id) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 403 });
        }

        // Rule: Only allow cancellation if pending or processing
        if (order.status === 'shipped' || order.status === 'delivered') {
            return new Response(JSON.stringify({
                success: false,
                message: 'No puedes cancelar un pedido que ya ha sido enviado o entregado.'
            }), { status: 400 });
        }

        if (order.status === 'cancelled') {
            return new Response(JSON.stringify({ success: true, message: 'El pedido ya estaba cancelado' }), { status: 200 });
        }

        // Mark as cancelled
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order status:', updateError);
            return new Response(JSON.stringify({ success: false, message: 'Failed to cancel order' }), { status: 500 });
        }

        // Restock items using the joined data
        if (order.order_items && order.order_items.length > 0) {
            for (const item of order.order_items) {
                try {
                    await supabaseAdmin.rpc('increment_stock', {
                        p_product_id: item.product_id,
                        p_size: item.size,
                        p_quantity: item.quantity
                    });
                } catch (restockError) {
                    console.error('Error restocking item during order cancellation:', restockError, item);
                }
            }
        }

        // Trigger Notification Email
        let customerEmail = (order as any).profiles?.email;
        if (!customerEmail && Array.isArray((order as any).profiles)) {
            customerEmail = (order as any).profiles[0]?.email;
        }
        if (!customerEmail) {
            customerEmail = (order.shipping_address as any)?.email;
        }

        if (customerEmail) {
            const emailItems = order.order_items.map((item: any) => ({
                ...item,
                product_name: item.product?.name || item.product_name,
                product_image: item.product?.images?.[0] || null
            }));

            // Fire and forget email
            sendOrderStatusEmail(
                customerEmail,
                orderId,
                'cancelled',
                emailItems,
                Number(order.total_amount)
            ).catch(e => console.error('[EMAIL_ERROR]:', e));
        }

        return new Response(JSON.stringify({ success: true, message: 'Pedido cancelado correctamente' }), { status: 200 });

    } catch (error: any) {
        console.error('Cancel order internal error:', error);
        return new Response(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
    }
};
