import { useState } from 'react';

export default function SizeRecommender() {
    const [isOpen, setIsOpen] = useState(false);
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const calculateSize = (e: React.FormEvent) => {
        e.preventDefault();
        const w = parseInt(weight);
        const h = parseInt(height);

        if (isNaN(w) || isNaN(h)) return;

        // Base Croma algorithmic logic for sizing
        let recommended = 'L';
        if (w < 70 && h < 175) recommended = 'S';
        else if (w < 75 && h < 180) recommended = 'M';
        else if (w >= 90 || h >= 190) recommended = 'XL';
        else if (w >= 80 || h >= 180) recommended = 'L';
        else recommended = 'M'; // default middle ground for average builds

        setResult(`SYS.RECOMENDACIÓN // TALLA ${recommended}`);
    };

    return (
        <div>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                type="button"
                className="flex items-center gap-1.5 text-[9px] font-mono font-black border-b border-black/30 uppercase tracking-[0.2em] text-zinc-500 hover:text-black hover:border-black transition-all pb-0.5"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                ¿Cuál es mi talla?
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

                    {/* Modal Body */}
                    <div className="relative bg-white border-[3px] border-black w-full max-w-sm p-8 shadow-[8px_8px_0_0_#000] animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-black hover:text-brand-red transition-colors bg-white border border-black p-1 shadow-[2px_2px_0_0_#000]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h3 className="text-2xl font-urban font-black uppercase tracking-tighter mb-1 italic">Calculadora</h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-6">Algoritmo de ajuste</p>

                        <form onSubmit={calculateSize} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-mono font-black text-black uppercase tracking-widest mb-2">Altura (cm)</label>
                                    <input
                                        type="number"
                                        required
                                        min="100"
                                        max="250"
                                        value={height}
                                        onChange={e => setHeight(e.target.value)}
                                        className="w-full border-2 border-black bg-zinc-50 p-3 font-mono text-sm text-center focus:outline-none focus:border-brand-red focus:shadow-[4px_4px_0_0_#000] transition-all placeholder:text-zinc-300"
                                        placeholder="175"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-mono font-black text-black uppercase tracking-widest mb-2">Peso (kg)</label>
                                    <input
                                        type="number"
                                        required
                                        min="30"
                                        max="200"
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        className="w-full border-2 border-black bg-zinc-50 p-3 font-mono text-sm text-center focus:outline-none focus:border-brand-red focus:shadow-[4px_4px_0_0_#000] transition-all placeholder:text-zinc-300"
                                        placeholder="70"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-black text-white font-mono font-bold uppercase tracking-widest text-xs py-4 border-2 border-black hover:bg-brand-red hover:border-brand-red transition-all active:scale-95 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                            >
                                Analizar_
                            </button>
                        </form>

                        {result && (
                            <div className="mt-6 p-4 bg-brand-red border-[3px] border-black text-center animate-in slide-in-from-top-2 shadow-[4px_4px_0_0_#000]">
                                <p className="font-mono font-black text-[11px] uppercase tracking-widest text-white">{result}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
