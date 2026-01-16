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

    if (status === 'cancelled') {
        return <span className="text-red-600 font-bold border border-red-200 bg-red-50 px-3 py-1 rounded-full text-sm">Cancelado</span>;
    }

    return (
        <div className="flex gap-2 justify-end">
            {canCancel && (
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? 'Cancelando...' : 'Cancelar Pedido'}
                </button>
            )}

            {canReturn && (
                <>
                    <button
                        onClick={() => setShowReturnModal(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        Solicitar Devolución
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
