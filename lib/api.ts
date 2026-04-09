// ─── API client – calls Next.js API routes (which proxy to AWS Lambda) ────────

import { Donor, Recipient, Allocation } from './types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Donors
  getDonors: () => request<Donor[]>('/donors'),
  addDonor: (data: Omit<Donor, 'donorId' | 'timestamp' | 'expiryTime' | 'status'>) =>
    request<Donor>('/donors', { method: 'POST', body: JSON.stringify(data) }),

  // Recipients
  getRecipients: () => request<Recipient[]>('/recipients'),
  addRecipient: (data: Omit<Recipient, 'recipientId' | 'timestamp' | 'status'>) =>
    request<Recipient>('/recipients', { method: 'POST', body: JSON.stringify(data) }),

  // Allocations
  getAllocations: () => request<Allocation[]>('/allocations'),
  allocateOrgan: (donorId: string) =>
    request<Allocation>('/allocate', { method: 'POST', body: JSON.stringify({ donorId }) }),
};
