Configuración de Supabase (híbrido)

1) Crear proyecto en Supabase y obtener:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (clave de servicio)

2) Variables de entorno
- Copiar .env.example a .env y completar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_REQUIRE_ADMIN=true para exigir JWT de Supabase en rutas de administración (POST/PUT/DELETE de noticias/actividades/servicios)

3) Crear tablas y políticas
- Abrir el SQL editor de Supabase y ejecutar el archivo supabase_schema.sql
- Insertar tu usuario como admin:
  insert into public.admins (user_id, role, enabled) values ('<UUID de tu usuario>', 'admin', true);

4) (Opcional) Storage para imágenes
- Crear buckets: news-images y activities-images
- Hacerlos públicos o generar URLs firmadas; si son públicos, configurar políticas de subida sólo autenticada
- El front sube la imagen y guarda la URL pública en la tabla correspondiente

5) Autenticación admin
- El backend acepta Authorization: Bearer <JWT de Supabase> si SUPABASE_REQUIRE_ADMIN=true
- Para obtener el token en el front, autenticarse con Supabase Auth y enviar el access_token en cada request de administración.

6) Fallback local
- Si no definís SUPABASE_URL/KEY, el backend usa los datos en memoria y las rutas quedan abiertas (modo desarrollo).

7) Endpoints relevantes
- Noticias: GET /api/news | POST /api/news | PUT /api/news/:id | DELETE /api/news/:id
- Actividades: GET /api/activities | POST /api/activities | PUT /api/activities/:id | DELETE /api/activities/:id
- Socios/Pagos: POST /api/memberships | POST /api/payments | GET /api/payments/by-email

8) Notas
- Claves service_role ignoran RLS; no exponerlas en el front.
- Para panel admin con login, integrar supabase-js en el front y enviar JWT.
