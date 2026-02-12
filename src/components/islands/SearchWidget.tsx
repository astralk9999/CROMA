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

export default function SearchWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

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
                    // Strategy: Try RPC first, fallback to Client Query
                    let dbProducts: Product[] = [];
                    let hasDbError = false;

                    // Helper for fetching with timeout
                    const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
                        return Promise.race([
                            promise,
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), timeoutMs)
                            )
                        ]);
                    };

                    try {
                        // Directly use Client-Side Query (RPC is unreliable/outdated)
                        // console.log("Searching for:", query);

                        const { data, error } = await withTimeout(
                            (async () => await supabase
                                .from('products')
                                .select('id, name, slug, price, category_id, images, categories(name)')
                                .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                                .range(0, 5))(),
                            3000 // Increased timeout slightly
                        ) as any;

                        if (!error && data) {
                            dbProducts = data.map((p: any) => ({
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                price: p.price,
                                // Handle the joined category data safely (it might be an array or object)
                                category: Array.isArray(p.categories)
                                    ? p.categories[0]?.name
                                    : p.categories?.name || 'Producto',
                                images: p.images || []
                            }));
                        } else {
                            // If no data or error, just show empty
                            // console.warn("Search error or no data:", error);
                        }
                    } catch (err: any) {
                        console.error("Search processing error:", err?.message || err);
                        hasDbError = true;
                    }

                    if (!hasDbError && dbProducts.length > 0) {
                        setResults(dbProducts);
                    } else {
                        setResults([]);
                    }
                } catch (err) {
                    console.error("Critical search failure:", err);
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
                                placeholder="Buscar productos, colores..."
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
                                <p className="font-medium text-gray-900">Buscando productos...</p>
                            </div>
                        ) : query.length > 2 && results.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No encontramos nada para "{query}"</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div>
                                <h3 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">Productos</h3>
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
                                    Ver todos los resultados
                                </a>
                            </div>
                        ) : (
                            <div className="p-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sugerencias</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Jackets', 'T-Shirts', 'Black', 'Hoodie'].map(tag => (
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
