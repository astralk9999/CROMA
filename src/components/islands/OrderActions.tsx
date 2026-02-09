import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReturnModal from './ReturnModal';

// Initialize Supabase Client (safe for client-side if public key used)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OrderActionsProps {
    orderId: string;
    initialStatus: string;
}

export default function OrderActions({ orderId, initialStatus }: OrderActionsProps) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);

    // Status Check Helpers
    const canCancel = ['pending', 'processing', 'paid'].includes(status);
    const canReturn = status === 'delivered';

    const handleCancel = async () => {
        if (!confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción es irreversible.')) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('cancel_order', { p_order_id: orderId });

            if (error) throw error;
            if (data && data.success === false) {
                alert('Error: ' + data.message);
            } else {
                setStatus('cancelled');
                alert('Pedido cancelado correctamente. El stock ha sido restaurado.');
                window.location.reload(); // Refresh to update UI fully
            }
        } catch (err: any) {
            console.error(err);
            alert('Error al cancelar el pedido: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResumePayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    origin: window.location.origin
                })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error al regenerar sesión de pago: ' + data.error);
            }
        } catch (err: any) {
            console.error(err);
            alert('Error en el protocolo de pago.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'cancelled') {
        return <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 border border-red-300 bg-red-50 px-4 py-2 rounded-full italic">Cancelado_Protocol</span>;
    }

    return (
        <div className="flex gap-4 justify-end items-center">
            {canCancel && (
                <>
                    {status === 'pending' && (
                        <button
                            onClick={handleResumePayment}
                            disabled={loading}
                            className="px-8 py-3 bg-zinc-900 border border-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-zinc-900/20 rounded-full active:scale-95"
                        >
                            {loading ? 'WAITING...' : 'PAGAR AHORA'}
                        </button>
                    )}
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-6 py-3 border border-red-300 text-red-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-50 transition-all disabled:opacity-50 rounded-full"
                    >
                        {loading ? 'WAITING...' : 'CANCELAR PEDIDO'}
                    </button>
                </>
            )}

            {canReturn && (
                <>
                    <button
                        onClick={() => setShowReturnModal(true)}
                        className="px-8 py-3 bg-zinc-900 border border-zinc-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-zinc-900/20 rounded-full active:scale-95"
                    >
                        INICIAR DEVOLUCIÓN
                    </button>
                    <ReturnModal
                        isOpen={showReturnModal}
                        onClose={() => setShowReturnModal(false)}
                        orderId={orderId}
                    />
                </>
            )}
        </div>
    );
}
