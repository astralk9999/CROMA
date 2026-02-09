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

        return new Response(JSON.stringify({
            success: true,
            message: 'Estado de devolución actualizado'
        }), { status: 200 });

    } catch (err: any) {
        console.error('[Admin API Returns] Error:', err);
        return new Response(JSON.stringify({
            success: false,
            message: err.message || 'Error interno'
        }), { status: 500 });
    }
};
