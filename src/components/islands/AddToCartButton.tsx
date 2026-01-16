import { useState, useEffect } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);
  const count = useStore(cartCount);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  // Get available sizes from stockBySizes, product.sizes, or default fallback
  const availableSizes = (product.stockBySizes && Object.keys(product.stockBySizes).length > 0)
    ? Object.keys(product.stockBySizes)
    : (product.sizes && product.sizes.length > 0)
      ? product.sizes
      : [];

  // Check for One Size ('TU')
  const isOneSize = availableSizes.length === 1 && availableSizes[0] === 'TU';

  useEffect(() => {
    setIsMounted(true);
    // Auto-select if One Size
    if (isOneSize) {
      setSelectedSize('TU');
    }
  }, [product]);

  // Get stock for selected size
  const getStockForSize = (size: string): number => {
    // STRICT MODE: Only trust explicit size stock
    if (product.stockBySizes && product.stockBySizes[size] !== undefined) {
      return product.stockBySizes[size];
    }

    // If we have stockBySizes data but this size isn't in it -> 0
    if (product.stockBySizes && Object.keys(product.stockBySizes).length > 0) {
      return 0;
    }

    // LEGACY: Assume 0 if strict mode is on.
    return 0;
  };

  const selectedSizeStock = selectedSize ? getStockForSize(selectedSize) : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Por favor, selecciona una talla');
      return;
    }

    if (selectedSizeStock <= 0) {
      alert('Este producto está agotado');
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
    }, selectedSizeStock);

    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Size Selector (Hidden if One Size) */}
      {!isOneSize && availableSizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-2">
            Talla
          </label>
          <div className="flex flex-wrap gap-2 min-h-[46px]">
            {!isMounted ? (
              // Skeleton for sizes
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-11 bg-gray-100 animate-pulse border-2 border-transparent"></div>
              ))
            ) : (
              availableSizes.map((size) => {
                const sizeStock = getStockForSize(size);
                const isOutOfStock = sizeStock <= 0;

                return (
                  <button
                    key={size}
                    onClick={() => !isOutOfStock && setSelectedSize(size)}
                    disabled={isOutOfStock}
                    className={`
                    min-w-[64px] h-14 border-2 font-bold transition-all relative flex flex-col items-center justify-center
                    ${isOutOfStock
                        ? 'border-red-200 text-red-500 cursor-not-allowed bg-red-50'
                        : sizeStock <= 10
                          ? selectedSize === size
                            ? 'border-amber-500 bg-amber-500 text-white shadow-lg'
                            : 'border-amber-200 text-amber-700 hover:border-amber-500 bg-amber-50/30'
                          : selectedSize === size
                            ? 'border-black bg-black text-white shadow-lg'
                            : 'border-gray-300 text-gray-900 hover:border-black bg-white'
                      }
                  `}
                  >
                    <span className="text-sm uppercase tracking-tighter">{size}</span>
                    {!isOutOfStock && (
                      <span className={`text-[10px] mt-0.5 font-bold uppercase ${selectedSize === size ? 'text-white/80' : sizeStock <= 10 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {sizeStock} ud.
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-red-300 rotate-45"></span>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Warning for One Size Low Stock */}
      {isOneSize && selectedSizeStock > 0 && selectedSizeStock < 5 && (
        <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
          <p className="text-xs text-amber-950 font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse"></span>
            ¡Últimas {selectedSizeStock} unidades!
          </p>
        </div>
      )}

      {selectedSize && !isOneSize && selectedSizeStock > 0 && selectedSizeStock <= 10 && (
        <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg animate-in fade-in slide-in-from-top-1">
          <p className="text-xs text-amber-950 font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse"></span>
            ¡Casi agotado! Solo {selectedSizeStock} en {selectedSize}
          </p>
        </div>
      )}

      {/* Add to Cart Button */}
      {isNotYetAvailable ? (
        <button
          disabled
          className="w-full py-5 px-6 font-black uppercase tracking-[0.2em] text-white bg-gray-400 cursor-not-allowed"
        >
          🔒 Próximamente
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !selectedSize || selectedSizeStock <= 0}
          className={`
            w-full py-5 px-6 font-black uppercase tracking-[0.2em] text-white transition-all duration-300 shadow-xl
            ${!selectedSize || selectedSizeStock <= 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isAdding
                ? 'bg-green-600 text-white scale-95'
                : 'bg-black text-white hover:bg-gray-900 active:scale-95'
            }
          `}
        >
          {!selectedSize
            ? 'Selecciona tu talla'
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
