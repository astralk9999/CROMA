import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';

interface UserMenuProps {
    initialProfile?: any;
    currentPath?: string;
    labels?: {
        login: string;
        register: string;
        logout: string;
        orders: string;
        returns: string;
        favorites: string;
        profile: string;
        admin: string;
        welcome: string;
    };
}

export default function UserMenu({ initialProfile, currentPath = '/', labels }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(initialProfile || null);
    const [loading, setLoading] = useState(!initialProfile);

    // Fallback labels if not provided
    const text = labels || {
        login: 'Iniciar Sesión',
        register: 'Crear Cuenta',
        logout: 'Cerrar Sesión',
        orders: 'Mis Pedidos',
        returns: 'Mis Devoluciones',
        favorites: 'Mis Favoritos',
        profile: 'Mi Perfil',
        admin: 'Panel de Administración',
        welcome: 'Usuario'
    };

    // ... (rest of logic unaffected)

    return (
        <div className="relative flex items-center justify-center">
            {/* Same button code */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-900 hover:text-brand-red transition-colors"
                aria-label="User menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        {(user || profile) ? (
                            <div className="py-2">
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || text.welcome}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || profile?.email}</p>
                                    {profile?.role === 'admin' && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-black text-white text-xs font-medium rounded-full">
                                            Admin
                                        </span>
                                    )}
                                </div>

                                {profile?.role === 'admin' && (
                                    <a
                                        href="/admin/dashboard"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            {text.admin}
                                        </div>
                                    </a>
                                )}

                                <a
                                    href="/account/orders"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {text.orders}
                                </a>
                                <a
                                    href="/account/returns"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {text.returns}
                                </a>
                                <a
                                    href="/category/my-favorites"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {text.favorites}
                                </a>
                                <a
                                    href="/account/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {text.profile}
                                </a>
                                <div className="border-t border-gray-200 mt-2 pt-2">
                                    <a
                                        href="/auth/logout"
                                        className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        {text.logout}
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="py-2">
                                <a
                                    href={`/auth/login?redirect=${encodeURIComponent(currentPath)}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {text.login}
                                </a>
                                <a
                                    href={`/auth/register?redirect=${encodeURIComponent(currentPath)}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    {text.register}
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
