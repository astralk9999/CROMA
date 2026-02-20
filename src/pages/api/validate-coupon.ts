import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { code, amount } = await request.json();

        if (!code) {
            return new Response(JSON.stringify({ valid: false, message: 'Código requerido' }), { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc('validate_coupon', {
            p_code: code.toUpperCase(),
            p_cart_amount: amount
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Validation error:', error);
        return new Response(JSON.stringify({ valid: false, error: error.message }), { status: 500 });
    }
};
