export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';
import { sendOrderStatusEmail } from '@lib/email';

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. Session & Role Validation
    const user = locals.user;
    const profile = locals.profile;

    if (!user || profile?.role !== 'admin') {
        return new Response(JSON.stringify({
            success: false,
            message: 'Acceso denegado: Se requieren privilegios de administrador'
        }), { status: 401 });
    }

    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Faltan parámetros: orderId y status son obligatorios'
            }), { status: 400 });
        }

        // Validate status against allowed values
        const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!VALID_STATUSES.includes(status)) {
            return new Response(JSON.stringify({
                success: false,
                message: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`
            }), { status: 400 });
        }

        // 2. Fetch Current Order State
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products (
                        name,
                        images
                    )
                ),
                profiles (email)
            `)
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Pedido no encontrado'
            }), { status: 404 });
        }


        // 4. Update Order Status
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('[Admin API] Order Status Update Error:', updateError);
            return new Response(JSON.stringify({
                success: false,
                message: updateError.message
            }), { status: 500 });
        }

        // --- NEW: Restore Stock if Cancelled ---
        if (status === 'cancelled') {
            try {
                await supabaseAdmin.rpc('restore_stock', { p_order_id: orderId });
                console.log(`[Admin API] Stock restored for cancelled order: ${orderId}`);

                // --- Nivel 3 Rúbrica: Generar factura rectificativa (abono) al cancelar ---
                const { data: currentOrder } = await supabaseAdmin.from('orders').select('total_amount').eq('id', orderId).single();
                if (currentOrder) {
                    await supabaseAdmin.rpc('generate_invoice', {
                        p_order_id: orderId,
                        p_type: 'refund',
                        p_amount: currentOrder.total_amount
                    });
                    console.log(`[Admin API] Refund invoice generated for order: ${orderId}`);
                }
            } catch (restockError) {
                console.error('[Admin API] Error restocking items during cancellation:', restockError);
            }
        }

        // 5. Trigger Email Notification
        // Use profile email or fallback to shipping_address email for guests
        const customerEmail = order.profiles?.email || (order.shipping_address as any)?.email;

        if (customerEmail) {
            // Map items to include product image from relation
            const emailItems = order.order_items.map((item: any) => ({
                ...item,
                product_name: item.product?.name || item.product_name,
                product_image: item.product?.images?.[0] || null
            }));

            // FIRE AND FORGET (don't block response)
            sendOrderStatusEmail(
                customerEmail,
                orderId,
                status,
                emailItems,
                Number(order.total_amount)
            ).catch(e => console.error('[EMAIL_ERROR]:', e));
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Estado del pedido actualizado y notificación enviada'
        }), { status: 200 });

    } catch (err: unknown) {
        console.error('Update status error:', err);
        return new Response(JSON.stringify({
            success: false,
            message: 'Error interno del servidor'
        }), { status: 500 });
    }
};
