import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminNews, AdminTrash, AdminAudit, AdminActivities, AdminServices } from './Admin';
import { BrowserRouter } from 'react-router-dom';

// Mock supabaseClient to avoid errors
vi.mock('./supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'mock-token' } } }),
    },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'http://mock.url/image.jpg' } }),
      }),
    }
  }
}));

// Mock fetch
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Admin Panel Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminNews', () => {
    it('renders news list and handles edit/delete', async () => {
      const mockNews = [
        { id: '1', title: 'Test News', excerpt: 'Test Excerpt', image: '' }
      ];
      
      fetch.mockResolvedValueOnce({
        json: async () => mockNews
      });

      renderWithRouter(<AdminNews />);

      // Check if title exists
      await waitFor(() => {
        expect(screen.getByText('Gestión de Noticias')).toBeInTheDocument();
      });

      // Check if news item is rendered
      await waitFor(() => {
        expect(screen.getByText('Test News')).toBeInTheDocument();
      });

      // Check Edit button
      const editBtn = screen.getByText('Editar');
      expect(editBtn).toBeInTheDocument();

      // Click Edit
      fireEvent.click(editBtn);

      // Check if form is populated (title input value)
      const inputs = screen.getAllByPlaceholderText('Título');
      expect(inputs[0]).toHaveValue('Test News');

      // Check if button changes to "Actualizar"
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
      
      // Check Cancel button
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });

  describe('AdminTrash', () => {
    it('renders deleted items and handles restore', async () => {
      const mockDeleted = [
        { id: 'del1', title: 'Deleted News', deleted_at: '2023-01-01T00:00:00Z' }
      ];

      fetch.mockResolvedValueOnce({
        json: async () => mockDeleted
      });

      renderWithRouter(<AdminTrash />);

      await waitFor(() => {
        expect(screen.getByText('Deleted News')).toBeInTheDocument();
      });

      // Check Restore button
      const restoreBtn = screen.getByText('Restaurar');
      expect(restoreBtn).toBeInTheDocument();

      // Mock restore fetch
      fetch.mockResolvedValueOnce({ ok: true });
      // Mock reload fetch
      fetch.mockResolvedValueOnce({ json: async () => [] });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm');
      confirmSpy.mockImplementation(() => true);

      fireEvent.click(restoreBtn);

      expect(confirmSpy).toHaveBeenCalled();
      
      // Wait for fetch call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/restore/news/del1'), expect.anything());
      });
    });
  });

  describe('AdminAudit', () => {
    it('renders audit logs', async () => {
      const mockLogs = [
        { id: 'log1', action: 'CREATE', entity: 'news', entity_id: '123', created_at: new Date().toISOString(), details: {} }
      ];

      fetch.mockResolvedValueOnce({
        json: async () => mockLogs
      });

      renderWithRouter(<AdminAudit />);

      await waitFor(() => {
        expect(screen.getByText('CREATE news')).toBeInTheDocument();
      });
    });
  });
});
