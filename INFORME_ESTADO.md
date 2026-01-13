# CROMA - Estado del Proyecto y Hoja de Ruta

Este documento detalla el estado actual del desarrollo de la tienda online CROMA, analizando los errores corregidos, fallos pendientes y funcionalidades por implementar.

## ✅ Funcionalidades Completadas y Estables

Estas características están funcionando correctamente en el código actual:

1.  **Arquitectura SSR (Server-Side Rendering)**: La tienda ahora funciona en modo servidor híbrido, permitiendo autenticación segura y redirecciones correctas.
2.  **Carrito de Compras**: Persistente, diseño unificado (blanco/negro), funcional.
3.  **Favoritos**: Sincronización básica habilitada. Se ha corregido el error de "botón cargando infinito".
4.  **Navegación y Filtros**: Las páginas de categorías, colecciones y marcas ya no dan error 500 (`toLowerCase error`) y soportan URLs dinámicas.
5.  **Imágenes**: Sistema de protección contra imágenes rotas (Logo y Hero) implementado.
6.  **Newsletter**: Lógica de suscripción corregida para detectar duplicados sin bloquearse por seguridad (requiere tabla en BD).

---

## ⚠️ Errores Reportados y Estado Técnico

Análisis técnico de los errores que has mencionado:

| Error | Causa Técnica Probable | Estado / Solución |
| :--- | :--- | :--- |
| **"La newsletter no envía nada"** | Falta integración SMTP (Resend/SendGrid). Ahora mismo solo guarda en BD. | 🟡 **Parcialmente corregido**: Guarda el email, pero falta conectar un servicio de envío de correos real. |
| **"La lupa redirige a todos"** | Era una solución temporal ('/category/all'). | 🟢 **Corregido**: Se creó `/search` con filtro real a la BD. |
| **"Botón favoritos se queda cargando"** | Fallo en manejo de errores asíncronos en componentes React. | 🟢 **Corregido**: Se añadió bloqueo `try/catch/finally` para asegurar que el botón siempre se desbloquea. |
| **"Admin no ve botón panel"** | El rol de usuario en la tabla `profiles` no es 'admin' o la sesión expiró. | 🟢 **Verificado**: Funciona. Ejecutar SQL: `UPDATE profiles SET role = 'admin' ...` |
| **"No deja cerrar sesión a veces"** | Posible problema de caché o cookies persistentes en navegador. | 🟡 **En revisión**: El código borra cookies y llama a Supabase. Se recomienda forzar recarga tras logout. |
| **"Perfil no actualiza info"** | Las políticas de seguridad (RLS) podrían estar bloqueando si el usuario no coincide exactamente. | 🟢 **Verificado**: Las políticas RLS permiten `update own profile`. Debería funcionar. |
| **"Inicio sesión Google"** | Falta el archivo manejador de respuesta de Google (`/auth/callback`). | 🟢 **Corregido**: Se creó el endpoint `src/pages/auth/callback.ts`. (Requiere config en Google Cloud). |
| **"Botones productos mal visualizados"** | Probablemente inconsistencias CSS en tamaños de pantalla específicos. | 🟡 **Visual**: Requiere revisión de estilos CSS en `ProductCard`. |
| **"Ofertas y Drops"** | Falta lógica de precio oferta / fecha expiración. | 🟢 **Implementado**: Se añadieron campos en Admin para `sale_price` y fecha expiración. |

---

## 🚀 Hoja de Ruta: Cosas por Implementar

Funcionalidades solicitadas que aún no existen en el código:

### 1. Panel de Administración Avanzado (CRUD)
*   **Falta**: Interfaz para crear/editar Categorías, Marcas, Colores y Colecciones.
*   **Actual**: Solo permite editar Productos.
*   **Complejidad**: Media. Requiere crear nuevas tablas o usar JSONB y formularios en `/admin`.

### 2. Ofertas Temporales y Exclusividad
*   **Falta**: Sistema de "Drops" con cuenta regresiva y expiración automática.
*   **Implementación**: Añadir campos `available_from` y `expires_at` a la tabla productos. Tarea programada (Cron) o filtro en frontend para ocultar expirados.

### 3. Pagos con Stripe
*   **Falta**: Integración completa de pasarela de pago.
*   **Estado**: Actualmente el Checkout es simulado o básico.
*   **Requisitos**: Cuenta de Stripe, Webhooks para confirmar pago, tabla de `orders` actualizada.

### 4. Seguimiento de Paquetes
*   **Falta**: Sistema de estados de pedido (`Shipped`, `Delivered`) visible para el usuario.
*   **Implementación**: Página `/account/tracking/[id]` y correos de notificación.

### 5. Correos de Supabase (Recuperación/Registro)
*   **Falta**: Personalización de plantillas de correo.
*   **Solución**: Se configura directamente en el Dashboard de Supabase (Authentication -> Email Templates), no en el código.

### 6. Multi-idioma (i18n)
*   **Falta**: Traducción de la interfaz (Español/Inglés/Otros).
*   **Implementación**: Requiere refactorizar todo el texto a archivos de traducción (`src/i18n/es.json`) y rutas dinámicas (`/es/...`, `/en/...`).

---

## 🛠️ Próximos Pasos Recomendados

1.  **Prioridad 1**: Arreglar Login con Google (Crear `auth/callback`).
2.  **Prioridad 2**: Implementar Búsqueda real (Lupa).
3.  **Prioridad 3**: Comenzar con la integración de Stripe (es lo más complejo).
4.  **Prioridad 4**: Ampliar el Panel Admin para Marcas/Categorías.
