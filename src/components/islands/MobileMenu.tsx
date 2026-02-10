import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';

interface MobileMenuProps {
    initialProfile?: any;
    currentPath?: string;
}

export default function MobileMenu({ initialProfile, currentPath = '/' }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(initialProfile?.role === 'admin');

    // Check if user is admin
    useEffect(() => {
        // Initialize from props immediately
        if (initialProfile) {
            setIsAdmin(initialProfile.role === 'admin');
        } else {
            setIsAdmin(false);
        }

        const checkAdmin = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Fetch profile if missing or different
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    if (profile) setIsAdmin(profile.role === 'admin');
                } else {
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error("Admin check error:", err);
            }
        };

        checkAdmin();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setIsAdmin(false);
                return;
            }

            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (profile) setIsAdmin(profile.role === 'admin');
            } else {
                setIsAdmin(false);
            }
        });

        // Nudge on window focus (handle tab switching)
        const handleFocus = () => {
            checkAdmin();
        };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [initialProfile]); // Run when initialProfile changes (navigation)

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Categories
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('name, slug')
                    .order('name');
                if (categoriesData) setCategories(categoriesData);

                // Fetch Brands
                const { data: brandsData } = await supabase
                    .from('brands')
                    .select('name, slug')
                    .order('name');
                if (brandsData) setBrands(brandsData);

                // Fetch Colors
                const { data: colorsData } = await supabase
                    .from('colors')
                    .select('*')
                    .order('name');

                if (colorsData) {
                    const formattedColors = colorsData.map(color => ({
                        name: color.name,
                        slug: color.slug,
                        cssColor: color.hex_code || color.name.toLowerCase()
                    }));
                    setColors(formattedColors);
                }
            } catch (error) {
                console.error('Error fetching menu data:', error);
            }
        };

        fetchData();
    }, []);

    const specials = [
        { name: 'Limited Drops', href: '/category/limited-drops' },
        { name: 'Discounts', href: '/category/discounts' },
        { name: 'Coming soon', href: '/category/coming-soon' },
        { name: 'VIRAL TRENDS', href: '/category/viral-trends' },
        { name: 'Bestsellers', href: '/category/bestsellers' },
        { name: 'MY FAVORITES', href: '/category/my-favorites' },
    ];

    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group p-2 -ml-2 text-gray-900 hover:text-brand-red transition-colors focus:outline-none"
                aria-label="Menu"
            >
                <div className="w-6 h-5 relative flex flex-col justify-between pointer-events-none">
                    <span className="w-full h-0.5 bg-current transform origin-left transition-all duration-300 group-hover:scale-x-75"></span>
                    <span className="w-full h-0.5 bg-current transform origin-left transition-all duration-300"></span>
                    <span className="w-full h-0.5 bg-current transform origin-left transition-all duration-300 group-hover:scale-x-75"></span>
                </div>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-over panel */}
            <div
                className={`fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full bg-white">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        {/* Logo */}
                        <div className="w-32">
                            <img
                                src="/chromakopia_logo.png"
                                alt="CROMA"
                                className="w-full h-auto"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <span className="hidden text-2xl font-black tracking-tighter text-gray-900 uppercase">Croma</span>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto py-8">
                        {/* Global Catálogo Card - Urban Flat Aesthetic Balanced Scale */}
                        <div className="px-6 mb-12">
                            <a href="/category/all"
                                className="group relative flex items-center justify-between overflow-hidden bg-black text-white p-5 rounded-[1.8rem] transition-all duration-300 hover:bg-zinc-900 border border-white/5 active:scale-[0.98]"
                                onClick={() => setIsOpen(false)}>

                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-7 bg-white rounded-full transition-all duration-500 group-hover:h-9 group-hover:bg-zinc-400"></div>

                                <div className="relative z-10 pl-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[6.5px] font-mono text-zinc-500 uppercase tracking-[0.3em] group-hover:text-white transition-colors">PROTOCOL_ALL.ACCESS</span>
                                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                    </div>
                                    <h2 className="text-[17.5px] font-black uppercase tracking-tighter leading-none">
                                        EVERYTHING / <span className="text-zinc-600 group-hover:text-white transition-colors">ALL</span>
                                    </h2>
                                </div>

                                <div className="relative z-10 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </div>

                                <div className="absolute inset-0 bg-[#202020]"></div>
                            </a>
                        </div>

                        {/* Specials */}
                        <div className="px-6 mb-12">
                            <h3 className="font-urban font-black text-2xl uppercase mb-6 flex items-center text-gray-900 border-b-2 border-gray-900 pb-2">
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                                Specials
                            </h3>
                            <nav className="space-y-6 px-1">
                                {specials.map((cat) => (
                                    <a
                                        key={cat.name}
                                        href={cat.href}
                                        className="flex items-center text-[10.5px] font-black uppercase tracking-widest text-zinc-400 active:text-black group"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {cat.name === 'MY FAVORITES' ? (
                                            <svg className="w-3.5 h-3.5 mr-3 text-zinc-300 group-hover:text-red-500 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"></path>
                                            </svg>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-zinc-200 group-hover:bg-black mr-4 transition-all group-hover:scale-125"></span>
                                        )}
                                        {cat.name}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Categories Accordion */}
                        <div className="px-6 mb-8 pt-4">
                            <button
                                onClick={() => toggleSection('categories')}
                                className="w-full text-left mb-6"
                            >
                                <div className="flex items-center gap-3 border-b border-black pb-4 w-full relative">
                                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                    <h3 className="font-black text-[14px] uppercase text-zinc-900 tracking-[0.1em] leading-none">Categories</h3>
                                    <svg className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 transform transition-transform ${expandedSection === 'categories' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            {expandedSection === 'categories' && (
                                <div className="space-y-6 animate-fade-in pb-8">
                                    {categories.map((item) => (
                                        <a
                                            key={item.slug}
                                            href={`/category/${item.slug}`}
                                            className="flex items-center text-[10.5px] font-black text-zinc-400 active:text-black uppercase tracking-widest"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <svg className="w-3.5 h-3.5 mr-4 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"></path></svg>
                                            <span>{item.name}</span>
                                        </a>
                                    ))}
                                    {categories.length === 0 && <p className="text-xs text-zinc-400 pl-8">No categories found</p>}
                                </div>
                            )}
                        </div>

                        {/* Brands Accordion */}
                        <div className="px-6 mb-8">
                            <button
                                onClick={() => toggleSection('brands')}
                                className="w-full text-left mb-6"
                            >
                                <div className="flex items-center gap-3 border-b border-black pb-4 w-full relative">
                                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    <h3 className="font-black text-[14px] uppercase text-zinc-900 tracking-[0.1em] leading-none">Brands</h3>
                                    <svg className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 transform transition-transform ${expandedSection === 'brands' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            {expandedSection === 'brands' && (
                                <div className="space-y-6 animate-fade-in pb-8">
                                    {brands.map((item) => (
                                        <a
                                            key={item.slug}
                                            href={`/brand/${item.slug}`}
                                            className="flex items-center text-[10.5px] font-black text-zinc-400 active:text-black uppercase tracking-widest"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-zinc-200 mr-4"></span>
                                            <span>{item.name}</span>
                                        </a>
                                    ))}
                                    {brands.length === 0 && <p className="text-xs text-zinc-400 pl-8">No brands found</p>}
                                </div>
                            )}
                        </div>

                        {/* Colors Accordion */}
                        <div className="px-6 mb-14">
                            <button
                                onClick={() => toggleSection('colors')}
                                className="w-full text-left mb-6"
                            >
                                <div className="flex items-center gap-3 border-b border-black pb-4 w-full relative">
                                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                                    <h3 className="font-black text-[14px] uppercase text-zinc-900 tracking-[0.1em] leading-none">Cromatografía</h3>
                                    <svg className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 transform transition-transform ${expandedSection === 'colors' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            {expandedSection === 'colors' && (
                                <div className="space-y-4 animate-fade-in pb-4 px-1">
                                    {colors.map((item) => (
                                        <a
                                            key={item.slug}
                                            href={`/color/${item.slug}`}
                                            className="flex items-center gap-4 text-[10.5px] font-black uppercase tracking-widest text-zinc-400 active:text-black"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <div className="relative overflow-hidden rounded-full p-[1.5px] bg-zinc-50 ring-1 ring-black/5">
                                                <div className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: item.cssColor }}></div>
                                            </div>
                                            {item.name}
                                        </a>
                                    ))}
                                    {colors.length === 0 && <p className="text-xs text-zinc-400 pl-8">No colors found</p>}
                                </div>
                            )}
                        </div>

                        {/* Account Actions - Redesigned Compact Cards */}
                        <div className="px-6 mb-8 mt-auto">
                            <div className="space-y-3">
                                <a
                                    href={`/account/profile?redirect=${encodeURIComponent(currentPath)}`}
                                    className="flex items-center justify-between px-6 py-4 bg-white border border-zinc-100 rounded-[1.5rem] text-[10.5px] font-black uppercase tracking-widest text-zinc-400 active:scale-[0.98] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.03)] h-20 relative overflow-hidden group"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className="flex flex-col items-start gap-0.5 z-10">
                                        <span className="text-zinc-300 text-[9px]">ACCOUNT</span>
                                        <span className="text-zinc-900 text-[12px] leading-tight">USUARIO / <br />PERFIL</span>
                                    </div>
                                    <svg className="w-12 h-12 text-zinc-200 absolute -right-1 -bottom-1 group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                </a>

                                {isAdmin && (
                                    <a
                                        href="/admin/dashboard"
                                        className="flex items-center justify-between px-6 py-4 bg-black rounded-[1.5rem] text-[10.5px] font-black uppercase tracking-widest text-white active:scale-[0.98] transition-all shadow-xl shadow-black/10 h-20 relative overflow-hidden group"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="flex flex-col items-start gap-0.5 z-10">
                                            <span className="text-zinc-500 text-[9px]">ADMIN</span>
                                            <span className="text-white text-[12px] leading-tight">CONSOLA DE <br />CONTROL</span>
                                        </div>
                                        <svg className="w-12 h-12 text-zinc-700 absolute -right-1 -bottom-1 group-hover:scale-110 transition-transform duration-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Help & Contact - Always Expanded */}
                        <div className="px-6 mb-14 py-6 border-t border-zinc-100 bg-zinc-50/50">
                            <div className="w-full text-left mb-6">
                                <div className="flex items-center gap-3 border-b border-black pb-4 w-full relative">
                                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    <h3 className="font-black text-[14px] uppercase text-zinc-900 tracking-[0.1em] leading-none">Help & Contact</h3>
                                </div>
                            </div>
                            <div className="space-y-4 animate-fade-in pb-4 px-1">
                                {[
                                    { name: 'CUSTOMER SERVICE / CONTACT', slug: 'customer-service' },
                                    { name: 'SIZE GUIDE', slug: 'size-guide' },
                                    { name: 'RETURNS', slug: 'returns' },
                                    { name: 'FAQ', slug: 'faq' },
                                    { name: 'ABOUT US', slug: 'about' },
                                    { name: 'SHIPPING & RETURNS', slug: 'shipping' }
                                ].map((item) => (
                                    <a
                                        key={item.name}
                                        href={`/${item.slug}`}
                                        className="flex items-center gap-4 text-[10.5px] font-black uppercase tracking-widest text-zinc-400 active:text-black"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-200"></span>
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

