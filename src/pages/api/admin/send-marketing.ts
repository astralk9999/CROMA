import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { sendMarketingEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. Authorization Check
    const user = locals.user;
    const profile = locals.profile;

    if (!user || profile?.role !== 'admin') {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 });
    }

    try {
        const { target, subject, title, body, ctaLink, ctaText, productIds, showStock, couponId } = await request.json();

        if (!target || !subject || !title || !body) {
            return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400 });
        }

        // 2. Fetch Recipients with personalization info
        let recipients: { email: string, name?: string }[] = [];

        if (target === 'subscribers' || target === 'all') {
            const { data: subs } = await supabaseAdmin.from('newsletter_subscribers').select('email');
            if (subs) recipients.push(...subs.map(s => ({ email: s.email, name: 'Suscriptor' })));
        }

        if (target === 'users' || target === 'all') {
            const { data: profiles } = await supabaseAdmin.from('profiles').select('email, first_name');
            if (profiles) recipients.push(...profiles.map(p => ({ email: p.email, name: p.first_name })));
        }

        // De-duplicate emails, preferring user profile name if available
        const emailMap = new Map<string, string | undefined>();
        recipients.forEach(r => {
            if (!emailMap.has(r.email) || (r.name && r.name !== 'Suscriptor')) {
                emailMap.set(r.email, r.name);
            }
        });

        const uniqueRecipients = Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));

        if (uniqueRecipients.length === 0) {
            return new Response(JSON.stringify({ success: false, message: 'No recipients found' }), { status: 404 });
        }

        // 3. Fetch Products
        let productsData: any[] = [];
        if (productIds && productIds.length > 0) {
            const { data: fetchedProducts } = await supabaseAdmin
                .from('products')
                .select('*')
                .in('id', productIds);

            if (fetchedProducts) {
                productsData = productIds
                    .map((id: string) => fetchedProducts.find(p => p.id === id))
                    .filter(Boolean);
            }
        }

        // 3.5 Fetch Coupon
        let couponData: { code: string, discount: string } | null = null;
        if (couponId) {
            const { data: coupon } = await supabaseAdmin
                .from('coupons')
                .select('code, discount_type, value')
                .eq('id', couponId)
                .single();

            if (coupon) {
                couponData = {
                    code: coupon.code,
                    discount: coupon.discount_type === 'percentage' ? `-${coupon.value}%` : `-${coupon.value}€`
                };
            }
        }

        // 4. Send Emails
        let results = {
            total: uniqueRecipients.length,
            sent: 0,
            failed: 0
        };

        for (const recipient of uniqueRecipients) {
            const result = await sendMarketingEmail(
                recipient.email,
                subject,
                title,
                body,
                ctaLink,
                ctaText,
                productsData,
                !!showStock,
                recipient.name,
                couponData?.code,
                couponData?.discount
            );

            if (result?.success) {
                results.sent++;
            } else {
                results.failed++;
            }
        }

        // 5. Record History
        await supabaseAdmin.from('marketing_campaigns').insert({
            subject,
            title,
            body,
            target,
            success_count: results.sent,
            failed_count: results.failed,
            total_recipients: results.total,
            cta_text: ctaText,
            cta_link: ctaLink,
            product_ids: productIds,
            coupon_code: couponData?.code,
            coupon_discount: couponData?.discount
        });

        return new Response(JSON.stringify({
            success: true,
            message: `¡Campaña finalizada! ${results.sent} envíos exitosos.`,
            results
        }));

    } catch (error: any) {
        console.error('Marketing API Error:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
};
