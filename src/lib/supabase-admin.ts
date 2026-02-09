import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    const errorMsg = `CRITICAL: Falta configurar variables de entorno de Supabase (${!supabaseUrl ? 'URL' : ''} ${!supabaseServiceRoleKey ? 'ServiceRoleKey' : ''})`;
    console.error(errorMsg);
    if (typeof window !== 'undefined') {
        console.error('CRITICAL ERROR: supabaseAdmin initialized in browser context! This is a security risk.');
    }
}

export const supabaseAdmin = createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
