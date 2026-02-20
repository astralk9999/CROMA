import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, updateQuantity, removeFromCart } from '@stores/cart';
import { appliedCoupon } from '@stores/coupon';
import { formatPrice } from '@lib/utils';
import { useEffect, useState } from 'react';

interface Coupon {
    valid: boolean;
    type: 'percentage' | 'fixed';
    value: number;
    code: string;
}

export default function CartSummary() {
    const items = useStore(cartItems);
    const total = useStore(cartTotal);
    const coupon = useStore(appliedCoupon);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const itemsEntries = Object.entries(items);

    // Calculate Discount
    let discountAmount = 0;
    if (coupon && coupon.valid) {
        if (coupon.type === 'percentage') {
            discountAmount = total * (coupon.value / 100);
        } else {
            discountAmount = coupon.value;
        }
    }
    const finalTotal = Math.max(0, total - discountAmount);

    if (!mounted) {
        return (
            <div className="text-gray-500 text-center py-4 space-y-2">
                <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
                <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
            </div>
        );
    }

    if (itemsEntries.length === 0) {
        return <p className="text-center py-4 text-gray-500">Tu carrito está vacío.</p>;
    }

    return (
        <>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {itemsEntries.map(([key, item]: [string, any]) => (
                    <div key={key} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors rounded-lg p-1">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-20 object-cover rounded shadow-sm bg-gray-100"
                        />
                        <div className="flex-1">
                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Talla: {item.size}</p>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(key, item.quantity - 1, item.maxStock || 99)}
                                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:border-black hover:text-black transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => updateQuantity(key, item.quantity + 1, item.maxStock || 99)}
                                        disabled={item.quantity >= (item.maxStock || 99)}
                                        className={`w-6 h-6 flex items-center justify-center border rounded transition-colors ${item.quantity >= (item.maxStock || 99) ? 'border-gray-100 text-gray-200 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'}`}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-black">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t-2 border-black mt-6 pt-4 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500 italic">SUBTOTAL</span>
                    <span className="font-black">{formatPrice(total)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm font-black text-red-600 animate-in fade-in slide-in-from-right-4 duration-300">
                        <span className="flex items-center gap-1 italic">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.707 9.293l-5-5a.997.997 0 00-1.414 0l-5 5A.999.999 0 007 11h1v1c0 2.761 2.239 5 5 5s5-2.239 5-5v-1h1a.999.999 0 00.707-1.707z"></path></svg>
                            DESCUENTO ({coupon?.code})
                        </span>
                        <span className="flex items-center gap-2">
                            -{formatPrice(discountAmount)}
                            <button
                                onClick={() => appliedCoupon.set(null)}
                                className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors text-xs font-bold"
                                title="Quitar cupón"
                            >
                                ×
                            </button>
                        </span>
                    </div>
                )}

                <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500 italic">ENVÍO</span>
                    <span className="font-black text-gray-900 underline decoration-black/10">GRATIS</span>
                </div>

                <div className="flex justify-between text-2xl font-black border-t-4 border-black pt-4 mt-2">
                    <span className="tracking-tighter">TOTAL</span>
                    <span className="tracking-tighter">{formatPrice(finalTotal)}</span>
                </div>
            </div>
        </>
    );
}
