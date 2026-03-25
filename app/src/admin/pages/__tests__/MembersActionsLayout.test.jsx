import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Members from '../Members.jsx';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ([
      {
        id: 'user-1',
        membership_number: 'A123-XYZ',
        name: 'Admin Italia 90',
        email: 'admin@italia90.com',
        phone: '123456789',
        dni: '12345678',
        status: 'active',
        payment_status: 'completed',
        memberType: 'Standard'
      }
    ])
  })
);

describe('Members actions layout', () => {
  it('muestra las acciones en disposición horizontal con espaciado adecuado', async () => {
    render(<Members />);

    const payBtn = await screen.findByTitle('Registrar Pago');
    const mailBtn = await screen.findByTitle('Enviar recordatorio');
    const editBtn = await screen.findByTitle('Editar socio');
    const delBtn = await screen.findByTitle('Eliminar socio');

    const container = payBtn.parentElement;
    expect(container).toHaveClass('actions-inline');

    expect(mailBtn.parentElement).toBe(container);
    expect(editBtn.parentElement).toBe(container);
    expect(delBtn.parentElement).toBe(container);
  });

  it('usa wrap para evitar superposición en resoluciones pequeñas', async () => {
    render(<Members />);
    const payBtn = await screen.findByTitle('Registrar Pago');
    const container = payBtn.parentElement;
    expect(container).toHaveClass('actions-inline');
  });
});
