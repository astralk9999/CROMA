import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, isCartOpen, closeCart, updateQuantity, removeFromCart } from '@stores/cart';
import { formatPrice } from '@lib/utils';

export default function CartSlideOver() {
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const isOpen = useStore(isCartOpen);

  const itemsArray = Object.entries(items);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Slide Over Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-urban font-bold text-gray-900 uppercase tracking-wide">
              Carrito
            </h2>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Cerrar carrito"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {itemsArray.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                <button
                  onClick={closeCart}
                  className="text-black font-bold hover:underline uppercase tracking-wide"
                >
                  Continuar comprando
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {itemsArray.map(([key, item]) => (
                  <div key={key} className="flex gap-4 border-b border-gray-200 pb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-24 object-cover bg-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Talla: {item.size}</p>
                      <p className="text-sm font-bold text-black mt-1">
                        {formatPrice(item.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(key, item.quantity - 1, item.maxStock || 99)}
                          className="w-8 h-8 border-2 border-gray-300 hover:border-black hover:bg-gray-100 transition-colors font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(key, item.quantity + 1, item.maxStock || 99)}
                          disabled={item.quantity >= (item.maxStock || 99)}
                          className={`w-8 h-8 border-2 font-bold transition-colors ${item.quantity >= (item.maxStock || 99) ? 'border-gray-100 text-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-black hover:bg-gray-100'}`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(key)}
                          className="ml-auto text-sm text-red-600 hover:underline font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {itemsArray.length > 0 && (
            <div className="border-t-2 border-black p-6 space-y-4 bg-gray-50">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-700 uppercase tracking-wide">Total:</span>
                <span className="text-2xl font-black text-black">{formatPrice(total)}</span>
              </div>
              <a
                href="/checkout"
                onClick={closeCart}
                className="block w-full py-4 bg-black text-white font-black uppercase tracking-wider hover:bg-gray-800 transition-colors text-center"
              >
                Proceder al Pago
              </a>
              <button
                onClick={closeCart}
                className="w-full py-2 text-black font-bold hover:underline uppercase tracking-wide"
              >
                Continuar comprando
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

