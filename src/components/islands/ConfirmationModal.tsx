import { useState, useEffect } from 'react';

// Define the custom event detail type
interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    singleButton?: boolean; // If true, only show confirm button and don't close on backdrop click
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const handleOpen = (e: CustomEvent<ConfirmationOptions>) => {
            setOptions(e.detail);
            setIsOpen(true);
            // Small delay to trigger animation
            requestAnimationFrame(() => setIsAnimating(true));
        };

        window.addEventListener('open-confirm-modal' as any, handleOpen as any);

        return () => {
            window.removeEventListener('open-confirm-modal' as any, handleOpen as any);
        };
    }, []);

    const close = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsOpen(false);
            setOptions(null);
        }, 300); // Wait for transition
    };

    const handleConfirm = () => {
        if (options?.onConfirm) options.onConfirm();
        close();
    };

    const handleCancel = () => {
        if (options?.onCancel) options.onCancel();
        close();
    };

    if (!isOpen || !options) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={options.singleButton ? undefined : handleCancel}
            ></div>

            {/* Modal Card */}
            <div className={`relative bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>

                {/* Header Strip */}
                <div className={`h-1.5 w-full ${options.variant === 'danger' ? 'bg-red-600' : options.variant === 'warning' ? 'bg-amber-500' : 'bg-white'}`}></div>

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        {options.variant === 'danger' ? (
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        ) : (
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>

                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-3">
                        {options.title}
                    </h3>

                    <p className="text-zinc-400 text-sm font-medium mb-8 leading-relaxed">
                        {options.message}
                    </p>

                    <div className="flex gap-4">
                        {!options.singleButton && (
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-xs font-black text-white uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all"
                            >
                                {options.cancelText || 'Cancelar'}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg ${options.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' : options.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-900/20' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            {options.confirmText || 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Global helper to trigger the modal
export const confirmDialog = (title: string, message: string, variant: 'danger' | 'warning' | 'info' = 'info'): Promise<boolean> => {
    return new Promise((resolve) => {
        const event = new CustomEvent('open-confirm-modal', {
            detail: {
                title,
                message,
                variant,
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            }
        });
        window.dispatchEvent(event);
    });
};

/* 
Usage (Vanilla / Astro Script):
import { confirmDialog } from ... (if client side bundled) OR define global shim

If used in vanilla script tag without direct module access:
window.confirmDialog = ... (needs bridge in component)
Or simpler: dispatch event directly and wrap in promise function on window.
*/
