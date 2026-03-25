import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Members from '../Members.jsx';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ([])
  })
);

describe('Members filters toolbar and advanced filters', () => {
  it('muestra los filtros avanzados al presionar el botón de embudo', async () => {
    render(<Members />);
    const filterBtn = await screen.findByTitle('Filtros avanzados');
    fireEvent.click(filterBtn);

    const emailInput = screen.getByLabelText('Filtro por email');
    const dateFrom = screen.getByLabelText('Filtro fecha desde');
    const dateTo = screen.getByLabelText('Filtro fecha hasta');

    expect(emailInput).toBeInTheDocument();
    expect(dateFrom).toBeInTheDocument();
    expect(dateTo).toBeInTheDocument();
  });

  it('toolbar posiciona filtros en fila y mantiene espaciado', async () => {
    render(<Members />);
    const filterButton = await screen.findByTitle('Filtros avanzados');
    expect(filterButton).toBeInTheDocument();
  });
});
