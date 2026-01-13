/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly CLOUDINARY_CLOUD_NAME: string;
  readonly CLOUDINARY_API_KEY: string;
  readonly CLOUDINARY_API_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email?: string;
      [key: string]: any;
    };
    profile?: {
      id: string;
      email: string;
      full_name?: string;
      role: 'customer' | 'admin';
      phone?: string;
      created_at: string;
      updated_at: string;
    };
  }
}
