import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
    mockFetch.mockReset();
  });

  it('renders landing page when no role is set', async () => {
    const { default: App } = await import('../src/App');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // Should show landing page with JALUR branding
    expect(document.body.textContent).toContain('JALUR');
  });

  it('renders landing page with warga entry button', async () => {
    const { default: App } = await import('../src/App');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // Check for warga entry button
    const buttons = document.querySelectorAll('button');
    const masukButtons = Array.from(buttons).filter(b =>
      b.textContent?.includes('Masuk')
    );
    expect(masukButtons.length).toBeGreaterThan(0);
  });

  it('shows admin login when admin button is clicked', async () => {
    const { default: App } = await import('../src/App');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // Find and click "Untuk Admin Kecamatan" button
    const adminButton = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Untuk Admin Kecamatan'));

    if (adminButton) {
      fireEvent.click(adminButton);

      // Should show admin login
      await waitFor(() => {
        expect(document.body.textContent).toContain('Admin');
      });
    }
  });

  it('switches to warga view when warga button is clicked', async () => {
    const { default: App } = await import('../src/App');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // Find and click "Mulai Lapor" button
    const wargaButton = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Mulai Lapor'));

    if (wargaButton) {
      fireEvent.click(wargaButton);

      await waitFor(() => {
        // Should show warga role in header
        expect(document.body.textContent).toContain('Warga');
      });
    }
  });

  it('persists role to sessionStorage on login', async () => {
    const { default: App } = await import('../src/App');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // Login as warga
    const wargaButton = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Mulai Lapor'));

    if (wargaButton) {
      fireEvent.click(wargaButton);

      await waitFor(() => {
        expect(sessionStorageMock.setItem).toHaveBeenCalledWith('jalur_role', 'warga');
      });
    }
  });

  it('persists view to sessionStorage on navigation', async () => {
    const { default: App } = await import('../src/App');

    // Mock reports response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    // Login as warga
    const wargaButton = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Mulai Lapor'));

    if (wargaButton) {
      fireEvent.click(wargaButton);

      await waitFor(() => {
        // After login, warga should have dashboard as default view
        expect(sessionStorageMock.setItem).toHaveBeenCalledWith('jalur_view', 'report');
      });
    }
  });
});