# Documentación de Validaciones, Autocompletado y Responsividad

Este documento describe las validaciones dinámicas, el sistema de autocompletado y las mejoras de responsividad implementadas en el formulario de registro.

## 1. Validación Dinámica de Email y DNI

### Funcionalidad
- **Validación Asíncrona con Debounce**: Se verifica la existencia del email y DNI en la base de datos backend.
- **Debounce**: La verificación se ejecuta 800ms después de que el usuario deja de escribir, evitando llamadas innecesarias al servidor.
- **Limpieza de Errores**: Al modificar el campo, el mensaje de error anterior se limpia inmediatamente (`updateField`), permitiendo al usuario corregir sin distracciones visuales hasta la nueva validación.
- **Mensajes Específicos**: Se muestra el error específico para el campo correspondiente (Email o DNI) si ya existe en el sistema.

### Implementación
- Archivo: `src/auth/Register.jsx`
- Hooks: `useEffect` con `setTimeout` para el debounce.
- Estado: `validationErrors` (objeto) para errores por campo, `isChecking` (boolean) para estado de carga.
- Función: `checkDuplicate` realiza la llamada al endpoint `/api/auth/check-duplicate`.

## 2. Autocompletado de Localidades y Responsividad

### Componente: `AutocompleteSelect`
- **Ubicación**: `src/components/AutocompleteSelect.jsx`
- **Mejoras de Responsividad**:
  - **Detección de Dispositivo**: Utiliza `useWindowDimensions` para determinar si el usuario está en un dispositivo móvil (< 768px).
  - **Modal en Móviles**: En pantallas pequeñas, el selector se abre en un **Modal a pantalla completa** para maximizar el espacio y evitar problemas de superposición con el teclado o elementos adyacentes.
  - **Dropdown en Escritorio**: En pantallas grandes, se mantiene el comportamiento de lista desplegable (`absolute`) con `zIndex` alto para flotar sobre otros elementos.
- **Características Generales**:
  - **Búsqueda Filtrada**: Filtra las opciones basadas en el texto ingresado.
  - **Agrupación**: Muestra las localidades agrupadas por provincia (CABA / Buenos Aires).
  - **Navegación por Teclado (Escritorio)**: Soporta `ArrowDown`, `ArrowUp` y `Enter`.
  - **Optimización**: Uso de `FlatList` en el modal móvil para manejar grandes listas de localidades con alto rendimiento.
  - **Accesibilidad**: Etiquetas claras, botones de cierre accesibles y manejo de foco.

### Datos Geográficos
- Archivo: `src/utils/geoData.js`
- Contenido: Listado completo de 48 barrios de CABA y 70+ localidades de GBA/PBA.
- Estructura: Array de provincias con `id`, `name` y `cities` (array de strings).
- Transformación: Se aplana la estructura en `Register.jsx` usando `useMemo` para alimentar el componente de autocompletado.

## 3. Diseño Responsivo del Formulario

### Implementación en `Register.jsx`
- **Layout Fluido**: Se reemplazaron las filas fijas (`flexDirection: 'row'`) por un sistema dinámico que cambia a columna (`flexDirection: 'column'`) en dispositivos móviles.
- **Variables de Estilo Dinámicas**:
  - `responsiveRow`: Cambia de fila a columna en móvil.
  - `responsiveCol`: Ajusta el ancho al 100% en móvil.
  - `responsiveUploadGrid`: Apila los botones de subida de archivos verticalmente en móvil.
  - `responsivePaymentMethods`: Apila los métodos de pago verticalmente si es necesario.
- **Prevención de Superposición**: Gracias al cambio de layout y al uso del Modal para el autocompletado, se eliminan los problemas de elementos solapados o cortados en pantallas pequeñas.

## 4. Pruebas y Casos de Uso

### Casos Probados
1.  **Usuario ingresa email duplicado**:
    - El sistema espera 800ms.
    - Muestra error "El correo electrónico ya está registrado".
    - Usuario corrige email -> El error desaparece inmediatamente.
2.  **Usuario busca localidad (Móvil)**:
    - Toca el campo de localidad.
    - Se abre un Modal con buscador enfocado automáticamente.
    - Escribe y selecciona de la lista desplazable.
    - Al seleccionar, el Modal se cierra y el valor se refleja en el formulario.
3.  **Usuario busca localidad (Escritorio)**:
    - Escribe en el campo.
    - Aparece lista desplegable flotante.
    - Navega con teclado y selecciona.
4.  **Usuario deja campo vacío**:
    - Al intentar avanzar, se muestra error "Requerido" o "Seleccione localidad".
5.  **Visualización en Móvil**:
    - Los campos de Nombre/Apellido se muestran uno debajo del otro.
    - Los botones de carga de archivos (DNI/Foto) se apilan verticalmente, facilitando el toque.

## 5. Requisitos Técnicos Cumplidos
- **Debouncing**: Implementado (800ms).
- **Limpieza de errores**: Implementada en `updateField`.
- **Consistencia Visual**: Estilos alineados con el diseño existente.
- **Accesibilidad**: Roles ARIA y soporte de teclado.
- **Responsividad Total**: Adaptación completa a móviles y escritorio sin superposiciones.
