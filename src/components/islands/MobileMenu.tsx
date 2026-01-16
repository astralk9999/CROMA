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
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // If we have initial profile and it matches session user, trust it
                if (initialProfile && initialProfile.id === session.user.id) {
                    setIsAdmin(initialProfile.role === 'admin');
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    setIsAdmin(profile?.role === 'admin');
                }
            } else {
                setIsAdmin(false);
            }
        };
        checkAdmin();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                // If initialProfile exists, we might trust it, but on auth change we should verify
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                setIsAdmin(profile?.role === 'admin');
            } else {
                setIsAdmin(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [initialProfile]);

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
                    <div className="flex-1 overflow-y-auto py-8 px-6">
                        <nav className="space-y-6">
                            {categories.map((cat) => (
                                <a
                                    key={cat.name}
                                    href={cat.href}
                                    className="block text-2xl font-urban font-bold uppercase text-gray-900 hover:text-brand-red hover:tracking-wide transition-all duration-300"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {cat.name}
                                </a>
                            ))}
                        </nav>

                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <div className="space-y-4">
                                <a href="/category/all" className="block text-xl font-urban font-bold text-gray-900 hover:text-brand-red uppercase">
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
                                        className="flex items-center gap-2 text-brand-red font-bold hover:text-red-700 transition-colors mt-6 pt-4 border-t border-gray-200"
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

