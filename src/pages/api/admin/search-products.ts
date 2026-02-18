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
            .from('products')
            .select('id, name, price, stock, images, category')
            .ilike('name', `%${q}%`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const results = (data || []).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            image: p.images?.[0] || null
        }));

        return new Response(JSON.stringify({ success: true, data: results }));
    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
};
