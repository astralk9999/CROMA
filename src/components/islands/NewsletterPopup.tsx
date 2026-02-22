import React, { useState, useEffect } from 'react';

interface NewsletterPopupProps {
    labels?: {
        offer: string;
        subtitle: string;
        successTitle: string;
        successMsg: string;
        alreadySub: string;
        error: string;
        cta: string;
        subscribing: string;
        shopNow: string;
        privacyMsg: string;
        bodyText: string;
        placeholder: string;
    };
}

export default function NewsletterPopup({ labels }: NewsletterPopupProps) {
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
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al suscribirse');
            }

            setStatus('success');
            // Show the actual message returned by the server
            setMessage(data.message || 'Código enviado a tu bandeja de entrada.');
            localStorage.setItem('newsletter_dismissed', 'true');

        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(labels?.error || err.message || 'Error al suscribirse. Inténtalo de nuevo.');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Popup */}
            <div className="relative bg-white border-[3px] border-black w-full max-w-md shadow-[8px_8px_0_0_#000] transform transition-all animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-black hover:text-brand-red transition-colors z-10 bg-white border border-black p-1 shadow-[2px_2px_0_0_#000]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col">
                    {/* Header Side */}
                    <div className="bg-black border-b-[3px] border-black flex flex-col items-center justify-center p-8 text-white text-center italic relative overflow-hidden">
                        {/* Decorative stripes */}
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)]"></div>

                        <div className="relative z-10 w-full">
                            <h3 className="text-3xl md:text-4xl font-urban font-black uppercase tracking-tighter mb-1 select-none">{labels?.offer || '10%_OFF'}</h3>
                            <p className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">{labels?.subtitle || 'Únete al culto'}</p>
                        </div>
                    </div>

                    <div className="p-8 bg-zinc-50 relative">
                        {status === 'success' ? (
                            <div className="text-center py-4">
                                <h4 className="text-2xl font-urban font-black text-black uppercase tracking-tighter mb-2 italic">{labels?.successTitle || 'Suscripción OK'}</h4>
                                <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-6">{message}</p>
                                <div className="bg-white px-2 py-4 border-[3px] border-black shadow-[4px_4px_0_0_#000] font-mono text-[10px] font-black tracking-widest mb-8">
                                    REVISA TU EMAIL
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-full bg-black text-white font-mono font-bold uppercase tracking-widest text-xs py-4 border-2 border-black hover:bg-brand-red hover:border-brand-red transition-all active:scale-95 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                                >
                                    {labels?.shopNow || 'Entrar_'}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <p className="text-zinc-500 font-mono text-xs text-center uppercase tracking-wider mb-2 leading-relaxed">
                                    {labels?.bodyText || 'Acceso anticipado a drops. Sin spam, solo ruido del bueno.'}
                                </p>

                                <div>
                                    <label htmlFor="popup-newsletter-email" className="sr-only">Email</label>
                                    <input
                                        type="email"
                                        id="popup-newsletter-email"
                                        placeholder={labels?.placeholder || 'EMAIL // INFO@...'}
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-4 border-[3px] border-black bg-white rounded-none font-mono text-sm text-black placeholder-zinc-400 focus:outline-none focus:border-brand-red focus:shadow-[4px_4px_0_0_#000] transition-all"
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="bg-red-100 border-2 border-brand-red p-2 shadow-[2px_2px_0_0_#dc2626]">
                                        <p className="text-brand-red font-mono font-bold text-[10px] uppercase tracking-widest text-center">{message}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full flex items-center justify-center p-0 bg-transparent border-0 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <div className="w-full bg-black text-white py-4 font-mono font-black uppercase tracking-widest hover:bg-brand-red transition-colors border-[3px] border-black shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 relative">
                                        <span className="flex items-center justify-center gap-2">
                                            {status === 'loading' ? (labels?.subscribing || 'PROCESANDO...') : (labels?.cta || 'INICIAR_SEC_')}
                                            {status !== 'loading' && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                                        </span>
                                    </div>
                                </button>

                                <p className="text-[9px] text-center font-mono text-zinc-400 uppercase tracking-widest mt-4">
                                    {labels?.privacyMsg || 'Aceptas la política de privacidad. Opt-out cuando quieras.'}
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

