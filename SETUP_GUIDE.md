# Guía de Configuración Paso a Paso - FashionMarket

Esta guía te llevará desde cero hasta tener tu tienda online funcionando completamente.

## 📋 Pre-requisitos

- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Editor de código (VS Code recomendado)

## 🔧 Paso 1: Instalación de Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- Astro 5.0
- React 18
- Tailwind CSS
- Supabase Client
- Nano Stores

## 🗄️ Paso 2: Configurar Supabase

### 2.1 Crear Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa:
   - **Name**: FashionMarket
   - **Database Password**: (guárdala de forma segura)
   - **Region**: Elige la más cercana a ti
5. Haz clic en "Create new project" y espera ~2 minutos

### 2.2 Ejecutar el Esquema de Base de Datos

1. En tu proyecto de Supabase, ve a "SQL Editor" (en el menú lateral)
2. Haz clic en "New query"
3. Abre el archivo `supabase/schema.sql` de este proyecto
4. Copia TODO el contenido y pégalo en el editor SQL de Supabase
5. Haz clic en "Run" (botón verde inferior derecha)
6. Deberías ver: "Success. No rows returned"

✅ Esto creará:
- Tabla `categories` con 4 categorías predefinidas
- Tabla `products`
- Índices para optimización
- Políticas de seguridad RLS
- Triggers de actualización automática

### 2.3 Configurar Storage para Imágenes

1. En Supabase, ve a "Storage" (menú lateral)
2. Haz clic en "Create a new bucket"
3. Configuración:
   - **Name**: `product-images`
   - **Public bucket**: ✅ ACTIVADO (importante)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
4. Haz clic en "Create bucket"

#### Configurar Políticas de Storage

1. Haz clic en tu bucket `product-images`
2. Ve a la pestaña "Policies"
3. Crea las siguientes políticas haciendo clic en "New Policy":

**Política 1: Subida de imágenes**
- **Policy name**: Authenticated users can upload
- **Policy definition**: 
  ```sql
  auth.role() = 'authenticated'
  ```
- **Allowed operations**: INSERT
- Guarda

**Política 2: Actualizar imágenes**
- **Policy name**: Authenticated users can update
- **Policy definition**: 
  ```sql
  auth.role() = 'authenticated'
  ```
- **Allowed operations**: UPDATE
- Guarda

**Política 3: Eliminar imágenes**
- **Policy name**: Authenticated users can delete
- **Policy definition**: 
  ```sql
  auth.role() = 'authenticated'
  ```
- **Allowed operations**: DELETE
- Guarda

### 2.4 Obtener las Credenciales

1. En Supabase, ve a "Project Settings" (icono engranaje)
2. Ve a "API"
3. Copia estos valores:
   - **Project URL**
   - **anon public key**
   - **service_role key** (haz clic en "Reveal" para verla)

## 🔑 Paso 3: Configurar Variables de Entorno

1. En la carpeta del proyecto, copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y reemplaza con tus valores:
   ```env
   PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANTE**: Nunca compartas tu `service_role_key` públicamente.

## 👤 Paso 4: Crear Usuario Administrador

1. En Supabase, ve a "Authentication" → "Users"
2. Haz clic en "Add user" → "Create new user"
3. Completa:
   - **Email**: admin@fashionmarket.com (o el que prefieras)
   - **Password**: (una contraseña segura)
   - **Auto Confirm User**: ✅ ACTIVADO
4. Haz clic en "Create user"

✅ Este usuario podrá acceder al panel de administración.

## 🚀 Paso 5: Ejecutar la Aplicación

```bash
npm run dev
```

Deberías ver algo como:
```
🚀 astro v5.0.0 started in XXms

┃ Local    http://localhost:4321/
┃ Network  use --host to expose
```

## 🧪 Paso 6: Probar la Aplicación

### Acceder a la Tienda Pública
1. Abre http://localhost:4321
2. Deberías ver el homepage (aunque sin productos todavía)

### Acceder al Panel de Administración
1. Abre http://localhost:4321/admin/login
2. Inicia sesión con las credenciales del Paso 4
3. Serás redirigido al Dashboard

### Crear tu Primer Producto
1. En el admin, ve a "Productos" → "Nuevo Producto"
2. Completa el formulario:
   - **Nombre**: Camisa Oxford Azul
   - **Precio**: 89.99
   - **Stock**: 10
   - **Categoría**: Camisas
   - **Tallas**: S, M, L, XL
   - **Descripción**: Camisa elegante de algodón premium...
   - **Destacado**: ✅ (para que aparezca en homepage)
3. Arrastra algunas imágenes (puedes usar imágenes de prueba de internet)
4. Haz clic en "Crear Producto"

⚠️ **Nota sobre imágenes**: La función de subida a Supabase Storage requiere implementación adicional en el formulario. Por ahora, puedes añadir URLs directas de imágenes en el campo de imágenes.

### Ver el Producto en la Tienda
1. Ve a http://localhost:4321
2. Deberías ver tu producto en "Productos Destacados"
3. Haz clic para ver la página del producto
4. Prueba añadir al carrito

## ✅ Verificación Final

Confirma que todo funciona:
- [ ] Homepage se carga correctamente
- [ ] Puedes ver productos (si creaste alguno)
- [ ] Puedes acceder a /admin/login
- [ ] Puedes iniciar sesión en el admin
- [ ] El dashboard muestra estadísticas
- [ ] Puedes crear/editar productos
- [ ] El carrito funciona (añadir/quitar items)

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `.env` existe en la raíz
- Confirma que las variables están correctamente copiadas
- Reinicia el servidor de desarrollo

### Error de autenticación en /admin
- Verifica que creaste un usuario en Supabase Authentication
- Confirma que el usuario tiene "Email confirmed" en true
- Prueba cerrar sesión y volver a iniciar

### Las imágenes no se muestran
- Confirma que el bucket `product-images` es público
- Verifica las políticas de Storage
- Comprueba que las URLs son accesibles

### Error "Cannot find module"
- Ejecuta `npm install` nuevamente
- Elimina `node_modules` y `package-lock.json`, luego `npm install`

## 📚 Próximos Pasos

1. **Añadir más productos**: Crea un catálogo completo
2. **Personalizar colores**: Edita `tailwind.config.mjs`
3. **Añadir procesador de pagos**: Integrar Stripe
4. **Optimizar imágenes**: Implementar carga automática a Storage
5. **Deploy**: Subir a Vercel o Netlify

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12) para errores
2. Revisa la terminal donde corre `npm run dev`
3. Consulta la documentación de [Astro](https://docs.astro.build) y [Supabase](https://supabase.com/docs)

---

¡Felicidades! Tu tienda FashionMarket debería estar funcionando. 🎉
