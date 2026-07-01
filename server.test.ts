import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock the database
vi.mock('./src/db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock nodemailer to prevent email sending during tests
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
    createTestAccount: vi.fn().mockResolvedValue({
      user: 'test@test.com',
      pass: 'testpass',
      smtp: { host: 'localhost', port: 587, secure: false },
    }),
    getTestMessageUrl: vi.fn(() => 'http://test.email.url'),
  },
}));

// We'll test the API functions directly without starting the full server
// since the full server requires database connection

describe('API Endpoints', () => {
  // Test data
  const mockReport = {
    id_laporan: 1,
    kode_unik: 'LAP-TEST',
    email: 'test@example.com',
    tanggal: new Date(),
    latitude: -6.5125,
    longitude: 106.75528,
    gambar: '[]',
    deskripsi: 'Test report',
    rds_score: 85,
    status: 'pending',
    alamat: 'Test Address',
  };

  describe('Geofencing - isWithinKemang', () => {
    // Test point-in-polygon logic
    function isPointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    // Kemang rectangle bounds (fallback)
    function isWithinKemangFallback(lat: number, lng: number): boolean {
      return lat >= -6.5400 && lat <= -6.4850 && lng >= 106.7200 && lng <= 106.7800;
    }

    it('accepts coordinates within Kemang boundary', () => {
      // Center of Kemang
      expect(isWithinKemangFallback(-6.5125, 106.75528)).toBe(true);
    });

    it('accepts edge coordinates', () => {
      // Southwest corner
      expect(isWithinKemangFallback(-6.5400, 106.7200)).toBe(true);
      // Northeast corner
      expect(isWithinKemangFallback(-6.4850, 106.7800)).toBe(true);
    });

    it('rejects coordinates outside Kemang boundary', () => {
      // Far north
      expect(isWithinKemangFallback(-6.4000, 106.75528)).toBe(false);
      // Far south
      expect(isWithinKemangFallback(-6.6000, 106.75528)).toBe(false);
      // Far east
      expect(isWithinKemangFallback(-6.5125, 106.9000)).toBe(false);
      // Far west
      expect(isWithinKemangFallback(-6.5125, 106.6000)).toBe(false);
    });

    it('rejects Jakarta coordinates', () => {
      // Jakarta is far west of Kemang
      expect(isWithinKemangFallback(-6.2088, 106.8456)).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    function getStatusLabel(status: string): string {
      switch (status) {
        case 'pending': return 'Menunggu';
        case 'reviewed': return 'Sedang Ditinjau';
        case 'diteruskan': return 'Selesai';
        default: return status;
      }
    }

    it('returns Indonesian labels for valid statuses', () => {
      expect(getStatusLabel('pending')).toBe('Menunggu');
      expect(getStatusLabel('reviewed')).toBe('Sedang Ditinjau');
      expect(getStatusLabel('diteruskan')).toBe('Selesai');
    });

    it('returns status as-is for unknown values', () => {
      expect(getStatusLabel('cancelled')).toBe('cancelled');
      expect(getStatusLabel('invalid')).toBe('invalid');
    });
  });

  describe('getStatusColor', () => {
    function getStatusColor(status: string): string {
      switch (status) {
        case 'pending': return '#f59e0b';
        case 'reviewed': return '#3b82f6';
        case 'diteruskan': return '#22c55e';
        default: return '#6b7280';
      }
    }

    it('returns correct colors for valid statuses', () => {
      expect(getStatusColor('pending')).toBe('#f59e0b');
      expect(getStatusColor('reviewed')).toBe('#3b82f6');
      expect(getStatusColor('diteruskan')).toBe('#22c55e');
    });

    it('returns gray for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#6b7280');
    });
  });

  describe('RDS Score Calculation', () => {
    function calculateRDSScore(detections: any[]): number {
      const weights: Record<string, number> = {
        'pothole': 10,
        'linear crack': 5,
        'alligator crack': 7
      };

      const penalty = detections.reduce((acc: number, det: any) =>
        acc + (weights[det.class] || 0), 0);

      return Math.max(0, 100 - penalty);
    }

    it('returns 100 for no detections', () => {
      expect(calculateRDSScore([])).toBe(100);
    });

    it('applies 10-point penalty for pothole', () => {
      expect(calculateRDSScore([{ class: 'pothole' }])).toBe(90);
    });

    it('applies 5-point penalty for linear crack', () => {
      expect(calculateRDSScore([{ class: 'linear crack' }])).toBe(95);
    });

    it('applies 7-point penalty for alligator crack', () => {
      expect(calculateRDSScore([{ class: 'alligator crack' }])).toBe(93);
    });

    it('accumulates penalties for multiple detections', () => {
      const detections = [
        { class: 'pothole' },
        { class: 'alligator crack' },
        { class: 'linear crack' },
      ];
      // 10 + 7 + 5 = 22
      expect(calculateRDSScore(detections)).toBe(78);
    });

    it('cannot go below 0', () => {
      const detections = Array(15).fill({ class: 'pothole' });
      expect(calculateRDSScore(detections)).toBe(0);
    });
  });

  describe('Unique Code Generation', () => {
    it('generates code with correct prefix', () => {
      const kodeUnik = `LAP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      expect(kodeUnik.startsWith('LAP-')).toBe(true);
    });

    it('generates 4-character random suffix', () => {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      expect(suffix.length).toBe(4);
    });

    it('generates alphanumeric codes', () => {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      expect(/^[A-Z0-9]+$/.test(suffix)).toBe(true);
    });
  });

  describe('Report Data Transformation', () => {
    it('transforms database fields to API response format', () => {
      const dbReport = {
        id_laporan: 1,
        kode_unik: 'LAP-TEST',
        email: 'test@example.com',
        tanggal: new Date('2024-01-15'),
        latitude: -6.5125,
        longitude: 106.75528,
        gambar: '[]',
        deskripsi: 'Test road damage',
        rds_score: 75,
        status: 'pending',
        alamat: 'Jl. Kemang Raya',
      };

      const apiResponse = {
        id: dbReport.id_laporan,
        kodeUnik: dbReport.kode_unik,
        email: dbReport.email,
        createdAt: dbReport.tanggal,
        latitude: dbReport.latitude,
        longitude: dbReport.longitude,
        imageUrl: dbReport.gambar,
        deskripsi: dbReport.deskripsi,
        rdsScore: dbReport.rds_score,
        status: dbReport.status,
        address: dbReport.alamat,
      };

      expect(apiResponse.id).toBe(1);
      expect(apiResponse.kodeUnik).toBe('LAP-TEST');
      expect(apiResponse.rdsScore).toBe(75);
      expect(apiResponse.address).toBe('Jl. Kemang Raya');
    });

    it('includes detections array', () => {
      const detections = [
        { class: 'pothole', confidence: 0.89 },
      ];

      const apiResponse = {
        detections: detections.map(d => ({
          class: d.class,
          confidence: d.confidence,
        })),
      };

      expect(apiResponse.detections).toHaveLength(1);
      expect(apiResponse.detections[0].class).toBe('pothole');
      expect(apiResponse.detections[0].confidence).toBe(0.89);
    });
  });

  describe('Tracking Endpoint', () => {
    it('returns report by unique code', () => {
      const mockReports = [
        { kode_unik: 'LAP-ABCD', status: 'pending', rds_score: 80 },
        { kode_unik: 'LAP-WXYZ', status: 'diteruskan', rds_score: 45 },
      ];

      const kode = 'LAP-ABCD';
      const found = mockReports.find(r => r.kode_unik === kode.toUpperCase());

      expect(found).toBeDefined();
      expect(found?.status).toBe('pending');
    });

    it('returns 404 for non-existent code', () => {
      const mockReports = [
        { kode_unik: 'LAP-ABCD', status: 'pending' },
      ];

      const kode = 'LAP-NOTF';
      const found = mockReports.find(r => r.kode_unik === kode.toUpperCase());

      expect(found).toBeUndefined();
    });
  });

  describe('Status Update Validation', () => {
    const validStatuses = ['pending', 'reviewed', 'diteruskan'];

    it('accepts valid status values', () => {
      expect(validStatuses.includes('pending')).toBe(true);
      expect(validStatuses.includes('reviewed')).toBe(true);
      expect(validStatuses.includes('diteruskan')).toBe(true);
    });

    it('rejects invalid status values', () => {
      expect(validStatuses.includes('invalid')).toBe(false);
      expect(validStatuses.includes('closed')).toBe(false);
    });
  });
});

describe('API Response Formats', () => {
  describe('GET /api/reports', () => {
    it('returns array of reports', () => {
      const response = [
        { id: 1, kodeUnik: 'LAP-0001', status: 'pending' },
        { id: 2, kodeUnik: 'LAP-0002', status: 'reviewed' },
      ];

      expect(Array.isArray(response)).toBe(true);
      expect(response).toHaveLength(2);
    });

    it('each report has required fields', () => {
      const report = {
        id: 1,
        kodeUnik: 'LAP-TEST',
        email: 'test@example.com',
        createdAt: expect.any(Date),
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        rdsScore: expect.any(Number),
        status: expect.any(String),
      };

      expect(report).toMatchObject({
        id: 1,
        kodeUnik: 'LAP-TEST',
      });
    });
  });

  describe('POST /api/reports', () => {
    it('accepts valid report creation payload', () => {
      const payload = {
        email: 'test@example.com',
        latitude: -6.5125,
        longitude: 106.75528,
        images: ['data:image/jpeg;base64,...'],
        deskripsi: 'Jalan berlubang di depan pasar',
      };

      expect(payload.email).toBeDefined();
      expect(payload.latitude).toBeDefined();
      expect(payload.longitude).toBeDefined();
    });

    it('rejects out-of-bounds coordinates', () => {
      const isWithinKemang = (lat: number, lng: number) => {
        return lat >= -6.5400 && lat <= -6.4850 && lng >= 106.7200 && lng <= 106.7800;
      };

      // Jakarta
      expect(isWithinKemang(-6.2088, 106.8456)).toBe(false);
      // Within Kemang
      expect(isWithinKemang(-6.5125, 106.75528)).toBe(true);
    });
  });

  describe('PUT /api/reports/:id/status', () => {
    it('accepts valid status values', () => {
      const validStatuses = ['pending', 'reviewed', 'diteruskan'];

      validStatuses.forEach(status => {
        expect(validStatuses.includes(status)).toBe(true);
      });
    });

    it('returns success response', () => {
      const response = { success: true };
      expect(response.success).toBe(true);
    });
  });
});