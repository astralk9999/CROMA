import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, cookies } = context;
  const url = new URL(request.url);

  // Get user session for all pages
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (accessToken && refreshToken) {
    try {
      const { data: { user, session }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!error && user) {
        // If the session was refreshed, update cookies
        if (session && session.access_token !== accessToken) {
          const maxAge = 60 * 60 * 24 * 7; // 7 days
          cookies.set('sb-access-token', session.access_token, { path: '/', maxAge });
          cookies.set('sb-refresh-token', session.refresh_token!, { path: '/', maxAge });
        }

        // Fetch user profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        context.locals.user = user;
        context.locals.profile = profile;
      } else if (error) {
        // Clear invalid cookies
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
      }
    } catch (error) {
      console.error('Middleware auth connection error:', error);
    }
  }

  // Admin route protection
  if (url.pathname.startsWith('/admin')) {
    if (url.pathname === '/admin/login') {
      return next();
    }

    if (!context.locals.user || !context.locals.profile) {
      return redirect('/auth/login?redirect=' + encodeURIComponent(url.pathname));
    }

    // Check if user is admin
    if (context.locals.profile.role !== 'admin') {
      return redirect('/?error=No tienes permisos para acceder a esta página');
    }
  }

  // Protected customer routes
  if (url.pathname.startsWith('/account')) {
    if (!context.locals.user) {
      return redirect('/auth/login?redirect=' + encodeURIComponent(url.pathname));
    }
  }

  return next();
});
