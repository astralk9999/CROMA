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
    translations: {
        confirmCancel: string;
        cancelSuccess: string;
        cancelError: string;
        paymentError: string;
        protocolError: string;
        payNow: string;
        cancelOrder: string;
        startReturn: string;
        waiting: string;
        cancelledProtocol: string;
        returnModal: any; // We'll pass the full return modal translations object here
    };
}

export default function OrderActions({ orderId, initialStatus, translations }: OrderActionsProps) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const handleCancel = async () => {
        if (!confirm(translations.confirmCancel)) return;

        setLoading(true);
        try {
            const response = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            const data = await response.json();
            if (data.success) {
                setStatus('CANCELADO');
                alert(translations.cancelSuccess);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            alert(translations.cancelError.replace('{error}', error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRetryPayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout/retry-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.message || translations.protocolError);
            }
        } catch (error: any) {
            alert(translations.paymentError.replace('{error}', error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-4 mt-8">
            {status === 'PENDIENTE' && (
                <>
                    <button
                        onClick={handleRetryPayment}
                        disabled={loading}
                        className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {loading ? translations.waiting : translations.payNow}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="bg-white text-zinc-400 border border-zinc-200 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-500 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? translations.waiting : translations.cancelOrder}
                    </button>
                </>
            )}

            {status === 'ENTREGADO' && (
                <button
                    onClick={() => setIsReturnModalOpen(true)}
                    className="bg-zinc-900 text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center gap-3 group active:scale-95 shadow-xl shadow-zinc-900/10"
                >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" /></svg>
                    {translations.startReturn}
                </button>
            )}

            {status === 'CANCELADO' && (
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 italic border border-zinc-100 px-6 py-3 rounded-full">
                    {translations.cancelledProtocol}
                </span>
            )}

            <ReturnModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                orderId={orderId}
                translations={translations.returnModal}
            />
        </div>
    );
}
