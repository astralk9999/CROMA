import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, redirect, cookies } = context;
  const url = new URL(request.url);

  // Get user session for all pages
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  if (accessToken && refreshToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!error && user) {
      // Fetch user profile with role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      context.locals.user = user;
      context.locals.profile = profile;
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
