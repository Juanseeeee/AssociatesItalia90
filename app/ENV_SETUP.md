# Configuración de Variables de Entorno y Despliegue

Este documento detalla el proceso de configuración de variables de entorno para la aplicación, asegurando una correcta migración de entornos de desarrollo a producción.

## Estructura de Archivos de Entorno

La aplicación utiliza archivos `.env` para gestionar variables de configuración dependientes del entorno.

### Archivos Disponibles

1.  **`.env.development`**: Configuración para el entorno de desarrollo local.
    ```env
    VITE_API_URL=http://localhost:3003/api
    ```

2.  **`.env.production`**: Configuración para el entorno de producción.
    ```env
    VITE_API_URL=https://api.italia90.com.ar/api
    ```

## Centralización de la Configuración

Para evitar referencias hardcodeadas dispersas en el código, se ha creado un archivo central de configuración en:

`src/config/api.js`

```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';
```

Todas las llamadas a la API deben importar `API_URL` desde este archivo en lugar de usar `import.meta.env.VITE_API_URL` directamente o cadenas de texto fijas.

### Ejemplo de Uso

**Incorrecto:**
```javascript
fetch('http://localhost:3003/api/users')
```

**Correcto:**
```javascript
import { API_URL } from '../config/api';

fetch(`${API_URL}/users`)
```

## Proceso de Build y Despliegue

Vite selecciona automáticamente el archivo `.env` correspondiente según el modo de ejecución.

### Desarrollo Local
Al ejecutar `npm run dev`, Vite carga `.env.development`.
La aplicación apuntará a `http://localhost:3003/api`.

### Producción
Al ejecutar `npm run build`, Vite carga `.env.production`.
La aplicación compilada apuntará a `https://api.italia90.com.ar/api`.

**Pasos para desplegar:**

1.  Asegúrate de que el archivo `.env.production` tenga la URL correcta del backend productivo.
2.  Ejecuta el comando de construcción:
    ```bash
    npm run build
    ```
3.  Sube el contenido de la carpeta `dist/` a tu servidor de hosting.

## Verificación

Para verificar que la configuración es correcta antes de desplegar:

1.  Ejecuta `npm run build`.
2.  Ejecuta `npm run preview` para servir la versión de producción localmente.
3.  Abre la aplicación en el navegador y verifica en la pestaña "Network" de las herramientas de desarrollo que las peticiones se dirijan a la URL de producción configurada.
