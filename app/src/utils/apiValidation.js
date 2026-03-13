export const validatePersonAPI = async (dni) => {
  // Simulación de llamada a API de RENAPER
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulamos que DNI terminados en 0 ya existen
      if (dni.endsWith('0')) {
        resolve({ valid: false, message: 'El DNI ya se encuentra registrado.' });
      } else {
        resolve({ valid: true });
      }
    }, 1000);
  });
};

export const validateAddressAPI = async (zipCode) => {
  // Simulación de API de Correo
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ valid: true, city: 'Localidad Detectada' });
    }, 500);
  });
};
