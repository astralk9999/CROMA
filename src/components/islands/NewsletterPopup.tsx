import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export default function NewsletterPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Show after 5 seconds if not already subscribed/dismissed
        const isDismissed = localStorage.getItem('newsletter_dismissed');
        if (!isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('newsletter_dismissed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const { error } = await supabase.from('newsletter_subscribers').insert([{ email }]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setStatus('success');
                    setMessage('¡Ya estás suscrito! Usa el código WELCOME10.');
                    localStorage.setItem('newsletter_dismissed', 'true');
                    return;
                }
                throw error;
            }

            setStatus('success');
            setMessage('¡Gracias! Tu código de descuento es: WELCOME10');
            // Here we could also create a generated coupon via RPC if needed, 
            // but simpler to use a static one for now as per "simple" reqs or create it in migration manually?
            // User asked for "Send code", showing it here works.
            localStorage.setItem('newsletter_dismissed', 'true');

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage('Error al suscribirse. Inténtalo de nuevo.');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Popup */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col">
                    {/* Image Side (or Top) */}
                    <div className="h-32 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center p-6 text-white text-center">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">¡Consigue un 10% OFF!</h3>
                            <p className="text-white/80 text-sm">Suscríbete a nuestra newsletter</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {status === 'success' ? (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">¡Suscripción Exitosa!</h4>
                                <p className="text-gray-600 mb-4">{message}</p>
                                <div className="bg-gray-100 p-3 rounded-lg border border-dashed border-gray-300 font-mono text-lg font-bold text-gray-800 tracking-wider">
                                    WELCOME10
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="mt-6 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Ir a la Tienda
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <p className="text-gray-600 text-center mb-2">
                                    Recibe las últimas tendencias y ofertas exclusivas directamente en tu email.
                                </p>

                                <div>
                                    <label htmlFor="email" className="sr-only">Email</label>
                                    <input
                                        type="email"
                                        id="popup-newsletter-email"
                                        placeholder="tucorreo@ejemplo.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all"
                                    />
                                </div>

                                {status === 'error' && (
                                    <p className="text-red-500 text-sm text-center">{message}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-transform active:scale-95 disabled:opacity-70"
                                >
                                    {status === 'loading' ? 'Suscribiendo...' : 'Suscribirme Ahora'}
                                </button>

                                <p className="text-xs text-center text-gray-400 mt-4">
                                    Al suscribirte aceptas nuestra política de privacidad. Puedes cancelar cuando quieras.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
