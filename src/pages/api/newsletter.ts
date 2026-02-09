import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';
import { sendWelcomeEmail } from '@lib/email';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({
                error: 'Por favor, introduce un email válido'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Attempt to insert directly
        // We use supabaseAdmin to ensure we can insert regardless of RLS
        const { error } = await supabaseAdmin
            .from('newsletter_subscribers')
            .insert({
                email: email.toLowerCase()
            });

        if (error) {
            // Check for unique constraint violation (Postgres code 23505)
            if (error.code === '23505') {
                return new Response(JSON.stringify({
                    message: '¡Ya estás suscrito! Gracias por tu interés.'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            console.error('Newsletter subscription error:', error);
            return new Response(JSON.stringify({
                error: 'Error al suscribirse. Inténtalo de nuevo.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- NEW: Generate Welcome Coupon ---
        try {
            const couponCode = `WELCOME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

            const { error: couponError } = await supabaseAdmin
                .from('coupons')
                .insert({
                    code: couponCode,
                    discount_type: 'percentage',
                    value: 15,
                    is_active: true,
                    max_uses: 1,
                    expires_at: expiresAt.toISOString()
                });

            if (!couponError) {
                // Send Email - Now awaiting to ensure it doesn't get cut off
                try {
                    await sendWelcomeEmail(email.toLowerCase(), couponCode);
                } catch (emailErr) {
                    console.error('CRITICAL: Welcome email failed in API:', emailErr);
                }
            }
        } catch (couponGenError) {
            console.error('Coupon generation error:', couponGenError);
            // We don't fail the registration if coupon fails
        }

        return new Response(JSON.stringify({
            message: '¡Bienvenido a la resistencia! Te hemos enviado un cupón de regalo a tu email.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Newsletter API error:', error);
        return new Response(JSON.stringify({
            error: 'Error del servidor. Inténtalo de nuevo.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
