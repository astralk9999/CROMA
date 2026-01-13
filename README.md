# FashionMarket - E-commerce Premium de Moda Masculina

Tienda online moderna construida con **Astro 5.0** (modo híbrido), **Tailwind CSS**, **Supabase** y **Nano Stores**.

## 🏗️ Arquitectura

- **Frontend**: Astro 5.0 con renderizado híbrido (SSG para catálogo, SSR para admin)
- **Estilos**: Tailwind CSS con paleta personalizada de marca
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: Nano Stores con persistencia local
- **Interactive Islands**: React 18 para componentes interactivos

## 📁 Estructura del Proyecto

```
fashionmarket/
├── public/                    # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── islands/          # Componentes React interactivos
│   │   │   ├── AddToCartButton.tsx
│   │   │   ├── CartIcon.tsx
│   │   │   ├── CartSlideOver.tsx
│   │   │   └── ImageUploader.tsx
│   │   ├── product/          # Componentes de producto
│   │   │   ├── ProductCard.astro
│   │   │   └── ProductGallery.astro
│   │   └── ui/               # Componentes UI genéricos
│   │       └── Button.astro
│   ├── layouts/              # Layouts de página
│   │   ├── BaseLayout.astro
│   │   ├── PublicLayout.astro
│   │   └── AdminLayout.astro
│   ├── lib/                  # Utilidades y clientes
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/                # Rutas de la aplicación
│   │   ├── index.astro       # Homepage (SSG)
│   │   ├── productos/        # Catálogo (SSG)
│   │   ├── categoria/        # Filtros (SSG)
│   │   └── admin/            # Panel admin (SSR protegido)
│   ├── stores/               # Estado global
│   │   └── cart.ts
│   └── middleware.ts         # Autenticación
├── supabase/
│   ├── schema.sql            # Esquema de base de datos
│   └── storage-setup.md      # Configuración de Storage
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el SQL en `supabase/schema.sql` en el SQL Editor
3. Crea el bucket `product-images` siguiendo `supabase/storage-setup.md`
4. Copia las credenciales a tu archivo `.env`:

```bash
cp .env.example .env
```

Edita `.env`:
```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Crear usuario administrador

En Supabase Dashboard → Authentication → Users, crea un usuario manualmente.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Visita:
- **Tienda**: http://localhost:4321
- **Admin**: http://localhost:4321/admin/login

## 🎨 Diseño y Marca

### Paleta de Colores

- **Navy** (Azul marino): Color principal para headers y CTAs
- **Charcoal** (Gris carbón): Textos y elementos secundarios
- **Cream** (Crema/Beige): Fondos sutiles y espacios
- **Gold** (Dorado mate): Acentos y alertas importantes

### Tipografías

- **Playfair Display** (Serif): Títulos y headings
- **Inter** (Sans-serif): Textos del cuerpo

## 🛒 Funcionalidades

### Tienda Pública (SSG)
- ✅ Homepage con productos destacados
- ✅ Catálogo completo de productos
- ✅ Filtrado por categorías
- ✅ Páginas de producto individuales
- ✅ Carrito persistente con Nano Stores
- ✅ Slide-over lateral para el carrito

### Panel de Administración (SSR)
- ✅ Autenticación con Supabase Auth
- ✅ Dashboard con métricas
- ✅ Gestión completa de productos (CRUD)
- ✅ Subida de imágenes con drag & drop
- ✅ Middleware de protección de rutas

## 📦 Base de Datos

### Tablas

**categories**
- id (UUID)
- name (TEXT)
- slug (TEXT, unique)
- created_at, updated_at

**products**
- id (UUID)
- name, slug (TEXT)
- description (TEXT)
- price (INTEGER en céntimos)
- stock (INTEGER)
- category_id (UUID, FK)
- images (TEXT[])
- sizes (TEXT[])
- featured (BOOLEAN)
- created_at, updated_at

### Políticas RLS
- ✅ Lectura pública para todos
- ✅ Escritura solo para usuarios autenticados

## 🔐 Autenticación

El middleware en `src/middleware.ts` protege todas las rutas `/admin/*` excepto `/admin/login`.

Las sesiones se almacenan en cookies httpOnly seguras.

## 🛠️ Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build para producción
npm run preview   # Preview del build
```

## 📝 Notas de Implementación

### Cart State (Nano Stores)

El carrito usa `@nanostores/persistent` para mantener el estado entre sesiones:

```typescript
import { cartItems, addToCart } from '@stores/cart';

// Añadir producto
addToCart({
  id: '...',
  name: 'Camisa Oxford',
  price: 9900, // en céntimos
  size: 'M',
  image: 'url...'
});
```

### Interactive Islands

Los componentes React se hidratan solo cuando es necesario usando `client:load`:

```astro
<AddToCartButton client:load product={product} />
```

### Supabase Storage

Las imágenes se suben a `product-images/products/{slug}/{timestamp}-{random}.ext`

URL pública: `https://tu-proyecto.supabase.co/storage/v1/object/public/product-images/...`

## 🚢 Despliegue

### Vercel / Netlify

1. Conecta tu repositorio
2. Configura las variables de entorno
3. Deploy automático en cada push

### Variables de Entorno en Producción

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 📄 Licencia

Proyecto educativo para demostración de arquitectura e-commerce headless.

---

**Desarrollado por**: Un Arquitecto de Software Senior especializado en E-commerce Headless
**Stack**: Astro 5.0 + Tailwind CSS + Supabase + Nano Stores
