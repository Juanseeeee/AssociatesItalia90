export const provinces = [
  { 
    id: 'CABA', 
    name: 'Ciudad Autónoma de Buenos Aires', 
    cities: [
      'Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 
      'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta', 
      'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat', 
      'Nueva Pompeya', 'Nuñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 
      'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 
      'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sársfield', 
      'Versalles', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre', 
      'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón', 'Villa Real', 
      'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza'
    ] 
  },
  { 
    id: 'BA', 
    name: 'Buenos Aires', 
    cities: [
      'Adrogué', 'Agustín Roca', 'Agustina', 'Arribeños', 'Ascensión', 'Avellaneda', 'Azul', 
      'Bahía Blanca', 'Baigorrita', 'Banfield', 'Beccar', 'Berazategui', 'Berisso', 'Bernal', 
      'Burzaco', 'Campana', 'Cañuelas', 'Castelar', 'Caseros', 'Chacabuco', 'Chivilcoy', 
      'Ciudadela', 'City Bell', 'Colón', 'Dolores', 'Don Torcuato', 'El Palomar', 'Ensenada', 
      'Escobar', 'Estación Arenales', 'Ezeiza', 'Ferré', 'Florencio Varela', 'Fortín Tiburcio', 
      'General Arenales', 'General Pacheco', 'General Rodríguez', 'Gerli', 'Gonnet', 'Grand Bourg', 
      'Haedo', 'Hurlingham', 'Ituzaingó', 'José C. Paz', 'Junín', 'La Angelita', 'Laferrere', 
      'La Plata', 'Lanús', 'Laplacette', 'Lincoln', 'Llavallol', 'Lomas de Zamora', 'Luján', 
      'Malvinas Argentinas', 'Mar del Plata', 'Martínez', 'Merlo', 'Monte Chingolo', 'Monte Grande', 
      'Morón', 'Morse', 'Munro', 'Necochea', 'Olivos', 'Olavarría', 'Pergamino', 'Pilar', 'Pinamar', 
      'Quilmes', 'Ramos Mejía', 'Ranelagh', 'Remedios de Escalada', 'Rojas', 'Saforcada', 'Salto', 
      'San Antonio de Padua', 'San Fernando', 'San Isidro', 'San Justo', 'San Martín', 'San Miguel', 
      'San Nicolás de los Arroyos', 'San Pedro', 'San Vicente', 'Sarandí', 'Tandil', 'Tapiales', 
      'Temperley', 'Tigre', 'Tolosa', 'Tres de Febrero', 'Vedia', 'Vicente López', 'Villa Ballester', 
      'Villa Celina', 'Villa Dominico', 'Villa Elisa', 'Villa Gesell', 'Villa Insuperable', 
      'Villa Luzuriaga', 'Villa Martelli', 'Wilde', 'Zárate'
    ] 
  },
  { id: 'CBA', name: 'Córdoba', cities: ['Córdoba Capital', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'Alta Gracia'] },
  { id: 'SF', name: 'Santa Fe', cities: ['Rosario', 'Santa Fe Capital', 'Rafaela', 'Venado Tuerto', 'Reconquista'] },
  { id: 'MZA', name: 'Mendoza', cities: ['Mendoza Capital', 'San Rafael', 'Godoy Cruz', 'Guaymallén', 'Maipú'] },
];

export const getCities = (provId) => {
  const prov = provinces.find(p => p.id === provId);
  return prov ? prov.cities.sort() : [];
};
