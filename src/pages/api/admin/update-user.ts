export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;
        const profile = locals.profile;

        // Verify admin session
        if (!user || profile?.role !== 'admin') {
            console.warn('[API Update User] Unauthorized attempt:', {
                email: user?.email,
                role: profile?.role,
                hasUser: !!user,
                hasProfile: !!profile
            });
            return new Response(JSON.stringify({
                success: false,
                message: 'No autorizado. Se requieren permisos de administrador.'
            }), { status: 403 });
        }

        const { userId, updates } = await request.json();
        console.log('[PROX] Validando para:', user?.email);

        if (!userId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'ID de usuario no proporcionado.'
            }), { status: 400 });
        }

        // Perform update using admin client to bypass RLS
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: updates.full_name,
                phone: updates.phone,
                role: updates.role,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Update user error:', error);
            return new Response(JSON.stringify({
                success: false,
                message: 'Error al actualizar el usuario en la base de datos.',
                error: error.message
            }), { status: 500 });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Usuario actualizado correctamente.'
        }), { status: 200 });

    } catch (err: unknown) {
        console.error('[API Update User] Critical Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error interno en el servidor';
        return new Response(JSON.stringify({
            success: false,
            message: 'Error crítico en el servidor.',
            error: errorMessage
        }), { status: 500 });
    }
};
