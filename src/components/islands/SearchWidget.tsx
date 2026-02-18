import { useState, useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase';


interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    category: string;
    images: string[];
}

interface SearchWidgetProps {
    labels?: {
        placeholder: string;
        searching: string;
        notFound: string;
        allResults: string;
        suggestions: string;
        products: string;
        trending: string;
        tags: string[];
    };
}

export default function SearchWidget({ labels }: SearchWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Default tags if none provided
    const defaultTags = ['Jackets', 'T-Shirts', 'Black', 'Hoodie'];
    const displayTags = labels?.tags || defaultTags;

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 2) {
                setLoading(true);
                try {
                    const searchTerm = query.trim().toLowerCase();

                    // Search across name, description, category slug, and brand
                    const { data, error } = await supabase
                        .from('products')
                        .select('id, name, slug, price, images, category, brand, colors, categories(name)')
                        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
                        .limit(10);

                    let products: Product[] = [];

                    if (!error && data) {
                        products = data.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            slug: p.slug,
                            price: p.price,
                            category: Array.isArray(p.categories)
                                ? p.categories[0]?.name
                                : p.categories?.name || p.category || 'Producto',
                            images: p.images || []
                        }));
                    }

                    // If no results yet, try searching by color (array contains)
                    if (products.length === 0) {
                        const { data: colorData, error: colorError } = await supabase
                            .from('products')
                            .select('id, name, slug, price, images, category, brand, colors, categories(name)')
                            .contains('colors', [searchTerm])
                            .limit(10);

                        if (!colorError && colorData) {
                            products = colorData.map((p: any) => ({
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                price: p.price,
                                category: Array.isArray(p.categories)
                                    ? p.categories[0]?.name
                                    : p.categories?.name || p.category || 'Producto',
                                images: p.images || []
                            }));
                        }
                    }

                    setResults(products);
                } catch (err) {
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative" ref={searchRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 text-gray-900 hover:text-brand-red transition-all duration-300 hover:scale-110"
                aria-label="Search"
            >
                <svg
                    className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-90 text-brand-red' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </button>

            {/* Search Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-screen max-w-sm md:max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right transform transition-all">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={labels?.placeholder || "Buscar productos, colores..."}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                                autoFocus
                            />
                            <img
                                src="/brand/logo_c_horns.png"
                                alt=""
                                className="absolute left-3 top-3.5 w-5 h-5 object-contain"
                            />
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">
                                <div className="relative w-12 h-12 mx-auto mb-4">
                                    <div className="absolute inset-0 border-2 border-gray-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-2 border-black rounded-full animate-spin border-t-transparent"></div>
                                    <div className="absolute inset-0 flex items-center justify-center p-2">
                                        <img src="/brand/logo_c_horns.png" alt="Loading" className="w-full h-auto object-contain" />
                                    </div>
                                </div>
                                <p className="font-medium text-gray-900">{labels?.searching || "Buscando productos..."}</p>
                            </div>
                        ) : query.length > 2 && results.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>{labels?.notFound || "No encontramos nada para"} "{query}"</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">{labels?.products || "Productos"}</h3>
                                {results.map(product => (
                                    <a
                                        key={product.id}
                                        href={`/productos/${product.slug}`}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                                    >
                                        <img
                                            src={product.images?.[0] || '/placeholder.png'}
                                            alt={product.name}
                                            className="w-12 h-12 object-cover rounded-md bg-gray-100"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.category}</p>
                                            <p className="text-sm font-bold text-black mt-0.5">{product.price}€</p>
                                        </div>
                                    </a>
                                ))}
                                <a href={`/search?q=${query}`} className="block p-3 text-center text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition-colors border-t border-gray-100">
                                    {labels?.allResults || "Ver todos los resultados"}
                                </a>
                            </div>
                        ) : (
                            <div className="p-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{labels?.suggestions || "Sugerencias"}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {displayTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setQuery(tag)}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-black hover:text-white transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
