# CROMA - Urban Streetwear Store

Tienda online moderna construida con **Astro 5.0** (modo servidor/SSR), **Tailwind CSS**, **Supabase** y **Cloudinary**.

## 🏗️ Arquitectura

- **Frontend**: Astro 5.0 con renderizado híbrido/server (SSR)
- **Estilos**: Tailwind CSS con tema personalizado (Urban/Black/White)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Imágenes**: Cloudinary y Supabase Storage
- **Estado**: Nano Stores con persistencia local
- **Interactive Islands**: React 18 para componentes interactivos

## 🚀 Instalación y Despliegue

### 1. Variables de Entorno (.env)
```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
PUBLIC_CLOUDINARY_PRESET=croma_uploads
```

### 2. Base de Datos (Supabase)
Ejecuta las migraciones en el SQL Editor en este orden:
1. `supabase/migrations/001_complete_schema.sql`
2. `supabase/migrations/001b_add_product_columns.sql`
3. `supabase/migrations/002_seed_products.sql`
4. `supabase/migrations/20260113_newsletter_subscribers.sql`

### 3. Crear Admin
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu-email';
```

### 4. Ejecutar
```bash
npm install
npm run dev
```

## 📚 Funcionalidades
- ✅ Catálogo completo con filtros por categoría, marca y color
- ✅ Autenticación de usuarios y Roles (Admin/Cliente)
- ✅ Carrito de compras persistente
- ✅ Favoritos sincronizados (Local + Cloud)
- ✅ Panel de Administración completo (Subida de productos, gestión de stock)
- ✅ Integración con Newsletter
- ✅ Diseño Responsive y animaciones

---
**Desarrollado para**: CROMA Store
