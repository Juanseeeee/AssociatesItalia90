# Documentación Técnica: Sistema de Pagos y Suscripciones (Mercado Pago)

## Descripción General
Este módulo implementa un sistema de pagos recurrentes utilizando la API de **PreApproval (Suscripciones)** de Mercado Pago. Permite a los usuarios suscribirse mensualmente al club, gestionando automáticamente los débitos de tarjetas de crédito/débito o saldo en cuenta.

## Flujo de Pago
1. **Frontend (`Register.jsx`)**:
   - El usuario selecciona "Mercado Pago" o "Tarjeta de Crédito/Débito".
   - Se registra el usuario en la base de datos con estado `pending_payment`.
   - Se llama al endpoint `POST /api/payment/subscribe` con el email del usuario.
   - El backend crea una preferencia de suscripción (PreApproval) y devuelve un `init_point`.
   - El frontend redirige al usuario a la pasarela segura de Mercado Pago.

2. **Backend (`paymentController.js`)**:
   - Valida que el usuario exista.
   - Crea un objeto `PreApproval` con:
     - Frecuencia: 1 mes (`frequency: 1, frequency_type: 'months'`).
     - Monto: Configurable (default $12.000 ARS).
     - `external_reference`: ID del usuario (clave para vincular el pago).
     - `back_url`: URL de retorno al dashboard del usuario.
   - Devuelve el `init_point` (URL de pago).

3. **Confirmación (Webhooks)**:
   - Mercado Pago notifica al endpoint `POST /api/payment/webhook` cuando cambia el estado de la suscripción o se acredita un pago.
   - El backend verifica el `topic` (`preapproval` o `payment`).
   - Si el estado es `authorized` o `approved`:
     - Busca al usuario por `external_reference`.
     - Actualiza su estado a `active`.
     - Registra el pago en el historial (`db.payments`).
     - Extiende la fecha de vencimiento de la membresía.

## Configuración
### Variables de Entorno (`.env`)
Crear un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
PORT=3001
# Token de acceso de producción o prueba (Sandbox) de Mercado Pago
MP_ACCESS_TOKEN=TEST-8266203530397333-102513-5a401275213670603704812674313626-179373979
# URL del frontend para redirección post-pago
CLIENT_URL=http://localhost:5173/dashboard
# Clave secreta para JWT
JWT_SECRET=tu_secreto_seguro
```

### Requisitos Previos
- Cuenta de Mercado Pago Developers.
- Aplicación creada en MP Developers para obtener `Access Token`.
- Configurar URL de Webhook en el panel de MP apuntando a `https://tu-dominio.com/api/payment/webhook` (para pruebas locales usar Ngrok).

## Testing
### Pruebas Manuales (Sandbox)
1. Usar tarjetas de prueba de Mercado Pago:
   - Visa: `4509 9500 0000 0000` (Cualquier fecha futura, CVV 123).
   - Email del pagador: Debe ser diferente al email de la cuenta de vendedor (crear usuario de prueba en MP Developers).

### Script de Prueba
Ejecutar el script de prueba para verificar la creación de preferencias:
```bash
node scripts/test-subscription.js
```

## Seguridad (PCI DSS)
El sistema cumple con PCI DSS al **no procesar ni almacenar datos de tarjetas** en nuestros servidores. Toda la información sensible se ingresa exclusivamente en el formulario seguro de Mercado Pago (Checkout Pro / Suscripciones), delegando la responsabilidad de cumplimiento a la plataforma de pagos.

## Manejo de Errores y Edge Cases
- **Pagos Rechazados**: El webhook no activará al usuario. El usuario permanecerá como `pending_payment` hasta que regularice su situación.
- **Reintentos**: Mercado Pago gestiona automáticamente los reintentos de cobro según su configuración de Smart Retry.
- **Cancelaciones**: Si el usuario cancela la suscripción en MP, el webhook notificará (estado `cancelled`) y el sistema podrá desactivar la membresía al finalizar el período pago.
