import type { APIRoute } from 'astro';
import { supabase } from '@lib/supabase';

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

        // Check if email already exists
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('email')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return new Response(JSON.stringify({
                message: '¡Ya estás suscrito! Gracias por tu interés.'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert new subscriber
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert({
                email: email.toLowerCase()
            });

        if (error) {
            console.error('Newsletter subscription error:', error);
            return new Response(JSON.stringify({
                error: 'Error al suscribirse. Inténtalo de nuevo.'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            message: '¡Bienvenido a la resistencia! Te enviaremos las mejores ofertas.'
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
