import nodemailer from 'nodemailer';

// Environment helpers
const getEnv = (key: string) => {
    return import.meta.env[key] || (typeof process !== 'undefined' ? process.env[key] : undefined);
};

const SMTP_HOST = (getEnv('SMTP_HOST') || 'smtp-relay.brevo.com').trim();
const SMTP_PORT = parseInt(getEnv('SMTP_PORT') || '587');
const SMTP_USER = (getEnv('SMTP_USER') || 'a0173e001@smtp-brevo.com').trim();
const rawPass = getEnv('SMTP_PASS') || '';
const SMTP_PASS = rawPass.replace(/\s/g, '');

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// Logo hosted on Cloudinary
const LOGO_URL = 'https://res.cloudinary.com/dqjtkdoni/image/upload/v1770122707/brand/logo_c_horns.png';

// ============================================
// EMAIL TEMPLATE - Minimalist Urban
// Robust layout, no absolute positioning
// ============================================
const emailWrapper = (content: string, showCta = true) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f3f3;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f3f3;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                
                <!-- Main Container -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5;">
                    
                    <!-- Top Accent Line -->
                    <tr>
                        <td height="4" style="background-color: #000000;"></td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #f0f0f0;">
                            <img src="${LOGO_URL}" alt="CROMA" style="width: 48px; height: 48px; display: block; margin-bottom: 24px;" border="0" />
                            <h1 style="margin: 0; font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #000000; text-transform: uppercase; line-height: 1.2;">CROMA</h1>
                            <p style="margin: 8px 0 0 0; font-family: 'Inter', sans-serif; font-size: 10px; color: #666666; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">Urban Collective</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px; background-color: #000000; color: #888888;">
                            ${showCta ? `
                                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                                    <tr>
                                        <td align="center" style="background-color: #ffffff;">
                                            <a href="https://croma.shop" style="display: block; padding: 14px 32px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 900; color: #000000; text-decoration: none; text-transform: uppercase; letter-spacing: 2px;">Shop Now</a>
                                        </td>
                                    </tr>
                                </table>
                            ` : ''}
                            <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #666666;">© 2026 CROMA</p>
                            <p style="margin: 8px 0 0 0; font-family: 'Inter', sans-serif; font-size: 10px; color: #444444;">Elevating streetwear to a new dimension.</p>
                            
                            <!-- Social / Links (Optional) -->
                            <p style="margin: 24px 0 0 0; font-size: 10px;">
                                <a href="https://croma.shop" style="color: #666666; text-decoration: none; margin: 0 10px;">Web</a>
                                <a href="https://instagram.com" style="color: #666666; text-decoration: none; margin: 0 10px;">Instagram</a>
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
`;

// ============================================
// STATUS CONFIG
// ============================================
const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En Preparación',
    shipped: 'En Tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

const statusColors: Record<string, string> = {
    pending: '#d97706',   // amber-600
    processing: '#2563eb', // blue-600
    shipped: '#7c3aed',    // violet-600
    delivered: '#059669',  // emerald-600
    cancelled: '#dc2626'   // red-600
};

// ============================================
// EMAIL FUNCTIONS
// ============================================

export async function sendWelcomeEmail(to: string, couponCode: string) {
    if (!SMTP_PASS) return;

    const content = `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <h2 style="margin: 0 0 16px 0; font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Welcome to the<br/>Community</h2>
                    <p style="margin: 0 0 32px 0; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6; color: #444444; max-width: 400px;">
                        Gracias por unirte. Tu acceso exclusivo comienza ahora. Aquí tienes un detalle para tu primera adquisición.
                    </p>
                    
                    <!-- Coupon Block -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="border: 1px dashed #cccccc; background-color: #fafafa; margin-bottom: 32px;">
                        <tr>
                            <td align="center" style="padding: 24px;">
                                <p style="margin: 0 0 8px 0; font-size: 9px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 2px;">CÓDIGO EXCLUSIVO</p>
                                <p style="margin: 0; font-family: monospace; font-size: 28px; font-weight: 700; color: #000000; letter-spacing: 2px;">${couponCode}</p>
                                <p style="margin: 12px 0 0 0; font-size: 10px; color: #666666;">15% OFF · Válido 30 días</p>
                            </td>
                        </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; color: #888888;">Make it count.</p>
                </td>
            </tr>
        </table>
    `;

    try {
        await transporter.sendMail({
            from: '"CROMA" <uruburukoldo@gmail.com>',
            to,
            subject: 'Welcome to the Collective 🏴',
            html: emailWrapper(content)
        });
        console.log(`Welcome email sent to ${to}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}

export async function sendOrderConfirmationEmail(
    to: string,
    orderId: string,
    items: any[],
    total: number,
    shippingAddress: any
) {
    if (!SMTP_PASS) return;

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding-bottom: 16px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #f0f0f0;">
                    <tr>
                        <td width="80" style="vertical-align: top; background-color: #f9f9f9;">
                            ${item.product_image
            ? `<img src="${item.product_image}" width="80" height="100" style="display: block; object-fit: cover;" />`
            : `<div style="width: 80px; height: 100px; background-color: #eeeeee;"></div>`
        }
                        </td>
                        <td style="padding: 16px; vertical-align: middle;">
                            <p style="margin: 0 0 4px 0; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; color: #000000; text-transform: uppercase;">${item.product_name}</p>
                            <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 10px; color: #666666; text-transform: uppercase;">
                                ${item.size} <span style="color: #cccccc;">|</span> Qty: ${item.quantity}
                            </p>
                        </td>
                        <td align="right" style="padding: 16px; vertical-align: middle;">
                            <p style="margin: 0; font-family: monospace; font-size: 13px; font-weight: 600; color: #000000;">${Number(item.price).toFixed(2)}€</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    `).join('');

    const content = `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding-bottom: 32px;">
                    <div style="width: 40px; height: 40px; border: 1px solid #000000; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                        <span style="font-size: 18px; line-height: 40px;">✓</span>
                    </div>
                    <h2 style="margin: 0; font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 1px;">Confirmado</h2>
                    <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 12px; color: #666666;">#${orderId.slice(0, 8).toUpperCase()}</p>
                </td>
            </tr>
            
            <tr>
                <td style="padding-bottom: 8px;">
                     <p style="margin: 0; font-size: 9px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Tu Pedido</p>
                </td>
            </tr>
            
            ${itemsHtml}
            
            <tr>
                <td style="padding-top: 8px; padding-bottom: 32px; border-top: 1px solid #000000;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td align="left">
                                <span style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #000000;">Total</span>
                            </td>
                            <td align="right">
                                <span style="font-family: monospace; font-size: 16px; font-weight: 700; color: #000000;">${total.toFixed(2)}€</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            
            <tr>
                <td style="background-color: #f9f9f9; padding: 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 9px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Envío a</p>
                    <p style="margin: 0; font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.6; color: #000000;">
                        <strong style="text-transform: uppercase;">${shippingAddress?.name || ''}</strong><br/>
                        ${shippingAddress?.address || ''}<br/>
                        ${shippingAddress?.postal_code || ''} ${shippingAddress?.city || ''}<br/>
                        <span style="color: #666666;">${shippingAddress?.country || 'España'}</span>
                    </p>
                </td>
            </tr>
        </table>
    `;

    try {
        await transporter.sendMail({
            from: '"CROMA" <uruburukoldo@gmail.com>',
            to,
            subject: `Confirmed: #${orderId.slice(0, 8).toUpperCase()}`,
            html: emailWrapper(content)
        });
        console.log(`Order confirmation email sent to ${to}`);
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
    }
}

export async function sendOrderStatusEmail(to: string, orderId: string, status: string, items: any[], total: number) {
    if (!SMTP_PASS) return;

    const itemsSummary = items.map(item => `
        <span style="display: inline-block; padding: 4px 8px; background-color: #f0f0f0; margin: 0 4px 4px 0; font-size: 10px; color: #444444;">${item.product?.name || item.product_name}</span>
    `).join('');

    const statusColor = statusColors[status] || '#000000';

    const content = `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding-bottom: 32px;">
                    <p style="margin: 0 0 8px 0; font-size: 9px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Actualización</p>
                    <h2 style="margin: 0; font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 900; color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px;">${statusLabels[status]}</h2>
                    <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 12px; color: #666666;">#${orderId.slice(0, 8).toUpperCase()}</p>
                </td>
            </tr>
            
            <tr>
                <td style="padding: 24px; border: 1px solid #f0f0f0; text-align: center;">
                    <p style="margin: 0 0 16px 0; font-size: 10px; color: #666666;">Artículos en este pedido:</p>
                    <div>${itemsSummary}</div>
                </td>
            </tr>
            
            <tr>
                <td align="center" style="padding-top: 32px;">
                    <a href="https://croma.shop/account/orders" style="font-size: 11px; text-decoration: underline; color: #000000; font-weight: 600;">Ver detalles del pedido</a>
                </td>
            </tr>
        </table>
    `;

    try {
        await transporter.sendMail({
            from: '"CROMA" <uruburukoldo@gmail.com>',
            to,
            subject: `${statusLabels[status]} - #${orderId.slice(0, 8)}`,
            html: emailWrapper(content)
        });
        console.log(`Status update email (${status}) sent to ${to}`);
    } catch (error) {
        console.error('Error sending status email:', error);
    }
}

export async function sendRecentlyViewedEmail(to: string, products: any[]) {
    if (!SMTP_PASS || products.length === 0) return;

    const productsHtml = products.slice(0, 2).map(product => `
        <a href="https://croma.shop/productos/${product.slug}" style="text-decoration: none; display: block; margin-bottom: 16px;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e5e5; transition: all 0.2s;">
                <tr>
                    <td width="100" style="background-color: #f4f4f5;">
                        ${product.images?.[0]
            ? `<img src="${product.images[0]}" width="100" height="120" style="display: block; object-fit: cover;" />`
            : `<div style="width: 100px; height: 120px;"></div>`
        }
                    </td>
                    <td style="padding: 16px; verbose-align: middle;">
                        <h4 style="margin: 0 0 4px 0; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 800; color: #000000; text-transform: uppercase;">${product.name}</h4>
                        <p style="margin: 0; font-family: monospace; font-size: 14px; font-weight: 600; color: #444444;">${Number(product.price).toFixed(2)}€</p>
                    </td>
                    <td width="40" align="center" style="color: #000000; font-size: 18px;">→</td>
                </tr>
            </table>
        </a>
    `).join('');

    const content = `
        <div style="text-align: center; margin-bottom: 32px;">
            <p style="margin: 0 0 8px 0; font-size: 9px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Recordatorio</p>
            <h2 style="margin: 0; font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Don't sleep on it.</h2>
        </div>
        
        ${productsHtml}
        
        <p style="margin: 24px 0 0 0; text-align: center; font-size: 10px; color: #888888;">Stocks are limited.</p>
    `;

    try {
        await transporter.sendMail({
            from: '"CROMA" <uruburukoldo@gmail.com>',
            to,
            subject: 'Still interested? 👀',
            html: emailWrapper(content)
        });
        console.log(`Recently viewed reminder sent to ${to}`);
    } catch (error) {
        console.error('Error sending recently viewed email:', error);
    }
}

export async function sendMarketingEmail(
    to: string,
    subject: string,
    title: string,
    body: string,
    ctaLink?: string,
    ctaText?: string,
    products?: any[],
    showStock: boolean = false,
    userName?: string,
    couponCode?: string,
    couponDiscount?: string
) {
    if (!SMTP_PASS) return;

    // Apply Personalization
    const personalizedTitle = title.replace(/\{\{name\}\}/g, userName || 'Cliente');
    const personalizedBody = body.replace(/\{\{name\}\}/g, userName || 'Cliente');

    const productGridHtml = products && products.length > 0 ? generateProductGridHtml(products, showStock) : '';

    const couponHtml = couponCode ? `
        <div style="margin: 40px 0; padding: 32px; border: 2px dashed #000; background-color: #f9f9f9; text-align: center;">
            <p style="margin: 0 0 8px 0; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 2px;">Protocolo de Descuento Activo</p>
            <h3 style="margin: 0 0 16px 0; font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 900; color: #000; text-transform: uppercase;">${couponDiscount} OFF</h3>
            <div style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;">
                ${couponCode}
            </div>
            <p style="margin: 16px 0 0 0; font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px;">Aplica este código en el checkout para activar el beneficio.</p>
        </div>
    ` : '';

    const content = `
        <div style="text-align: center;">
            <p style="margin: 0 0 12px 0; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 2px;">Comunicación Exclusiva</p>
            <h2 style="margin: 0 0 24px 0; font-family: 'Inter', sans-serif; font-size: 26px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1.2;">${personalizedTitle}</h2>
            
            <div style="font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.8; color: #333333; text-align: left; margin-bottom: 32px; border-left: 2px solid #eeeeee; padding-left: 24px;">
                ${personalizedBody.replace(/\n/g, '<br/>')}
            </div>

            ${couponHtml}
            
            ${productGridHtml}

            ${ctaLink && ctaText ? `
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 40px auto 0 auto;">
                    <tr>
                        <td align="center" style="background-color: #000000;">
                            <a href="${ctaLink}" style="display: block; padding: 18px 48px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 900; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 3px;">${ctaText}</a>
                        </td>
                    </tr>
                </table>
            ` : ''}
            
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; font-size: 9px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Has recibido este email porque formas parte del colectivo CROMA.</p>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"CROMA Marketing" <uruburukoldo@gmail.com>',
            to,
            subject,
            html: emailWrapper(content, false)
        });
        return { success: true };
    } catch (error) {
        console.error('Error sending marketing email:', error);
        return { success: false, error };
    }
}

function generateProductGridHtml(products: any[], showStock: boolean) {
    const productRows = [];
    for (let i = 0; i < products.length; i += 2) {
        const item1 = products[i];
        const item2 = products[i + 1];

        productRows.push(`
            <tr>
                <td width="50%" style="padding: 10px; vertical-align: top;">
                    ${generateProductItemHtml(item1, showStock)}
                </td>
                <td width="50%" style="padding: 10px; vertical-align: top;">
                    ${item2 ? generateProductItemHtml(item2, showStock) : ''}
                </td>
            </tr>
        `);
    }

    return `
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
            ${productRows.join('')}
        </table>
    `;
}

function generateProductItemHtml(product: any, showStock: boolean) {
    const mainImage = product.images?.[0] || 'https://res.cloudinary.com/dqjtkdoni/image/upload/v1770122707/brand/logo_c_horns.png';
    const totalStock = product.stock || 0;
    const stockStatus = showStock ? `
        <p style="margin: 8px 0 0 0; font-size: 9px; font-weight: 700; color: ${totalStock < 5 ? '#dc2626' : '#666666'}; text-transform: uppercase; letter-spacing: 1px;">
            ${totalStock < 5 ? `¡Solo quedan ${totalStock}!` : `Stock disponible: ${totalStock}`}
        </p>
    ` : '';

    return `
        <a href="https://croma.shop/productos/${product.slug}" style="text-decoration: none; display: block; background-color: #ffffff; border: 1px solid #f0f0f0; transition: all 0.3s;">
            <div style="background-color: #f3f3f3; overflow: hidden;">
                <img src="${mainImage}" width="100%" alt="${product.name}" style="display: block; width: 100% !important; height: auto !important; aspect-ratio: 1/1; object-fit: cover;" />
            </div>
            <div style="padding: 15px; text-align: left;">
                <h4 style="margin: 0 0 4px 0; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">${product.name}</h4>
                <p style="margin: 0; font-family: monospace; font-size: 13px; font-weight: 600; color: #333333;">${Number(product.price).toFixed(2)}€</p>
                ${stockStatus}
            </div>
        </a>
    `;
}
