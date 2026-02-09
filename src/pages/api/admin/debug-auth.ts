import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const GET: APIRoute = async ({ locals }) => {
    const user = locals.user;
    const profile = locals.profile;

    if (!user) {
        return new Response(JSON.stringify({ error: 'No user in locals' }), { status: 401 });
    }

    try {
        // Fetch fresh from DB using Admin
        const { data: dbProfile, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Check internal DB role
        const { data: dbRole } = await supabaseAdmin.rpc('get_current_role');

        return new Response(JSON.stringify({
            locals_user_id: user.id,
            locals_profile: profile,
            db_role_seen_by_supabase: dbRole,
            db_profile: dbProfile,
            db_error: dbError,
            user_app_metadata: user.app_metadata
        }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
