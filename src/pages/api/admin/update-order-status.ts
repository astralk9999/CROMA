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

        // 3. ENFORCE BUSINESS RULES
        // Rule: Cannot cancel/reset if already shipped or delivered
        const restrictedStatuses = ['shipped', 'delivered'];
        const targetBlocks = ['cancelled', 'pending'];

        if (restrictedStatuses.includes(order.status) && targetBlocks.includes(status)) {
            return new Response(JSON.stringify({
                success: false,
                message: `BLOQUEO DE SEGURIDAD: No se puede cancelar un pedido que ya está en estado ${order.status.toUpperCase()}`
            }), { status: 403 });
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

    } catch (err: any) {
        console.error('[Admin API] Critical Error:', err);
        return new Response(JSON.stringify({
            success: false,
            message: err.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
