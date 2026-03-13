
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3001/api';
const LOG_FILE = 'verify_log.txt';

function log(msg) {
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (err) {
        console.error('Error writing to log file:', err);
    }
}

// Helper to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
    fs.writeFileSync(LOG_FILE, '🚀 Iniciando verificación integral de los 5 módulos...\n');
    
    try {
        // --- PRE-CHECK: Ensure Backend is running ---
        try {
            await axios.get(`${API_URL}/health`); // Assuming a health check or simple GET
        } catch (e) {
            log('⚠️ Backend parece no estar respondiendo en /api/health, intentando /api/activities para verificar...');
            try {
                await axios.get(`${API_URL}/activities`);
                log('✅ Backend online.');
            } catch (err) {
                log('❌ Error conectando al backend. Asegúrate de que el servidor esté corriendo en puerto 3001.');
                return;
            }
        }

        // --- MODULE 2: GESTIÓN DOCUMENTAL (Registro de Solicitud con Documentos) ---
        log('\n--- 🧪 PROBANDO MÓDULO 2: Gestión Documental (Solicitud de Ingreso) ---');
        
        // Create dummy image buffer
        const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        
        const docFormData = new FormData();
        // Required fields for membership-requests
        const personalData = {
            firstName: 'TestUser',
            lastName: 'Document',
            dni: '11223344',
            email: 'test.docs@example.com',
            phone: '123456789',
            address: 'Test Address 123',
            birthDate: '1990-01-01',
            medical_cert_date: new Date().toISOString().split('T')[0]
        };

        docFormData.append('type', 'adult');
        docFormData.append('personal_data', JSON.stringify(personalData));
        docFormData.append('recommendations', '[]');
        docFormData.append('signature', JSON.stringify({ method: 'biometric_mobile', timestamp: new Date().toISOString() }));
        
        // Add files
        docFormData.append('photo', dummyImage, { filename: 'profile.png', contentType: 'image/png' });
        docFormData.append('medical_cert', dummyImage, { filename: 'medical.png', contentType: 'image/png' });

        log('Enviando solicitud de ingreso con documentos...');
        try {
            const requestRes = await axios.post(`${API_URL}/membership-requests`, docFormData, {
                headers: { ...docFormData.getHeaders() }
            });
            if (requestRes.status === 201 || requestRes.status === 200) {
                log('✅ Solicitud con documentos enviada exitosamente (Módulo 2 OK)');
            } else {
                throw new Error(`Fallo en solicitud: ${requestRes.status}`);
            }
        } catch (err) {
            log(`❌ Fallo Módulo 2: ${err.message}`);
            if (err.response) log(`   Server says: ${JSON.stringify(err.response.data)}`);
        }

        // --- SETUP: CREAR SOCIO ACTIVO (Para probar Módulos 4 y 1) ---
        log('\n--- 🛠️ SETUP: Creando socio activo para pruebas de Módulos 4 y 1 ---');
        
        const memberPayload = {
            name: 'TestUser Integration',
            email: 'test.integration@example.com',
            phone: '123456789',
            plan: 'Socio Activo',
            payment_method: 'simulated',
            amount: 1000
        };

        log('Creando socio directo...');
        const registerRes = await axios.post(`${API_URL}/members`, memberPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (registerRes.status === 200 || registerRes.status === 201) {
            log('✅ Socio activo creado para pruebas');
        } else {
            throw new Error(`Fallo en creación de socio: ${registerRes.status}`);
        }

        const memberId = registerRes.data.member ? registerRes.data.member.id : registerRes.data.id;
        log(`ID del socio de prueba: ${memberId}`);


        // --- MODULE 4: CARNET DIGITAL (Verificación) ---
        log('\n--- 🧪 PROBANDO MÓDULO 4: Carnet Digital (Endpoint de Verificación) ---');
        
        const verifyRes = await axios.get(`${API_URL}/members/${memberId}/verify`);
        if (verifyRes.status === 200 && verifyRes.data.status === 'active') {
             log('✅ Endpoint de verificación responde correctamente (Módulo 4 OK)');
             log(`   Datos retornados: ${verifyRes.data.name}, Estado: ${verifyRes.data.status}`);
        } else {
            throw new Error('Fallo en verificación de socio');
        }


        // --- MODULE 1: ACTIVIDADES CON COSTO (Registro y Pago) ---
        log('\n--- 🧪 PROBANDO MÓDULO 1: Registro a Actividad y Pago ---');
        
        let activityId;
        const activitiesRes = await axios.get(`${API_URL}/activities`);
        
        if (activitiesRes.data.length > 0) {
            activityId = activitiesRes.data[0].id;
            log(`Usando actividad existente: ${activitiesRes.data[0].name} (ID: ${activityId})`);
        } else {
            log('No hay actividades, intentando crear una (requiere auth admin simulada o bypass)...');
            log('⚠️ No se encontraron actividades. Saltando prueba de registro a actividad.');
        }

        if (activityId) {
            // Register member to activity
            // Endpoint is: /api/activities/:id/register
            log(`Inscribiendo socio ${memberId} a actividad ${activityId}...`);
            try {
                const enrollRes = await axios.post(`${API_URL}/activities/${activityId}/register`, {
                    email: 'test.integration@example.com' // Requires email, not memberId
                });

                if (enrollRes.status === 201) {
                    log('✅ Inscripción creada exitosamente.');
                    const enrollmentId = enrollRes.data.enrollment.id; // Corrected path to id

                    // Simulate Payment
                    log(`Simulando pago para inscripción ${enrollmentId}...`);
                    const paymentRes = await axios.post(`${API_URL}/payments`, { // Corrected endpoint from /payments/process
                        enrollment_id: enrollmentId,
                        amount: 5000,
                        concept: 'Pago Actividad Test',
                        card: '4532123456789012', // Valid Visa start
                        email: 'test.integration@example.com'
                    });

                    if (paymentRes.status === 201 && paymentRes.data.status === 'aprobado') { // 201 Created
                        log('✅ Pago procesado y aprobado (Módulo 1 OK)');
                    } else {
                        log('❌ Fallo en procesamiento de pago');
                    }

                } else {
                    log('❌ Fallo en inscripción a actividad');
                }
            } catch (err) {
                 log(`❌ Error en inscripción: ${err.message}`);
                 if (err.response) log(`   Server says: ${JSON.stringify(err.response.data)}`);
            }
        }


        // --- MODULE 5 & 3: AUTORIZACIÓN DE VIAJE & FIRMA BIOMÉTRICA ---
        log('\n--- 🧪 PROBANDO MÓDULO 5 & 3: Autorización de Viaje y Firmas ---');

        // 1. Create Travel Auth Request (Parent 1 signs immediately)
        // Backend expects { type, data: formData, signatures }
        const formData = {
            memberId: memberId,
            minorName: 'Minor Test',
            minorDni: '99887766',
            destination: 'Mar del Plata',
            startDate: '2025-01-15',
            endDate: '2025-01-20',
            parent1Name: 'Padre Uno',
            parent1Dni: '11111111',
            parent1Email: 'padre@test.com',
            parent2Name: 'Madre Dos',
            parent2Dni: '22222222'
        };

        const signatures = {
            parent1: { signed: true, timestamp: new Date().toISOString(), method: 'biometric_mobile' }
        };

        const authPayload = {
            type: 'travel_auth',
            data: formData,
            signatures: signatures
        };

        log('Creando solicitud de autorización de viaje...');
        const travelRes = await axios.post(`${API_URL}/travel-authorizations`, authPayload);

        if (travelRes.status === 201) {
            log(`✅ Solicitud creada. Estado inicial: ${travelRes.data.status}`);
            const authId = travelRes.data.id;
            
            if (authId) {
                log(`Simulando firma del segundo padre para autorización ${authId}...`);
                // Simulate Parent 2 signing
                // Backend expects { parent2_data, signature }
                const signRes = await axios.post(`${API_URL}/travel-authorizations/${authId}/sign`, {
                    parent2_data: { 
                        name: 'Madre Dos', 
                        dni: '22222222',
                        email: 'madre@test.com'
                    },
                    signature: { 
                        signed: true, 
                        timestamp: new Date().toISOString(), 
                        method: 'biometric_mobile' 
                    }
                });

                if (signRes.status === 200 && signRes.data.status === 'approved') {
                    log('✅ Firma de segundo padre registrada. Estado final: APPROVED (Módulo 3 & 5 OK)');
                } else {
                     log(`❌ Fallo en firma de segundo padre. Estado: ${signRes.data.status}`);
                }
            }

        } else {
            log('❌ Fallo creando autorización de viaje');
        }

        log('\n🎉 VERIFICACIÓN INTEGRAL COMPLETADA.');

    } catch (error) {
        log('\n❌ ERROR CRÍTICO EN VERIFICACIÓN: ' + error.message);
        if (error.response) {
            log('Data: ' + JSON.stringify(error.response.data));
            log('Status: ' + error.response.status);
        }
    }
}

runTests();
