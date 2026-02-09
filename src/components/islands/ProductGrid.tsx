import { useState, useEffect, useMemo } from 'react';
import FavoriteButton from './FavoriteButton';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
    colors?: string[];
    stock_by_sizes?: Record<string, number>;
    discount_active?: boolean;
    discount_percent?: number;
    sale_price?: number;
    is_viral_trend?: boolean;
    is_limited_drop?: boolean;
    is_bestseller?: boolean;
}

interface Color {
    id: string;
    name: string;
    slug: string;
    hex_code: string;
}

interface ProductGridProps {
    products: Product[];
    categoryName?: string;
    description?: string;
    isFavoritesPage?: boolean;
    availableColors?: Color[];
}

const MESSAGES = [
    'Curando tu estilo...',
    'Sincronizando la colección...',
    'Preparando lo último de CROMA...',
    'Ajustando los detalles...',
    'Trayendo la tendencia...',
    'Desplegando moda urbana...',
    'Cargando piezas exclusivas...',
    'Conectando con el Streetwear...',
    'Escaneando el hype...',
    'Desbloqueando el próximo drop...',
    'Sintonizando la cultura urban...',
    'Preparando la cápsula CROMA...',
    'Tejiendo el futuro del estilo...',
    'Definiendo tu estética...',
    'Buscando inspiración en las calles...',
    'Filtros de estilo activados...',
    'La ciudad es tu pasarela...',
    'Elevando tu outfit...',
    'Moda con actitud y propósito...',
    'Cargando el outfit perfecto...'
];

export default function ProductGrid({
    products,
    categoryName = 'COLLECTION',
    description,
    isFavoritesPage = false,
    availableColors = []
}: ProductGridProps) {
    const safeProducts = products ?? [];

    const [isMounted, setIsMounted] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(() =>
        MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
    );

    // Filter States
    const [sortOption, setSortOption] = useState('newest');
    const [maxPrice, setMaxPrice] = useState(500);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [hideOutOfStock, setHideOutOfStock] = useState(false);

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setLoadingMessage(prev => {
                let next;
                do {
                    next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
                } while (next === prev);
                return next;
            });
        }, 4000);

        const mountTimer = setTimeout(() => {
            setIsMounted(true);
            setTimeout(() => setShowContent(true), 50);
        }, 200);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(mountTimer);
        };
    }, []);

    // Extract unique sizes from products for the filter UI
    const allAvailableSizes = useMemo(() => {
        const sizes = new Set<string>();
        safeProducts.forEach(p => {
            if (p.stock_by_sizes) {
                Object.keys(p.stock_by_sizes).forEach(size => sizes.add(size));
            }
        });
        // Sort sizes: XS, S, M, L, XL, etc then numbers
        const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];
        return Array.from(sizes).sort((a, b) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b, undefined, { numeric: true });
        });
    }, [safeProducts]);

    // Filtering & Sorting Logic
    const filteredProducts = useMemo(() => {
        let result = [...safeProducts];

        // Stock Filter
        if (hideOutOfStock) {
            result = result.filter(p => p.stock > 0);
        }

        // Price Filter
        result = result.filter(p => {
            const finalPrice = p.discount_active
                ? p.price * (1 - (p.discount_percent || 0) / 100)
                : (p.sale_price || p.price);
            return finalPrice <= maxPrice;
        });

        // Color Filter
        if (selectedColors.length > 0) {
            result = result.filter(p =>
                p.colors && p.colors.some(c => selectedColors.includes(c))
            );
        }

        // Size Filter
        if (selectedSizes.length > 0) {
            result = result.filter(p => {
                if (!p.stock_by_sizes) return false;
                return selectedSizes.some(size => (p.stock_by_sizes?.[size] || 0) > 0);
            });
        }

        // Sorting
        switch (sortOption) {
            case 'price-low':
                result.sort((a, b) => {
                    const priceA = a.discount_active ? a.price * (1 - (a.discount_percent || 0) / 100) : (a.sale_price || a.price);
                    const priceB = b.discount_active ? b.price * (1 - (b.discount_percent || 0) / 100) : (b.sale_price || b.price);
                    return priceA - priceB;
                });
                break;
            case 'price-high':
                result.sort((a, b) => {
                    const priceA = a.discount_active ? a.price * (1 - (a.discount_percent || 0) / 100) : (a.sale_price || a.price);
                    const priceB = b.discount_active ? b.price * (1 - (b.discount_percent || 0) / 100) : (b.sale_price || b.price);
                    return priceB - priceA;
                });
                break;
            case 'newest':
            default:
                break;
        }

        return result;
    }, [safeProducts, sortOption, maxPrice, selectedColors, selectedSizes, hideOutOfStock]);

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(price);
    };

    const toggleColor = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const resetFilters = () => {
        setSelectedColors([]);
        setSelectedSizes([]);
        setMaxPrice(500);
        setHideOutOfStock(false);
    };

    return (
        <div className="relative min-h-[400px]">
            {/* Header with Filter Toggle */}
            <div className="mb-8 pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-urban font-bold text-gray-900 mb-2 uppercase">{categoryName}</h1>
                    {description && <p className="text-gray-600">{description}</p>}
                </div>

                {!isFavoritesPage && (
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`group px-5 py-2.5 border border-black/10 rounded-full font-bold uppercase tracking-[0.15em] text-[10px] transition-all flex items-center gap-3 ${isFilterOpen ? 'bg-black text-white border-black' : 'bg-white text-black hover:border-black/30 shadow-sm hover:shadow-md'}`}
                    >
                        <span className="opacity-80">FILTER</span>
                        <div className={`flex flex-col gap-0.5 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                            <div className={`h-[1px] w-3 bg-current transition-all ${isFilterOpen ? 'translate-y-1 rotate-45' : ''}`}></div>
                            {!isFilterOpen && <div className="h-[1px] w-2 bg-current ml-auto"></div>}
                            <div className={`h-[1px] w-3 bg-current transition-all ${isFilterOpen ? '-translate-y-px -rotate-45' : ''}`}></div>
                        </div>
                    </button>
                )}
            </div>

            {/* Filter Panel */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-white border-b border-gray-100 mb-12 ${isFilterOpen ? 'max-h-[1600px] opacity-100 py-10' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-4 md:divide-x md:divide-gray-100 gap-y-12 md:gap-x-0">
                    {/* Sort & Availability */}
                    <div className="space-y-10 pb-10 border-b border-gray-100 md:border-b-0 md:pb-0 md:pr-10">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                SORT BY
                            </h4>
                            <div className="flex flex-col gap-4">
                                {[
                                    { id: 'newest', label: 'MOST RECENT' },
                                    { id: 'price-low', label: 'PRICE: LOW TO HIGH' },
                                    { id: 'price-high', label: 'PRICE: HIGH TO LOW' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSortOption(opt.id)}
                                        className={`text-left text-[11px] font-bold uppercase tracking-widest transition-all ${sortOption === opt.id ? 'text-black translate-x-1' : 'text-gray-400 hover:text-gray-600 hover:translate-x-1'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                AVAILABILITY
                            </h4>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative w-10 h-5 bg-gray-100 rounded-full transition-colors group-hover:bg-gray-200">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={hideOutOfStock}
                                        onChange={() => setHideOutOfStock(!hideOutOfStock)}
                                    />
                                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-all ${hideOutOfStock ? 'translate-x-5 bg-black' : 'bg-gray-400'}`}></div>
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">In Stock Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Size Selector */}
                    <div className="md:col-span-1 px-0 md:px-10 border-b border-gray-100 pb-10 md:border-b-0 md:pb-0">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                            SIZES
                        </h4>
                        <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
                            {allAvailableSizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => toggleSize(size)}
                                    className={`py-2 text-[10px] font-bold border transition-all ${selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price range */}
                    <div className="md:col-span-1 px-0 md:px-10 border-b border-gray-100 pb-10 md:border-b-0 md:pb-0">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                            PRICE RANGE
                        </h4>
                        <div className="relative pt-2">
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                className="w-full h-0.5 bg-gray-100 appearance-none cursor-pointer accent-black hover:accent-gray-800 transition-all"
                            />
                            <div className="flex justify-between mt-4">
                                <span className="text-[10px] font-bold text-gray-400 font-mono">0.00€</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-black text-black tracking-tighter condensed">{maxPrice}.00€</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="pl-0 md:pl-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                            COLORS
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {availableColors.map(color => (
                                <button
                                    key={color.id}
                                    onClick={() => toggleColor(color.name)}
                                    title={color.name}
                                    className={`w-5 h-5 rounded-full transition-all ring-offset-2 ${selectedColors.includes(color.name) ? 'ring-2 ring-black scale-110' : 'hover:scale-110 ring-1 ring-gray-100'}`}
                                    style={{ backgroundColor: color.hex_code }}
                                />
                            ))}
                        </div>
                        {(selectedColors.length > 0 || selectedSizes.length > 0 || hideOutOfStock || maxPrice < 500) && (
                            <button
                                onClick={resetFilters}
                                className="mt-8 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1 group"
                            >
                                <span className="text-lg leading-none group-hover:rotate-90 transition-transform">×</span>
                                RESET FILTERS
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ease-in-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                <div className="sticky top-[40vh] flex flex-col items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-black rounded-full animate-spin border-t-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center p-3">
                                <img src="/brand/logo_c_horns.png" alt="" className="w-full h-auto object-contain" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">CROMA</span>
                            <span key={loadingMessage} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                {loadingMessage}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Real Content */}
            {isMounted && (
                <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {filteredProducts.map((product: any) => {
                        const hasDiscount = (product.discount_active && product.discount_percent) || (product.sale_price && product.sale_price < product.price);
                        const finalPrice = product.discount_active
                            ? product.price * (1 - (product.discount_percent || 0) / 100)
                            : (product.sale_price || product.price);

                        const discountPercent = product.discount_active
                            ? product.discount_percent
                            : Math.round((1 - (product.sale_price || 0) / product.price) * 100);

                        return (
                            <div key={product.id} className="group relative">
                                <div className="relative overflow-hidden bg-gray-100">
                                    <a
                                        href={`/productos/${product.slug}`}
                                        className="block aspect-[3/4]"
                                    >
                                        <img
                                            src={product.images?.[0] || '/placeholder.jpg'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </a>
                                    {product.stock > 0 && !hasDiscount && (
                                        <div className="absolute bottom-2 left-2 pointer-events-none bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                            New In
                                        </div>
                                    )}
                                    <FavoriteButton productId={product.id} />
                                </div>
                                <a
                                    href={`/productos/${product.slug}`}
                                    className="block pt-3"
                                >
                                    <h3 className="text-sm font-normal text-gray-600 mb-1 leading-tight group-hover:text-black transition-colors line-clamp-1">
                                        {product.name}
                                    </h3>

                                    <div className="mt-2 flex flex-col items-start gap-1">
                                        {hasDiscount ? (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-normal text-zinc-400 line-through decoration-zinc-400">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                    <span className="text-sm font-bold text-red-600">
                                                        {formatPrice(finalPrice)}
                                                    </span>
                                                </div>
                                                <div className="bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider inline-block transform -skew-x-6">
                                                    {discountPercent}% OFF
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold text-black">
                                                {formatPrice(product.price)}
                                            </p>
                                        )}
                                    </div>
                                </a>
                            </div>
                        )
                    })}
                </div>
            )}

            {filteredProducts.length === 0 && showContent && (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">NO_RESULTS_FOUND_FOR_CRITERIA</p>
                </div>
            )}
        </div>
    );
}
