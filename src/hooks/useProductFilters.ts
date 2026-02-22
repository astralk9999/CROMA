import { useState, useMemo } from 'react';

export interface Product {
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

export function useProductFilters(safeProducts: Product[]) {
    const [sortOption, setSortOption] = useState('newest');
    const [maxPrice, setMaxPrice] = useState(500);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [hideOutOfStock, setHideOutOfStock] = useState(false);

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

        if (hideOutOfStock) {
            result = result.filter(p => p.stock > 0);
        }

        result = result.filter(p => {
            const finalPrice = p.discount_active
                ? p.price * (1 - (p.discount_percent || 0) / 100)
                : (p.sale_price || p.price);
            return finalPrice <= maxPrice;
        });

        if (selectedColors.length > 0) {
            result = result.filter(p =>
                p.colors && p.colors.some(c => selectedColors.includes(c))
            );
        }

        if (selectedSizes.length > 0) {
            result = result.filter(p => {
                if (!p.stock_by_sizes) return false;
                return selectedSizes.some(size => (p.stock_by_sizes?.[size] || 0) > 0);
            });
        }

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
            default:
                break;
        }

        return result;
    }, [safeProducts, sortOption, maxPrice, selectedColors, selectedSizes, hideOutOfStock]);

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

    return {
        sortOption, setSortOption,
        maxPrice, setMaxPrice,
        selectedColors, toggleColor,
        selectedSizes, toggleSize,
        hideOutOfStock, setHideOutOfStock,
        allAvailableSizes,
        filteredProducts,
        resetFilters
    };
}
