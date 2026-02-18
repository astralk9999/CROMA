import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export const GET: APIRoute = async ({ request, locals, url }) => {
    const user = locals.user;
    const profile = locals.profile;

    if (!user || profile?.role !== 'admin') {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
    }

    const q = url.searchParams.get('q')?.trim() || '';

    if (q.length < 2) {
        return new Response(JSON.stringify({ success: true, data: [] }));
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name')
            .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
            .limit(10);

        if (error) throw error;

        const results = (data || []).map(p => ({
            id: p.id,
            email: p.email,
            name: p.full_name || p.email
        }));

        return new Response(JSON.stringify({ success: true, data: results }));
    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
};
