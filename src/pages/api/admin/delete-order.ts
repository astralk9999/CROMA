import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. Session & Role Validation
    const user = locals.user;
    const profile = locals.profile;

    console.log(`[PROXY] Validando pedido para: ${user?.email} | Rol: ${profile?.role}`);

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

        console.log(`[PROXY] Iniciando borrado de pedido: ${orderId}`);

        // 2. Execute Deletion via Admin RPC with Hard Bypass
        const { data, error } = await supabaseAdmin.rpc('admin_delete_order', {
            p_order_id: orderId,
            p_admin_bypass: 'SECURE_SERVER_BYPASS'
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

        console.log(`[PROXY] Borrado de pedido exitoso: ${orderId}`);
        return new Response(JSON.stringify({
            success: true,
            message: 'Pedido eliminado correctamente'
        }), { status: 200 });

    } catch (err: any) {
        console.error('[PROXY] Error crítico en API de borrado de pedidos:', err);
        return new Response(JSON.stringify({
            success: false,
            message: err.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
