# Plan de Pruebas de Usabilidad: Optimización de Gestión de Noticias y Actividades

## 1. Objetivo
Validar que las optimizaciones implementadas en los módulos de **Noticias** y **Actividades** reduzcan el tiempo de completitud del formulario en al menos un **40%** y mejoren la accesibilidad y experiencia de usuario.

## 2. Mejoras Implementadas
Se han realizado las siguientes mejoras técnicas para alcanzar el objetivo:
1.  **Validación en Tiempo Real**: Feedback inmediato al usuario, eliminando ciclos de envío-error-corrección.
2.  **Auto-scroll Inteligente**: Desplazamiento automático al primer campo con error, reduciendo la carga cognitiva y el tiempo de búsqueda visual.
3.  **Persistencia de Borradores**: Guardado automático en `localStorage` para prevenir pérdida de datos y permitir navegación fluida.
4.  **Indicadores de Progreso**: Visualización clara del avance (Barra de progreso por campos completados).
5.  **Accesibilidad WCAG 2.1**: Atributos ARIA (`aria-invalid`, `aria-describedby`, `role="alert"`) para soporte de tecnologías de asistencia.
6.  **Modal Optimizado**: Scroll interno mejorado y cabeceras/pies fijos (sticky) para mantener el contexto de acción.

## 3. Metodología de Prueba (A/B Testing Simulado)

### Participantes
-   **Perfil**: Administradores del sistema con experiencia variada (novatos y expertos).
-   **Cantidad**: Mínimo 5 usuarios.

### Escenario de Prueba
**Tarea**: Crear una nueva "Actividad" con los siguientes datos:
-   **Título**: "Torneo de Verano 2024"
-   **Fecha**: 15/01/2025
-   **Hora**: 14:00
-   **Ubicación**: "Cancha Principal"
-   **Precio**: 5000
-   **Cupo**: 20
-   **Descripción**: "Torneo anual de fútbol 5 para socios."
-   **Imagen**: (Opcional, omitir para la prueba de velocidad)

### Procedimiento
1.  **Fase A (Control - Versión Anterior/Estimada)**:
    *   Medir tiempo desde clic en "Nueva Actividad" hasta "Guardar" exitoso.
    *   Simular errores comunes (olvidar campo fecha, precio negativo).
    *   *Tiempo Promedio Estimado (Línea Base)*: **120 segundos**.

2.  **Fase B (Experimental - Versión Optimizada)**:
    *   Medir tiempo con las nuevas ayudas visuales y validación en tiempo real.
    *   Provocar un error intencional y medir tiempo de corrección con auto-scroll.
    *   Navegar fuera del formulario y volver para verificar recuperación de borrador.
    *   *Tiempo Objetivo (Meta -40%)*: **< 72 segundos**.

## 4. Criterios de Éxito
| Métrica | Valor Esperado |
| :--- | :--- |
| **Tiempo de Completitud** | Reducción ≥ 40% (vs Línea Base) |
| **Tasa de Errores al Enviar** | < 10% (gracias a validación real-time) |
| **Recuperación de Datos** | 100% de éxito al recargar/volver |
| **Accesibilidad** | 0 errores críticos en auditoría automática (Lighthouse/Axe) |

## 5. Ejecución de Prueba Técnica (Verificación)
Para validar técnicamente la implementación sin usuarios reales, ejecute los siguientes pasos:

1.  **Verificar Auto-scroll**:
    *   Abrir modal de "Nueva Actividad".
    *   Dejar todos los campos vacíos.
    *   Clic en "Guardar".
    *   *Resultado*: El scroll debe subir suavemente y enfocar el campo "Título".

2.  **Verificar Persistencia**:
    *   Llenar "Título" y "Descripción".
    *   Cerrar el modal (Clic en X o Cancelar).
    *   Volver a abrir "Nueva Actividad".
    *   *Resultado*: Los campos deben mantener los valores ingresados.

3.  **Verificar Progreso**:
    *   Llenar campos uno a uno.
    *   *Resultado*: La barra de progreso debe aumentar proporcionalmente.

4.  **Verificar Accesibilidad**:
    *   Inspeccionar elemento de input con error.
    *   *Resultado*: Debe tener `aria-invalid="true"` y `aria-describedby` apuntando al ID del mensaje de error.
