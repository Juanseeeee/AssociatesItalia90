import { nanoid } from 'nanoid';

// In-memory Database shared instance
export const db = {
  users: [],
  activities: [
    { id: 'futbol', name: 'Fútbol 5', slots: 24, cost: 5000, schedule: 'Lun-Mie 19hs', description: 'Torneo interno y alquiler de canchas.', image: '/assets/escuelita-1.jpg' },
    { id: 'tenis', name: 'Tenis', slots: 12, cost: 8000, schedule: 'Mar-Jue 18hs', description: 'Clases grupales e individuales.', image: '/assets/deportes-1.jpg' },
    { id: 'natacion', name: 'Natación', slots: 30, cost: 7500, schedule: 'Lun-Vie 08-20hs', description: 'Pileta climatizada libre y con profesor.', image: '/assets/escuelita-4.jpg' },
    { id: 'yoga', name: 'Yoga', slots: 20, cost: 4000, schedule: 'Mar-Jue 10hs', description: 'Hatha Yoga y meditación.', image: '/assets/hero-campania2.jpeg' },
    { id: 'basquet', name: 'Básquet', slots: 25, cost: 4500, schedule: 'Lun-Mie-Vie 18hs', description: 'Escuela formativa y primera división.', image: '/assets/cancha-interna-1.jpg' }
  ],
  memberships: [],
  payments: [],
  enrollments: [],
  news: [
    { id: nanoid(), title: 'Italia 90 presenta su campaña de socios 2026', excerpt: 'Beneficios exclusivos, actividades y más.', image: '' },
    { id: nanoid(), title: 'Nuevo torneo de fútbol 5', excerpt: 'Inscripciones abiertas para equipos.', image: '' },
    { id: nanoid(), title: 'Clínica de tenis con profesores invitados', excerpt: 'Turnos limitados.', image: '' },
  ],
  services: [
    { id: nanoid(), name: 'Gimnasio', description: 'Salas equipadas y clases guiadas.', category: 'Fitness' },
    { id: nanoid(), name: 'Natación', description: 'Piscina climatizada, clases para todas las edades.', category: 'Acuáticos' },
    { id: nanoid(), name: 'Tenis', description: 'Canchas y escuela de tenis.', category: 'Racket' },
    { id: nanoid(), name: 'Fútbol 5', description: 'Alquiler de canchas y torneos.', category: 'Fútbol' },
    { id: nanoid(), name: 'Yoga', description: 'Clases de bienestar y relajación.', category: 'Bienestar' },
    { id: nanoid(), name: 'Colonia de Vacaciones', description: 'Actividades para niños en temporada.', category: 'Infantil' }
  ],
  audit_logs: [],
  travel_authorizations: [],
  membership_requests: [],
  fixtures: [
    { id: nanoid(), sport: 'Fútbol', opponent: 'Club Atlético Centro', date: new Date().toISOString(), venue: 'Complejo Italia 90' },
    { id: nanoid(), sport: 'Tenis', opponent: 'Escuela Municipal', date: new Date(Date.now()+86400000).toISOString(), venue: 'Cancha 2' },
  ]
};

// Seed inicial
db.memberships.push(
  { id: nanoid(), name: 'Socio Vitalicio', dni: '10000000', email: 'vitalicio@italia90.club', phone: '', plan: 'vitalicio', price: 0, memberType: 'vitalicio', rights: { political: true, activities: true }, paysFee: true, joinedAt: Date.now()-86400000*365*30 },
  { id: nanoid(), name: 'Socio Honorario', dni: '20000000', email: 'honorario@italia90.club', phone: '', plan: 'honorario', price: 0, memberType: 'honorario', rights: { political: false, activities: true }, paysFee: false, joinedAt: Date.now()-86400000*100 }
);
