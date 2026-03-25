# Sistema de Diseño – Portal de Usuario

## Paleta y Tipografía
- Colores principales: Azul #070571, Rojo #f42b29, Verde #049756 (<mccoremem id="03fotxhxv7i44969s6nfrrp4p" />).
- Neutros: Gris oscuro #0f172a, Gris medio #64748b, Gris claro #e2e8f0, Fondo #ffffff.
- Tipografía: Garet (preferida), fallback Inter/SF/Segoe. Mantener peso 600–800 para títulos.

## Tokens
- Radios: xs 6, sm 12, md 16, lg 24, xl 32.
- Sombras: s 0 4px 8px rgba(2,6,23,0.08); m 0 8px 20px rgba(2,6,23,0.12); l 0 20px 40px rgba(7,5,113,0.15).
- Espaciado: 8, 12, 16, 24, 32.
- Transiciones: ease-out 200–300ms en hover/press.

## Componentes
- Botón primario: sólido azul, radio md, sombra m, texto blanco 700; estado hover sombra l, press translateY(-2).
- Botón outline: borde 2px gris claro, radio md, sombra s; hover sombra m.
- Botón icono: círculo, fondo blanco, sombra m; usar íconos vectoriales (Lucide).
- Card: fondo blanco, radio lg, padding 24, borde 1px gris claro, sombra s→m en hover.
- Tiles rápidos: 46% ancho, radio md, borde claro, contenido con icono en recuadro y etiqueta 600.

## Iconografía
- Reemplazar emojis por íconos vectoriales de calidad (Lucide) en tabs, acciones y listas.
- Referencias visuales (Freepik):
  - Modern UI Buttons: https://www.freepik.com/free-photos-vectors/modern-ui-buttons
  - UI Button: https://www.freepik.com/free-photos-vectors/ui-button
  - Web Shadows: https://www.freepik.com/free-photos-vectors/web-shadows

## Responsive
- Breakpoints: móvil <768, desktop ≥1024; ajustar columnas y tamaños de fuente/espacio.
- Accesibilidad: mantener targets ≥44px, contraste AA, roles y labels adecuados.

## Microinteracciones
- Hover: aumentar sombra y ligera elevación en botones/cards.
- Press: reducir escala mínima o desplazar -2px para feedback táctil.

## Integración de recursos
- Ubicación: /public/assets/ui/ (botones, sombras, íconos decorativos opcionales).
- Formato: SVG/PNG optimizados; tamaños 1x/2x.

## Validación (Testing de Usuario)
- Método: test moderado de 5–8 usuarios con tareas clave (ver carnet, inscribirse, consultar pagos).
- Medidas: éxito de tareas, tiempo, confianza percibida, claridad visual.
- Recoger feedback sobre autenticidad, profesionalismo y usabilidad.
