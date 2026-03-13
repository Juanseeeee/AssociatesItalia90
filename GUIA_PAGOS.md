# Guía de Gestión de Pagos: Mercado Pago y Santander

Esta guía explica cómo configurar y probar el flujo de pagos, desde la recaudación en Mercado Pago hasta la transferencia final a tu cuenta de Banco Santander.

## 1. Flujo de Pagos (Cómo funciona)

Actualmente, el sistema utiliza **Mercado Pago Checkout Pro**. Esto significa:

1.  El usuario hace clic en "Pagar con Mercado Pago" en la web.
2.  Es redirigido a una página segura de Mercado Pago.
3.  Elige su medio de pago: **Tarjeta de Crédito/Débito**, Efectivo (Rapipago/Pago Fácil) o Dinero en Cuenta.
4.  Mercado Pago procesa el cobro y valida la seguridad.
5.  El dinero se acredita en tu cuenta de Mercado Pago.
6.  Desde tu cuenta de Mercado Pago, transfieres el dinero a tu cuenta bancaria (Santander).

> **Nota importante**: No es posible transferir directamente desde la tarjeta del cliente a Santander sin pasar por un procesador (Mercado Pago). Mercado Pago actúa como intermediario recaudador.

---

## 2. Configuración de Cuenta Santander (Retiro de Fondos)

Para que el dinero recaudado llegue a tu cuenta Santander, debes configurarlo en el panel de Mercado Pago:

1.  Ingresa a tu cuenta de Mercado Pago (desde la web o app).
2.  Ve a la sección **"Tu Perfil"** o **"Configuración"**.
3.  Busca la opción **"Cuentas bancarias"** o **"Retiro de dinero"**.
4.  Agrega una nueva cuenta bancaria ingresando el **CBU / CVU** de tu cuenta Santander.
5.  Mercado Pago verificará que el titular de la cuenta bancaria coincida con el titular de la cuenta de Mercado Pago (por seguridad).

Una vez configurado, podrás retirar el dinero manualmente o configurar retiros automáticos (dependiendo del nivel de tu cuenta MP).

---

## 3. Pruebas de Pago (Testing)

### A. Entorno de Pruebas (Sandbox) - Sin dinero real
Para verificar que el sistema funciona sin gastar dinero:
1.  Asegúrate de usar credenciales de prueba (`TEST-....`) en el archivo `.env`.
2.  En la web, inicia el flujo de pago.
3.  En el Checkout de Mercado Pago, usa una **Tarjeta de Prueba**:
    - **Número**: `4509 9535 6623 3704` (Visa)
    - **Vencimiento**: Cualquier fecha futura (ej. 11/2030)
    - **CVV**: `123`
    - **Titular**: `APRO`
4.  El pago se aprobará automáticamente.

### B. Entorno de Producción - Dinero Real
Para probar con una tarjeta real y verificar que el dinero llega:
1.  Cambia las credenciales en `.env` por tus **Credenciales de Producción** (`APP_USR-...` o similar, NO deben empezar con `TEST-`).
2.  Reinicia el servidor (`npm run dev`).
3.  Realiza un pago en la web con tu tarjeta real.
    - *Recomendación*: Crea un producto/membresía de prueba de valor bajo ($10 o $100 ARS) para probar.
4.  Verifica que el dinero aparezca en tu cuenta de Mercado Pago.
5.  Verifica que el estado del socio en la web cambie a "Activo".

---

## 4. Solución de Problemas Comunes

- **Error "Invalid Access Token"**: Verifica que el token en `.env` sea correcto y corresponda al entorno (Test o Prod) que quieres usar.
- **Error de Conexión Local**: Asegúrate de que tanto el Frontend (`npm run dev` en `/app`) como el Backend (`npm run dev` en raíz) estén corriendo.
- **Retorno Automático no funciona en Local**: Mercado Pago requiere URLs públicas (https://...) para el retorno automático. En `localhost`, deberás hacer clic en "Volver al sitio" manualmente al finalizar el pago. Esto funcionará automáticamente cuando subas la web a Vercel.
