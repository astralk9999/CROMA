export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. Session & Role Validation
    const user = locals.user;
    const profile = locals.profile;

    console.log('[PROX] Acceso:', user?.email);

    if (!user || profile?.role !== 'admin') {
        console.warn(`[PROXY] Acceso denegado a Pedidos. Usuario: ${user?.email}, Rol: ${profile?.role}`);
        return new Response(JSON.stringify({
            success: false,
            message: `NO_AUTH: Acceso denegado. Rol detectado: [${profile?.role || 'nulo'}]`
        }), { status: 401 });
    }

    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'MISSING_ID: ID de pedido no proporcionado'
            }), { status: 400 });
        }

        console.log('[PROX] Iniciando borrado:', orderId);

        // 2. Execute Deletion via Admin RPC
        const { data, error } = await supabaseAdmin.rpc('admin_delete_order', {
            p_order_id: orderId
        });


        if (error) {
            console.error(`[PROXY] Error RPC Supabase Order:`, error);
            return new Response(JSON.stringify({
                success: false,
                message: error.message || 'Error en la comunicación con la base de datos'
            }), { status: 500 });
        }

        if (data && data.success === false) {
            console.error(`[PROXY] Fallo en RPC de Pedido:`, data);
            return new Response(JSON.stringify(data), { status: 400 });
        }

        console.log('[PROX] Borrado exitoso:', orderId);
        return new Response(JSON.stringify({
            success: true,
            message: 'Pedido eliminado correctamente'
        }), { status: 200 });

    } catch (err: any) {
        console.error('[PROX] Error crítico:', err);
        return new Response(JSON.stringify({
            success: false,
            message: 'Error interno del servidor'
        }), { status: 500 });
    }
};
