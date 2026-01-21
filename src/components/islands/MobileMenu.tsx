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
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 transition-colors duration-300">
                        {/* Logo */}
                        <div className="w-28 md:w-32">
                            <img
                                src="/chromakopia_logo.png"
                                alt="CROMA"
                                className="w-full h-auto"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <span className="hidden text-xl font-black tracking-tighter text-gray-900 uppercase">Croma</span>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:rotate-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto py-10 px-8">
                        <nav className="flex flex-col space-y-8">
                            {categories.map((cat, idx) => (
                                <a
                                    key={cat.name}
                                    href={cat.href}
                                    className={`group block text-3xl font-urban font-black uppercase text-gray-900 hover:text-brand-red transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                                    style={{ transitionDelay: `${idx * 50}ms` }}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="inline-block relative">
                                        {cat.name}
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                                    </span>
                                </a>
                            ))}
                        </nav>

                        <div className="mt-16 pt-8 border-t border-gray-100 pb-10">
                            <div className="space-y-6">
                                <a href="/category/all" className="block text-lg font-urban font-black text-gray-900 hover:text-brand-red uppercase tracking-widest transition-colors duration-300">
                                    View All Products
                                </a>
                                <div className="space-y-3">
                                    <a
                                        href={`/account/profile?redirect=${encodeURIComponent(currentPath)}`}
                                        className="block text-gray-500 hover:text-black font-semibold tracking-wide text-sm uppercase transition-colors duration-300"
                                    >
                                        My Account
                                    </a>
                                    <a href="/contact" className="block text-gray-500 hover:text-black font-semibold tracking-wide text-sm uppercase transition-colors duration-300">Help & Contact</a>
                                </div>

                                {/* Admin Panel Link - Only visible for admins */}
                                {isAdmin && (
                                    <a
                                        href="/admin/dashboard"
                                        className="flex items-center gap-3 text-brand-red font-black hover:text-red-700 transition-all duration-300 mt-8 pt-6 border-t border-gray-100 uppercase text-xs tracking-[0.2em]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
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

