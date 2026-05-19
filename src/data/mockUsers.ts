
import type { PBIUser } from '../types';

// Fixed IDs so they stay stable across reloads (only used when localStorage is empty)
export const mockUsers: PBIUser[] = [
  {
    id: '11111111-0001-0001-0001-000000000001',
    firstName: 'Natalia',
    lastName: 'Administrador',
    email: 'natalia.admin@empresa.gob.ar',
    password: '',
    licenseType: 'Pro',
    creationDate: '2025-01-01',
    validityDays: 365,
    expirationDate: '2026-01-01',
    isActive: true,
  },
];
