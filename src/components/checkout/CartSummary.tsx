import { useStore } from '@nanostores/react';
import { cartItems, cartTotal } from '@stores/cart';
import { formatPrice } from '@lib/utils';
import { useEffect, useState } from 'react';

export default function CartSummary() {
    const items = useStore(cartItems);
    const total = useStore(cartTotal);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const itemsArray = Object.values(items);

    if (!mounted) {
        return (
            <div className="text-gray-500 text-center py-4 space-y-2">
                <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
                <div className="animate-pulse bg-gray-200 h-16 w-full rounded"></div>
            </div>
        );
    }

    if (itemsArray.length === 0) {
        return <p className="text-center py-4 text-gray-500">Tu carrito está vacío.</p>;
    }

    return (
        <>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {itemsArray.map((item: any) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-20 object-cover rounded bg-gray-100"
                        />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-500">Talla: {item.size} | Qty: {item.quantity}</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="font-medium text-green-600">Gratis</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>
        </>
    );
}
