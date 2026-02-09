import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. Session & Role Validation
    const user = locals.user;
    const profile = locals.profile;

    console.log(`[PROXY] Validando acceso para: ${user?.email} | Rol en Locals: ${profile?.role}`);

    if (!user || profile?.role !== 'admin') {
        console.warn(`[PROXY] Acceso denegado. Usuario: ${user?.email}, Rol: ${profile?.role}`);
        return new Response(JSON.stringify({
            success: false,
            message: `NO_AUTH: Acceso denegado. Tu rol detectado es [${profile?.role || 'nulo'}]`
        }), { status: 401 });
    }

    try {
        const { productId } = await request.json();

        if (!productId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'MISSING_ID: ID de producto no proporcionado'
            }), { status: 400 });
        }

        console.log(`[PROXY] Iniciando borrado de producto: ${productId}`);

        // 2. Execute Deletion via Admin RPC with Hard Bypass
        const { data, error } = await supabaseAdmin.rpc('admin_delete_product', {
            p_product_id: productId,
            p_admin_bypass: 'SECURE_SERVER_BYPASS'
        });

        if (error) {
            console.error(`[PROXY] Error RPC Supabase:`, error);
            return new Response(JSON.stringify({
                success: false,
                message: error.message || 'Error en la comunicación con la base de datos'
            }), { status: 500 });
        }

        if (data && data.success === false) {
            console.error(`[PROXY] Fallo en lógica de negocio (RPC):`, data);
            return new Response(JSON.stringify(data), { status: 400 });
        }

        console.log(`[PROXY] Borrado exitoso: ${productId}`);
        return new Response(JSON.stringify({
            success: true,
            message: 'Producto eliminado correctamente'
        }), { status: 200 });

    } catch (err: any) {
        console.error('[PROXY] Error crítico en API de borrado:', err);
        return new Response(JSON.stringify({
            success: false,
            message: err.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
