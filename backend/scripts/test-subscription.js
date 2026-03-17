import fetch from 'node-fetch';

const API_URL = 'http://localhost:3003/api';

async function testSubscriptionFlow() {
    console.log('🚀 Iniciando prueba de flujo de suscripción...');

    // 1. Crear usuario de prueba
    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        dni: Math.floor(Math.random() * 100000000).toString(),
        phone: '1122334455',
        role: 'user'
    };

    console.log('👤 Creando usuario de prueba:', testUser.email);
    
    // Simulamos FormData
    // Nota: En nodejs sin dependencias extras es complejo simular FormData con archivos
    // Vamos a asumir que el backend permite JSON o que usamos un usuario existente para la prueba de suscripción
    // O mejor, llamamos directo al endpoint de suscripción asumiendo que el usuario ya existe en la DB en memoria (si corremos esto después de un reinicio, fallará si no creamos el usuario primero)

    // Para simplificar, vamos a inyectar el usuario en la DB primero o usar el endpoint de registro si soporta JSON (el actual usa multer, así que espera multipart)
    // Vamos a intentar llamar a /api/payment/subscribe directamente con un email que sepamos que existe o crear uno via DB injection si pudiéramos
    
    // Como no podemos inyectar fácil sin reiniciar, vamos a probar el endpoint de suscripción con un email random y esperar error 404 (lo cual valida que el endpoint responde)
    // O mejor, si el backend tiene un usuario seed (vitalicio@italia90.club), usemos ese.
    
    const seedEmail = 'vitalicio@italia90.club';
    console.log(`💳 Intentando crear suscripción para ${seedEmail}...`);

    try {
        const res = await fetch(`${API_URL}/payment/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: seedEmail,
                amount: 12000,
                reason: 'Test Subscription'
            })
        });

        if (res.ok) {
            const data = await res.json();
            console.log('✅ Suscripción creada exitosamente!');
            console.log('🔗 Link de pago (init_point):', data.init_point);
            console.log('🆔 ID de preapproval:', data.id);
        } else {
            const err = await res.json();
            console.error('❌ Error al crear suscripción:', err);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

testSubscriptionFlow();
