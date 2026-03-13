
# Proyecto Associates Italia 90

Este repositorio contiene una aplicación full-stack para la gestión de socios del club Italia 90, con un frontend en React (Vite) y un backend en Node.js (Express) desplegado como Serverless Function en Vercel.

## Estructura del Proyecto

- `/app`: Frontend React (Vite).
- `/backend`: Backend Node.js (Express) y lógica de negocio.
- `/api`: Entry point para Vercel Serverless Functions.

## Configuración de Entorno

Para ejecutar el proyecto localmente, necesitas configurar las variables de entorno.

### Backend (.env)

Crea o edita el archivo `backend/.env` con las siguientes variables:

```env
# URL de Supabase (Base de datos)
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_KEY

# Mercado Pago (Pagos)
# Obtén tu Access Token en: https://www.mercadopago.com.ar/developers/panel
MP_ACCESS_TOKEN=TEST-TU-ACCESS-TOKEN-AQUI

# URL Base para redirecciones (Local: http://localhost:5173, Producción: https://tu-dominio.vercel.app)
BASE_URL=http://localhost:5173
```

### Frontend (.env.local)

Crea o edita el archivo `app/.env.local` con las claves públicas de Supabase:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Ejecución Local

1. Instalar dependencias en la raíz:
   ```bash
   npm install
   ```

2. Instalar dependencias del frontend:
   ```bash
   cd app && npm install
   ```

3. Instalar dependencias del backend:
   ```bash
   cd backend && npm install
   ```

4. Ejecutar el backend (puerto 3001):
   ```bash
   npm run dev
   ```

5. Ejecutar el frontend (puerto 5173):
   ```bash
   cd app && npm run dev
   ```

## Verificación de Integración de Mercado Pago

Para verificar que las credenciales de Mercado Pago son correctas y la integración funciona:

1. Asegúrate de tener `MP_ACCESS_TOKEN` configurado en `backend/.env`.
2. Ejecuta el script de diagnóstico:
   ```bash
   node backend/scripts/verify-mp.js
   ```

Si el script falla con "invalid access token", genera uno nuevo en el panel de desarrolladores de Mercado Pago.
