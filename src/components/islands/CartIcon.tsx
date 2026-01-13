import { useStore } from '@nanostores/react';
import { cartCount, toggleCart } from '@stores/cart';

export default function CartIcon() {
  const count = useStore(cartCount);

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 hover:bg-cream-300 transition-colors rounded-lg group"
      aria-label="Abrir carrito"
    >
      <svg
        className="w-6 h-6 text-charcoal-800 group-hover:text-navy-800 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
