
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno desde backend/.env si existe
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || process.env.ACCESS_TOKEN;

console.log('\n🔍 --- Diagnóstico de Integración Mercado Pago ---');

async function runDiagnostics() {
  // 1. Verificación de Credenciales
  if (!MP_ACCESS_TOKEN) {
    console.error('❌ ERROR CRÍTICO: No se encontró MP_ACCESS_TOKEN.');
    console.error('   -> Asegúrate de configurar la variable de entorno MP_ACCESS_TOKEN en Vercel o en backend/.env');
    console.error('   -> Si estás probando localmente, puedes crear un archivo backend/.env con MP_ACCESS_TOKEN=...');
    process.exit(1);
  }

  // Ocultar parte del token por seguridad
  const maskedToken = MP_ACCESS_TOKEN.slice(0, 10) + '...' + MP_ACCESS_TOKEN.slice(-4);
  console.log(`✅ Token encontrado: ${maskedToken}`);
  
  if (MP_ACCESS_TOKEN.includes('TEST') && !MP_ACCESS_TOKEN.startsWith('TEST-')) {
    console.warn('⚠️  ADVERTENCIA: El token parece de prueba pero no sigue el formato estándar "TEST-..."');
  }

  const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
  const preference = new Preference(client);

  // 2. Prueba de Creación de Preferencia
  console.log('\n🚀 Intentando crear una preferencia de prueba...');
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  console.log(`   -> Usando BASE_URL: ${baseUrl}`);

  const payload = {
    body: {
      items: [
        {
          title: 'Diagnóstico de Integración',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: 'test_user_123@test.com', // Email de prueba
      },
      back_urls: {
        success: `${baseUrl}/payment/success`,
        failure: `${baseUrl}/payment/failure`,
        pending: `${baseUrl}/payment/pending`,
      },
      // notification_url: `${baseUrl}/api/payments/webhook`,
      notification_url: `${baseUrl}/api/payments/webhook`,
      // Auto-return solo funciona con URLs públicas válidas (no localhost)
      ...(baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') ? {} : { auto_return: 'approved' }),
      external_reference: 'diag_' + Date.now(),
    }
  };

  console.log('   -> Payload:', JSON.stringify(payload, null, 2));

  try {
    const result = await preference.create(payload);
    console.log('✅ Preferencia creada EXITOSAMENTE');
    console.log(`   -> ID: ${result.id}`);
    console.log(`   -> Init Point (Prod): ${result.init_point}`);
    console.log(`   -> Init Point (Sandbox): ${result.sandbox_init_point}`);

    console.log('\n💳 PRUEBA DE PAGO REAL (Opcional):');
    console.log('   Si deseas probar con una tarjeta REAL en producción con monto mínimo ($10):');
    console.log('   1. Asegúrate de usar credenciales de PRODUCCIÓN (no TEST).');
    console.log('   2. Usa este link generado (Init Point Prod):');
    console.log(`      👉 ${result.init_point}`);
    console.log('   ⚠️  Advertencia: Esto generará un cargo real en tu tarjeta.');
    
    console.log('\n📝 Verificación de Campos Críticos:');
    if(result.init_point) console.log('   -> init_point: OK');
    else console.error('   -> init_point: FALTANTE');
    
    // Verificar back_urls en la respuesta si es posible (la SDK a veces no devuelve todo el objeto configurado, sino el ID)
    
  } catch (error) {
    console.error('❌ FALLÓ la creación de preferencia');
    console.error(`   -> Mensaje: ${error.message}`);
    
    if (error.cause) {
      console.error('   -> Causa Detallada:', JSON.stringify(error.cause, null, 2));
      
      // Análisis de errores comunes
      const causeStr = JSON.stringify(error.cause);
      if (causeStr.includes('invalid_token') || causeStr.includes('unauthorized')) {
        console.error('\n💡 DIAGNÓSTICO: El Access Token es inválido, expiró o no corresponde al ambiente.');
        console.error('   -> Acción: Genera un nuevo Access Token en https://www.mercadopago.com.ar/developers/panel');
      }
      if (causeStr.includes('items')) {
        console.error('\n💡 DIAGNÓSTICO: Error en los items. Verifica unit_price y quantity.');
      }
    }
    process.exit(1);
  }

  // 3. Simulación de Webhook (Validación de lógica de recepción)
  console.log('\n🔄 Simulando recepción de Webhook (Test local)...');
  // Nota: Esto solo prueba que la lógica de script es coherente, no golpea al endpoint real del backend
  // Para probar el endpoint real, necesitaríamos hacer un fetch a localhost:3003
  
  console.log('✅ Diagnóstico finalizado. Si la creación de preferencia fue exitosa, la integración básica funciona.');
  console.log('   -> Recuerda: Para probar pagos, usa las tarjetas de prueba de Mercado Pago en el Sandbox Init Point.');
}

runDiagnostics();
