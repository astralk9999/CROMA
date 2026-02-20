import { useState, useEffect } from 'react';

// Define the custom event detail type
export interface PublicModalOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isError?: boolean;
    type?: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface PublicModalProps {
    defaultConfirmText?: string;
    defaultCancelText?: string;
}

export default function PublicModal({ defaultConfirmText = 'Aceptar', defaultCancelText = 'Cancelar' }: PublicModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<PublicModalOptions | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const handleOpen = (e: CustomEvent<PublicModalOptions>) => {
            setOptions(e.detail);
            setIsOpen(true);
            // Small delay to trigger animation
            requestAnimationFrame(() => setIsAnimating(true));
        };

        window.addEventListener('open-public-modal' as any, handleOpen as any);

        return () => {
            window.removeEventListener('open-public-modal' as any, handleOpen as any);
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

    const isConfirm = options.type === 'confirm';

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={isConfirm ? undefined : handleCancel}
            ></div>

            {/* Modal Card */}
            <div className={`relative bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>

                <div className="p-8 text-center flex flex-col items-center">

                    {/* Icon */}
                    <div className={`mb-6 w-16 h-16 rounded-full flex items-center justify-center ${options.isError ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-900'}`}>
                        {options.isError ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>

                    {options.title && (
                        <h3 className="text-xl font-black text-black uppercase tracking-widest mb-3">
                            {options.title}
                        </h3>
                    )}

                    <p className={`text-sm mb-8 leading-relaxed font-medium ${options.isError ? 'text-zinc-600' : 'text-zinc-500'}`}>
                        {options.message}
                    </p>

                    <div className="flex flex-col w-full gap-3 mt-auto">
                        <button
                            onClick={handleConfirm}
                            className={`w-full py-4 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${options.isError && isConfirm
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                : 'bg-black hover:bg-zinc-800 text-white shadow-black/10'
                                }`}
                        >
                            {options.confirmText || defaultConfirmText}
                        </button>

                        {isConfirm && (
                            <button
                                onClick={handleCancel}
                                className="w-full py-4 px-6 bg-white border border-zinc-200 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-black hover:bg-zinc-50 transition-all active:scale-95"
                            >
                                {options.cancelText || defaultCancelText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Global helpers to trigger the modal
export const webConfirm = (message: string, title?: string, confirmText?: string, cancelText?: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const event = new CustomEvent('open-public-modal', {
            detail: {
                type: 'confirm',
                title,
                message,
                confirmText,
                cancelText,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            }
        });
        window.dispatchEvent(event);
    });
};

export const webAlert = (message: string, title?: string, isError: boolean = false): Promise<void> => {
    return new Promise((resolve) => {
        const event = new CustomEvent('open-public-modal', {
            detail: {
                type: 'alert',
                title,
                message,
                isError,
                onConfirm: () => resolve(),
                onCancel: () => resolve() // Alert resolves on backdop click too
            }
        });
        window.dispatchEvent(event);
    });
};

// Expose to window for plain Astro scripts
if (typeof window !== 'undefined') {
    (window as any).webConfirm = webConfirm;
    (window as any).webAlert = webAlert;
}
