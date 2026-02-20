import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';
import {
    sendWelcomeEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
    sendRecentlyViewedEmail
} from '@lib/email';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { type, email } = await request.json();
        const targetEmail = email || 'uruburukoldo@gmail.com'; // Default to admin if not provided

        // Mock Data for Testing
        const mockOrderItems = [
            {
                product_name: 'OVERSIZED HOODIE // ACID WASH',
                product_image: 'https://res.cloudinary.com/dqjtkdoni/image/upload/v1770122707/brand/logo_c_horns.png', // Fallback to logo if no product image handy, or use a real URL
                size: 'L',
                quantity: 1,
                price: 89.95
            },
            {
                product_name: 'CARGO PANTS // TACTICAL BLACK',
                product_image: '',
                size: '32',
                quantity: 2,
                price: 120.00
            }
        ];

        const mockAddress = {
            name: 'Koldo Tester',
            address: 'Calle de la Moda 123',
            city: 'Madrid',
            postal_code: '28001',
            country: 'España'
        };

        const mockProduct = {
            name: 'VINTAGE TEE // BLACK',
            slug: 'vintage-tee-black',
            price: 45.00,
            images: ['https://res.cloudinary.com/dqjtkdoni/image/upload/v1770122707/brand/logo_c_horns.png']
        };

        switch (type) {
            case 'welcome':
                await sendWelcomeEmail(targetEmail, 'WELCOME-TEST-2026');
                break;
            case 'confirmation':
                await sendOrderConfirmationEmail(
                    targetEmail,
                    'ORD-TEST-12345678',
                    mockOrderItems,
                    329.95,
                    mockAddress
                );
                break;
            case 'status':
                await sendOrderStatusEmail(
                    targetEmail,
                    'ORD-TEST-12345678',
                    'shipped',
                    mockOrderItems,
                    329.95
                );
                break;
            case 'reminder':
                await sendRecentlyViewedEmail(targetEmail, [mockProduct]);
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid email type' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true, message: `Test email (${type}) sent to ${targetEmail}` }), { status: 200 });

    } catch (error: any) {
        console.error('Test email error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
