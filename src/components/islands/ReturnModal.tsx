import React, { useState, useRef, useEffect } from 'react';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export default function ReturnModal({ isOpen, onClose, orderId }: ReturnModalProps) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New item selection state
    const [items, setItems] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);

    // Fetch items when modal opens
    useEffect(() => {
        if (isOpen && orderId) {
            setLoadingItems(true);
            setItems([]);
            setSelectedItems([]);

            fetch(`/api/orders/returnable-items?orderId=${orderId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setItems(data.items);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingItems(false));
        }
    }, [isOpen, orderId]);

    const toggleItem = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImages(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadToCloudinary = async (files: File[]) => {
        const cloudName = (import.meta as any).env.PUBLIC_CLOUDINARY_CLOUD_NAME;
        const preset = (import.meta as any).env.PUBLIC_CLOUDINARY_PRESET || 'croma_uploads';
        const urls: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);
            formData.append('upload_preset', preset);
            formData.append('folder', 'croma/returns');

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Error al subir imágenes');
            const data = await res.json();
            urls.push(data.secure_url);
            setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }
        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedItems.length === 0) {
            (window as any).showIndustrialAlert('DEBE SELECCIONAR AL MENOS UN ARTÍCULO', 'error');
            return;
        }

        if (!reason) {
            (window as any).showIndustrialAlert('POR FAVOR, SELECCIONA UN MOTIVO', 'error');
            return;
        }

        setLoading(true);
        try {
            const imageUrls = await uploadToCloudinary(images);

            const response = await fetch('/api/returns/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    items: selectedItems,
                    reason,
                    details,
                    images: imageUrls
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || 'Error al procesar la solicitud');

            (window as any).showIndustrialAlert('SOLICITUD DE DEVOLUCIÓN ENVIADA. EL PROTOCOLO HA SIDO ACTIVADO.', 'success');
            onClose();
            // Wait for toast to be visible before reloading
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        } catch (err: any) {
            console.error(err);
            (window as any).showIndustrialAlert('ERROR EN EL PROTOCOLO: ' + err.message, 'error');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] border border-zinc-300 shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-zinc-900 p-10 text-white relative overflow-hidden flex-shrink-0 border-b border-zinc-800">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <svg className="w-40 h-40 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-0.5 bg-zinc-600"></div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-500">
                                PROTOCOL_SYSTEM.v4
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-urban font-black uppercase italic tracking-tighter leading-[0.8]">
                            SOLICITUD DE <span className="text-zinc-500">DEVOLUCIÓN</span>
                        </h2>
                        <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.4em] font-mono italic">NODE_SERIAL: #{orderId.slice(0, 16).toUpperCase()}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-10 overflow-y-auto custom-scrollbar bg-zinc-50">
                    <div className="space-y-10">

                        {/* ITEM SELECTION */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.3em] block flex items-center gap-3">
                                <span className="w-4 h-4 bg-zinc-900 rounded-sm"></span>
                                SELECCIONAR_ITEMS_RECLAMADOS ({selectedItems.length})
                            </label>
                            {loadingItems ? (
                                <div className="p-12 text-center bg-white border border-zinc-300 border-dashed rounded-3xl animate-pulse">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.5em]">ANALIZANDO_INVENTARIO_LOCAL...</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => !item.is_returned && toggleItem(item.id)}
                                            className={`
                                                    relative flex items-center gap-6 p-6 border transition-all duration-300 rounded-2xl
                                                    ${item.is_returned
                                                    ? 'bg-zinc-100 border-zinc-200 opacity-30 cursor-not-allowed grayscale'
                                                    : selectedItems.includes(item.id)
                                                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl scale-[1.01] z-10'
                                                        : 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-lg'
                                                }
                                                `}
                                        >
                                            <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                                                <img src={item.product_image} className="w-full h-full object-cover grayscale" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className={`text-lg font-urban font-black uppercase italic tracking-tighter truncate ${selectedItems.includes(item.id) ? 'text-white' : 'text-zinc-900'}`}>
                                                    {item.product_name}
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedItems.includes(item.id) ? 'text-zinc-500' : 'text-zinc-400'}`}>TALLA_{item.size}</span>
                                                    {item.is_returned && <span className="text-[9px] font-bold uppercase tracking-widest text-red-500 underline">YA_RETORNADO</span>}
                                                </div>
                                            </div>
                                            {!item.is_returned && (
                                                <div className={`w-8 h-8 flex items-center justify-center border transition-colors rounded-lg ${selectedItems.includes(item.id) ? 'bg-white border-white text-zinc-900' : 'border-zinc-200 bg-zinc-50'
                                                    }`}>
                                                    {selectedItems.includes(item.id) && (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.3em] block flex items-center gap-3">
                                <span className="w-4 h-4 bg-zinc-900 rounded-sm"></span>
                                MOTIVO_DISCREPANCIA
                            </label>
                            <select
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white border border-zinc-300 rounded-2xl px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all appearance-none cursor-pointer italic shadow-lg shadow-zinc-200/50 text-zinc-900"
                            >
                                <option value="">--- SELECCIONAR_MOTIVO ---</option>
                                <option value="Talla Incorrecta">TALLA_INCORRECTA</option>
                                <option value="Producto Dañado">DEFECTO_ESTRUCTURAL</option>
                                <option value="No es como se describe">ERROR_DESCRIPCIÓN_VISUAL</option>
                                <option value="Cambio de opinión">CAMBIO_CRITERIO_ADQUISICIÓN</option>
                                <option value="Otros">OTROS_PROTOCOLO</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.3em] block flex items-center gap-3">
                                <span className="w-4 h-4 bg-zinc-900 rounded-sm"></span>
                                DETALLES_AUDITORÍA
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={3}
                                placeholder="PROPORCIONE REGISTRO DETALLADO DEL INCIDENTE..."
                                className="w-full bg-white border border-zinc-300 rounded-2xl px-8 py-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-zinc-900/5 placeholder:text-zinc-300 placeholder:italic shadow-lg shadow-zinc-200/50 text-zinc-900"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.3em] block flex items-center gap-3">
                                <span className="w-4 h-4 bg-zinc-900 rounded-sm"></span>
                                EVIDENCIA_ADJUNTA
                            </label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative border border-dashed border-zinc-300 bg-white rounded-[2rem] p-12 text-center cursor-pointer hover:border-zinc-500 hover:bg-zinc-100/50 transition-all duration-500"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-zinc-900 group-hover:text-white transition-all duration-500">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 group-hover:text-zinc-900 transition-colors">UPLOAD_VISUAL_LOGS</p>
                                    <p className="text-[9px] font-bold text-zinc-400 italic">MAX_FILES: 05 / TYPE: RAW_IMG</p>
                                </div>
                            </div>

                            {previews.length > 0 && (
                                <div className="grid grid-cols-5 gap-4">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative group aspect-square border border-zinc-200 rounded-xl bg-white overflow-hidden p-1">
                                            <img src={src} className="w-full h-full object-cover rounded-lg grayscale group-hover:grayscale-0 transition-all cursor-zoom-in" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                                className="absolute top-1 right-1 bg-zinc-900 text-white w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div className="space-y-4">
                            <div className="h-2 bg-zinc-100 rounded-full relative overflow-hidden">
                                <div
                                    className="h-full bg-zinc-900 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.5em] text-center italic animate-pulse">SYNCHRONIZING_WITH_CLOUD_HUB...</p>
                        </div>
                    )}

                    <div className="flex items-center gap-8 pt-12 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-[11px] font-bold uppercase tracking-[0.4em] text-zinc-400 hover:text-red-500 transition-all font-mono italic"
                        >
                            [ ABORT_PROCESS ]
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedItems.length === 0}
                            className="flex-1 bg-zinc-900 text-white py-6 text-[12px] font-black uppercase tracking-[0.5em] hover:bg-black transition-all shadow-xl shadow-zinc-900/20 rounded-full active:scale-95 disabled:opacity-30 disabled:grayscale relative overflow-hidden group"
                        >
                            <span className="relative z-10">{loading ? 'STABILIZING...' : 'INICIAR_DEVOLUCIÓN'}</span>
                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
