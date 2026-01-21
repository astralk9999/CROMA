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

    const categories = [
        { name: 'Coming soon', href: '/category/coming-soon' },
        { name: 'VIRAL TRENDS', href: '/category/viral-trends' },
        { name: 'SALE', href: '/category/sale' },
        { name: 'My favorites', href: '/category/my-favorites' },
        { name: 'Bestsellers', href: '/category/bestsellers' },
    ];

    const clothingCategories = [
        'Jackets', 'Sweatshirt / Pullover', 'T-Shirts', 'Trousers', 'Denim',
        'Shirts', 'Accessories', 'Underwear & Socks', 'Sportswear', 'Shoes'
    ];

    const brands = [
        'SMOG', 'FSBN', 'BLACK SQUAD', 'ICONO', 'IQ', 'LUCKY ATHLETES'
    ];

    const colors = [
        { name: 'Beige', class: 'bg-[#F5F5DC]' },
        { name: 'Blue', class: 'bg-blue-600' },
        { name: 'Brown', class: 'bg-amber-800' },
        { name: 'Gold', class: 'bg-yellow-500' },
        { name: 'Green', class: 'bg-green-600' },
        { name: 'Grey/Black', class: 'bg-gray-800' },
        { name: 'Orange', class: 'bg-orange-500' },
        { name: 'Pink', class: 'bg-pink-500' },
        { name: 'Red', class: 'bg-red-600' },
        { name: 'White', class: 'bg-white border border-gray-300' },
        { name: 'Yellow', class: 'bg-yellow-400' }
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
                    <div className="flex-1 overflow-y-auto py-6 px-6">
                        {/* Specials */}
                        <nav className="space-y-4 mb-6">
                            <h3 className="font-urban font-black text-sm uppercase text-gray-400 tracking-widest">Specials</h3>
                            {categories.map((cat) => (
                                <a
                                    key={cat.name}
                                    href={cat.href}
                                    className="block text-lg font-urban font-bold uppercase text-gray-900 hover:text-brand-red transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {cat.name}
                                </a>
                            ))}
                        </nav>

                        {/* Categories Accordion */}
                        <div className="border-t border-gray-200 py-4">
                            <button
                                onClick={() => toggleSection('categories')}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <h3 className="font-urban font-black text-sm uppercase text-gray-900 tracking-widest">Categories</h3>
                                <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'categories' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {expandedSection === 'categories' && (
                                <div className="mt-3 space-y-2 pl-2">
                                    {clothingCategories.map((item) => (
                                        <a
                                            key={item}
                                            href={`/category/${item.toLowerCase().replace(/ /g, '-').replace(/\//g, '').replace(/&/g, 'and')}`}
                                            className="block text-base text-gray-600 hover:text-black transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {item}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Brands Accordion */}
                        <div className="border-t border-gray-200 py-4">
                            <button
                                onClick={() => toggleSection('brands')}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <h3 className="font-urban font-black text-sm uppercase text-gray-900 tracking-widest">Brands</h3>
                                <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'brands' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {expandedSection === 'brands' && (
                                <div className="mt-3 space-y-2 pl-2">
                                    {brands.map((item) => (
                                        <a
                                            key={item}
                                            href={`/brand/${item.toLowerCase().replace(/ /g, '-')}`}
                                            className="block text-base text-gray-600 hover:text-black transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {item}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Colors Accordion */}
                        <div className="border-t border-gray-200 py-4">
                            <button
                                onClick={() => toggleSection('colors')}
                                className="w-full flex items-center justify-between text-left"
                            >
                                <h3 className="font-urban font-black text-sm uppercase text-gray-900 tracking-widest">Colors</h3>
                                <svg className={`w-5 h-5 transform transition-transform ${expandedSection === 'colors' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {expandedSection === 'colors' && (
                                <div className="mt-3 space-y-2 pl-2">
                                    {colors.map((item) => (
                                        <a
                                            key={item.name}
                                            href={`/color/${item.name.toLowerCase().replace('/', '-').replace(/ /g, '-')}`}
                                            className="flex items-center gap-3 text-base text-gray-600 hover:text-black transition-colors"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className={`w-5 h-5 rounded-md ${item.class}`}></span>
                                            {item.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Links */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="space-y-3">
                                <a href="/category/all" className="block text-lg font-urban font-bold text-gray-900 hover:text-brand-red uppercase">
                                    View All Products
                                </a>
                                <a
                                    href={`/account/profile?redirect=${encodeURIComponent(currentPath)}`}
                                    className="block text-gray-600 hover:text-black font-medium"
                                >
                                    My Account
                                </a>
                                <a href="/contact" className="block text-gray-600 hover:text-black font-medium">Help & Contact</a>

                                {/* Admin Panel Link - Only visible for admins */}
                                {isAdmin && (
                                    <a
                                        href="/admin/dashboard"
                                        className="flex items-center gap-2 text-brand-red font-bold hover:text-red-700 transition-colors mt-4 pt-4 border-t border-gray-200"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Panel de Administración
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

