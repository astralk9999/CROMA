# Guía de Configuración Paso a Paso - Urban Collective | CROMA

Esta guía te llevará desde cero hasta tener tu tienda online funcionando completamente con todas las integraciones modernas.

## 📋 Pre-requisitos

- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com) (base de datos y autenticación)
- Cuenta en [Cloudinary](https://cloudinary.com) (gestión de imágenes)
- Cuenta en [Stripe](https://stripe.com) (procesamiento de pagos)
- Editor de código (VS Code recomendado)

## 🔧 Paso 1: Instalación de Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias principales del proyecto de CROMA:
- Astro 5.16+
- React 18+
- Tailwind CSS 3.4+
- Supabase SDK
- Stripe SDK
- Cloudinary SDK
- Nano Stores
- Nodemailer

## 🗄️ Paso 2: Configurar Supabase (Base de Datos)

### 2.1 Crear Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa la información y crea el proyecto.

### 2.2 Desplegar las Migraciones de la Base de Datos

En este proyecto se utilizan múltiples archivos de migración (ubicados en `supabase/migrations/`).
La forma recomendada de desplegar la base de datos es mediante la CLI oficial de Supabase.

1. Instala el CLI de Supabase si no lo tienes:
   ```bash
   npm install -g supabase
   ```
2. Vincula tu proyecto local con el remoto de Supabase:
   ```bash
   supabase link --project-ref tu-project-id
   ```
3. Empuja todas las migraciones para crear las tablas y políticas de seguridad:
   ```bash
   supabase db push
   ```

✅ Esto creará automáticamente todas las tablas necesarias (`products`, `categories`, `brands`, orders, etc.) y sus correspondientes reglas (RLS).

### 2.3 Obtener Credenciales de Supabase

1. En Supabase, ve a "Project Settings" (icono de engranaje) -> "API"
2. Copia estos valores para el archivo `.env`:
   - **Project URL**
   - **anon public key**
   - **service_role key** (haz clic en "Reveal" para verla)

## 🖼️ Paso 3: Configurar Cloudinary (Imágenes)

CROMA utiliza Cloudinary para optimizar y servir imágenes de productos.

1. Crea tu cuenta en Cloudinary.
2. Ve al "Dashboard" y anota tu `Cloud Name`, `API Key` y `API Secret`.
3. Ve a "Settings" -> "Upload" y crea un nuevo "Upload Preset" llamado `croma_uploads`. 
   - Configúralo como **"Unsigned"** si vas a permitir cargas desde el frontend directamente, o mantenlo "Signed" si se validan en el backend.

## 💳 Paso 4: Configurar Stripe (Pagos)

1. En tu Dashboard de Stripe, obtén tus claves API de prueba (modo "Test").
2. Copia la `Secret key`.
3. Si utilizas Webhooks, configura un Webhook en Stripe apuntando a tu endpoint (`/api/webhooks/stripe`) y copia el `Webhook secret`.

## 🔑 Paso 5: Configurar Variables de Entorno

1. Copia el archivo `.env.example` para crear tu `.env`:
   ```bash
   cp .env.example .env
   ```
2. Completa los valores copiados de los pasos anteriores:
   ```env
   PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

   # Cloudinary
   PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
   PUBLIC_CLOUDINARY_PRESET=croma_uploads
   CLOUDINARY_API_KEY=tu-api-key
   CLOUDINARY_API_SECRET=tu-api-secret

   # Stripe
   STRIPE_SECRET_KEY=sk_test_tu-clave-aqui
   STRIPE_WEBHOOK_SECRET=whsec_tu-webhook-secret-aqui

   # Cron/Seguridad
   CRON_SECRET=croma-email-cron-2026-x9kM2pL
   ```

⚠️ **IMPORTANTE**: ¡Nunca subas tu archivo `.env` a GitHub!

## 👤 Paso 6: Crear Usuario Administrador

1. En Supabase, ve a "Authentication" -> "Users"
2. Haz clic en "Add user" -> "Create new user"
3. Introduce un email (ej. admin@urban-croma.com) y contraseña.
4. Auto-confirma el usuario.
5. (Importante): Para que tenga privilegios de administrador, tendrás que asegurarte de que su rol en tu tabla o lógica de perfiles coincida con el requerido para el panel de administración.

## 🚀 Paso 7: Ejecutar la Aplicación

```bash
npm run dev
```

La tienda estará disponible en `http://localhost:4321`.

## 🧪 Pruebas Iniciales

1. **Catálogo**: Verifica que puedes acceder a la tienda en el navegador. (http://localhost:4321)
2. **Panel Admin**: Ingresa a `/admin/login` e inicia sesión con el usuario que creaste.
3. **Imágenes**: Intenta crear un producto de prueba en el panel y verifica que la subida a Cloudinary funcione correctamente.
4. **Pagos (Opcional)**: Añade items al carrito y prueba el flujo de checkout con las tarjetas de prueba de Stripe.

## 🐛 Problemas Frecuentes

- **Errores de RLS en base de datos**: Verifica que hayas empujado TODAS las migraciones con `supabase db push`.
- **Fallo en "Cannot find module"**: Ejecuta `npm install` nuevamente o borra `node_modules` y reinstala.
- **Las imágenes de productos no se ven**: Revisa que tus credenciales de Cloudinary y el nombre del bucket de tu "preset" coincidan.

---

¡Disfruta construyendo y personalizando Urban Collective | CROMA! 🎉
