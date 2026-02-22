import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, cookies } = context;
  const url = new URL(request.url);

  // Language Detection
  const langCookie = cookies.get('preferred_language')?.value;
  context.locals.lang = (langCookie === 'en' ? 'en' : 'es');

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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('[Middleware] Profile Fetch Error:', profileError.message);
        }

        context.locals.user = user;
        context.locals.profile = profile;

        /* if (profile) {
          console.log(`[Middleware] Auth Success: ${user.email} (${profile.role})`);
        } */
      } else if (error) {
        // Clear invalid cookies
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
      }
    } catch (error) {
      console.log('Middleware auth connection error:', error);
    }
  }

  // Admin route protection (Frontend & API)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    if (url.pathname === '/admin/login' || url.pathname === '/api/admin/login') {
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

  const response = await next();

  // Inject Security Headers
  const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://*.supabase.co https://*.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com https://challenges.cloudflare.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});
