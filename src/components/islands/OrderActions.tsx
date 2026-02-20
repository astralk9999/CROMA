import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReturnModal from './ReturnModal';
import { webConfirm, webAlert } from './PublicModal';

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
        cancelTitle: string;
        cancelSuccessTitle: string;
        errorTitle: string;
        attentionTitle: string;
        returnModal: any; // We'll pass the full return modal translations object here
    };
}

export default function OrderActions({ orderId, initialStatus, translations }: OrderActionsProps) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const handleCancel = async () => {
        const confirmed = await webConfirm(translations.confirmCancel, translations.cancelTitle);
        if (!confirmed) return;

        setLoading(true);
        try {
            const response = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId })
            });

            const data = await response.json();
            if (data.success) {
                setStatus('cancelled');
                await webAlert(translations.cancelSuccess, translations.cancelSuccessTitle);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            await webAlert(translations.cancelError.replace('{error}', error.message), translations.errorTitle, true);
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
        <div className="flex flex-wrap gap-4">
            {/* Payment retry is ONLY for strictly pending orders */}
            {status === 'pending' && (
                <button
                    onClick={handleRetryPayment}
                    disabled={loading}
                    className="bg-zinc-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
                >
                    {loading ? translations.waiting : translations.payNow}
                </button>
            )}

            {/* Cancellation is allowed for pending OR processing (en preparación) */}
            {(status === 'pending' || status === 'processing') && (
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="bg-white text-zinc-500 border border-zinc-200 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
                >
                    {loading ? translations.waiting : translations.cancelOrder}
                </button>
            )}

            {status === 'delivered' && (
                <button
                    onClick={() => setIsReturnModalOpen(true)}
                    className="bg-zinc-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-xl flex items-center gap-3 group active:scale-95"
                >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" /></svg>
                    {translations.startReturn}
                </button>
            )}

            {status === 'cancelled' && (
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
