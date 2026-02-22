export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, locals }) => {
    const user = locals.user;
    const profile = locals.profile;

    if (!user || profile?.role !== 'admin') {
        return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), { status: 401 });
    }

    try {
        const { returnId, status } = await request.json();

        if (!returnId || !status) {
            return new Response(JSON.stringify({ success: false, message: 'Faltan parámetros' }), { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('return_requests')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (error) throw error;

        // --- Nivel 3 Rúbrica: Generar Factura Rectificativa al autorizar devolución ---
        if (status === 'approved') {
            try {
                const { data: returnReq } = await supabaseAdmin.from('return_requests').select('order_id').eq('id', returnId).single();
                if (returnReq && returnReq.order_id) {
                    const { data: currentOrder } = await supabaseAdmin.from('orders').select('total_amount').eq('id', returnReq.order_id).single();
                    if (currentOrder) {
                        await supabaseAdmin.rpc('generate_invoice', {
                            p_order_id: returnReq.order_id,
                            p_type: 'refund',
                            p_amount: currentOrder.total_amount
                        });
                        console.log(`[Admin API] Refund Invoice created for return: ${returnId}`);
                    }
                }
            } catch (invError) {
                console.error('[Admin API] Error generating refund invoice:', invError);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Estado de devolución actualizado'
        }), { status: 200 });

    } catch (err: unknown) {
        console.error('Update status error:', err); // Changed
        console.log('[Admin API Returns] Starting update...');
        const errorMessage = err instanceof Error ? err.message : 'Error interno';
        return new Response(JSON.stringify({
            success: false,
            message: errorMessage
        }), { status: 500 });
    }
};
