export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@lib/supabase-admin';

export const GET: APIRoute = async ({ params, locals }) => {
    const invoiceId = params.id;
    const user = locals.user;

    if (!invoiceId) {
        return new Response('Invoice ID is required', { status: 400 });
    }

    if (!user) {
        return new Response('No autorizado. Debes iniciar sesión.', { status: 401 });
    }

    const { data: invoice, error } = await supabaseAdmin
        .from('invoices')
        .select(`
            *,
            orders (
                *,
                user_id,
                shipping_address,
                profiles (email),
                order_items (
                    *,
                    product:products (name)
                )
            )
        `)
        .eq('id', invoiceId)
        .single();

    if (error || !invoice) {
        return new Response('Factura no encontrada', { status: 404 });
    }

    // Authorization: User ID must match order User ID, or current user is Admin
    const isOwner = invoice.orders?.user_id === user.id;
    const isAdmin = locals.profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
        return new Response('Denegado: No eres el propietario de esta factura', { status: 403 });
    }

    // Helper formatting
    const isRefund = invoice.type === 'refund';
    const amountFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.amount);
    const dateStr = new Date(invoice.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    // Generate valid Legal HTML representation
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${invoice.invoice_number}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;}
            .title { font-size: 36px; font-weight: bold; margin: 0; text-transform: uppercase; color: ${isRefund ? '#d32f2f' : '#333'}; }
            .details { text-align: right; }
            .info-section { display: flex; justify-content: space-between; margin-bottom: 30px;}
            table { width: 100%; text-align: left; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f8f8; }
            .total { font-weight: bold; font-size: 20px; text-align: right; }
            .print-btn { padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; display: inline-block; margin-bottom: 20px; cursor: pointer; }
            @media print { .print-btn { display: none; } .invoice-box { box-shadow: none; border: none; } }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
            
            <div class="header">
                <div>
                    <h2>FASHION STORE</h2>
                    <p>C/ Paseo de Moda, 12, 28001<br>Madrid, España<br>CIF: B-12345678</p>
                </div>
                <div class="details">
                    <h1 class="title">${isRefund ? 'FACTURA RECTIFICATIVA' : 'FACTURA'}</h1>
                    <p><strong>Nº Factura:</strong> ${invoice.invoice_number}</p>
                    <p><strong>Fecha:</strong> ${dateStr}</p>
                    <p><strong>Nº Pedido:</strong> <small>${invoice.order_id}</small></p>
                </div>
            </div>

            <div class="info-section">
                <div>
                    <h3>Facturar A:</h3>
                    <p><strong>DNI/NIF Cliente:</strong> No facilitado<br>
                    <strong>Email:</strong> ${invoice.orders.profiles.email || 'N/D'}<br>
                    <strong>Ciudad:</strong> ${(invoice.orders.shipping_address as any)?.city || 'N/D'}
                    </p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Concepto / Artículo</th>
                        <th>Cantidad</th>
                        <th>Importe Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.orders.order_items.map((item: any) => `
                    <tr>
                        <td>${item.product_name || item.product?.name} (Talla: ${item.size})</td>
                        <td>${isRefund ? `-${item.quantity}` : item.quantity}</td>
                        <td>${item.price} €</td>
                        <td>${isRefund ? '-' : ''}${item.price * item.quantity} €</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: right; margin-top: 30px; font-size: 1.2rem;">
                <p>Subtotal: ${isRefund ? '-' : ''}${amountFormat}</p>
                <p>IVA (21% incl.): ${isRefund ? '-' : ''}${(invoice.amount * 0.21).toFixed(2)} €</p>
                <p class="total">TOTAL A ${isRefund ? 'DEVOLVER' : 'PAGAR'}: <span style="color: ${isRefund ? '#d32f2f' : '#333'}">${isRefund ? '-' : ''}${amountFormat}</span></p>
            </div>
            
            <div style="margin-top: 50px; font-size: 0.9em; color: #777;text-align:center;">
                <p>Documento generado con firma automatizada. Gracias por confiar en Fashion Store.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return new Response(htmlTemplate, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="Factura_${invoice.invoice_number}.html"`
        }
    });
};
