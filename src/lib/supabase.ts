import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Workaround for AbortError: signal is aborted without reason
// This is a known issue with @supabase/supabase-js and navigator.locks
// See: https://github.com/supabase/auth-js/issues/888
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      // Simple lock implementation that avoids navigator.locks issues
      return await fn();
    },
    // Also set these to avoid other potential issues
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          stock: number;
          stock_by_sizes: Record<string, number> | null;
          category_id: string | null;
          images: string[];
          sizes: string[];
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          stock?: number;
          stock_by_sizes?: Record<string, number> | null;
          category_id?: string | null;
          images?: string[];
          sizes?: string[];
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          stock?: number;
          stock_by_sizes?: Record<string, number> | null;
          category_id?: string | null;
          images?: string[];
          sizes?: string[];
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
