import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { addToCart, cartCount } from '@stores/cart';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    sizes?: string[];
    stock: number;
    stockBySizes?: Record<string, number>;
  };
  isNotYetAvailable?: boolean;
}

export default function AddToCartButton({ product, isNotYetAvailable = false }: AddToCartButtonProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const count = useStore(cartCount);

  // Get available sizes from stockBySizes or fallback to sizes array
  const availableSizes = product.stockBySizes
    ? Object.keys(product.stockBySizes)
    : (product.sizes || []);

  // Get stock for selected size
  const getStockForSize = (size: string): number => {
    if (product.stockBySizes) {
      return product.stockBySizes[size] || 0;
    }
    return product.stock;
  };

  const selectedSizeStock = selectedSize ? getStockForSize(selectedSize) : product.stock;

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Por favor, selecciona una talla');
      return;
    }

    if (selectedSizeStock <= 0) {
      alert('Esta talla está agotada');
      return;
    }

    setIsAdding(true);

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      size: selectedSize,
      image: product.image,
    });

    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Size Selector */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-2">
          Talla
        </label>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const sizeStock = getStockForSize(size);
            const isOutOfStock = sizeStock <= 0;

            return (
              <button
                key={size}
                onClick={() => !isOutOfStock && setSelectedSize(size)}
                disabled={isOutOfStock}
                className={`
                  px-4 py-2 border-2 font-medium transition-all relative
                  ${isOutOfStock
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100'
                    : selectedSize === size
                      ? 'border-navy-800 bg-navy-800 text-white'
                      : 'border-charcoal-300 text-charcoal-700 hover:border-navy-600'
                  }
                `}
                title={isOutOfStock ? 'Agotado' : `${sizeStock} disponibles`}
              >
                {size}
                {isOutOfStock && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-full h-0.5 bg-gray-400 rotate-45"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedSize && selectedSizeStock > 0 && selectedSizeStock <= 5 && (
          <p className="text-sm text-gold-600 font-medium mt-2">
            Solo quedan {selectedSizeStock} unidades en talla {selectedSize}
          </p>
        )}
      </div>

      {/* Add to Cart Button */}
      {isNotYetAvailable ? (
        <button
          disabled
          className="w-full py-4 px-6 font-semibold text-white bg-gray-400 cursor-not-allowed"
        >
          🔒 Próximamente
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !selectedSize || selectedSizeStock <= 0}
          className={`
            w-full py-4 px-6 font-semibold text-white transition-all
            ${!selectedSize || selectedSizeStock <= 0
              ? 'bg-charcoal-400 cursor-not-allowed'
              : isAdding
                ? 'bg-gold-600 scale-95'
                : 'bg-navy-800 hover:bg-navy-900'
            }
          `}
        >
          {!selectedSize
            ? 'Selecciona una talla'
            : selectedSizeStock <= 0
              ? 'Agotado'
              : isAdding
                ? '¡Añadido!'
                : 'Añadir al Carrito'
          }
        </button>
      )}
    </div>
  );
}
