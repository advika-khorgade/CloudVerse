// ─── API client ───────────────────────────────────────────────────────────────
// In local dev: calls Next.js API routes (/api/...)
// In production: set NEXT_PUBLIC_API_URL to your API Gateway URL
//   e.g. https://abc123.execute-api.us-east-1.amazonaws.com/prod

import { Donor, Recipient, Allocation, Notification, ActivityLog, AuthSession } from './types';

// If NEXT_PUBLIC_API_URL is set, all requests go directly to AWS API Gateway.
// Otherwise, fall back to local Next.js API routes.
const AWS_BASE = process.env.NEXT_PUBLIC_API_URL;
const LOCAL_BASE = '/api';

/**
 * Resolves the correct URL for a given path.
 *
 * Local dev:  /api/donors          → Next.js route handler
 * Production: https://...amazonaws.com/prod/getDonors  → Lambda via API Gateway
 *
 * The AWS API Gateway uses different path names (legacy REST style),
 * so we map them here.
 */
function resolveUrl(localPath: string, method: string): string {
  if (!AWS_BASE) return `${LOCAL_BASE}${localPath}`;

  // Map local paths → AWS API Gateway paths
  const awsPathMap: Record<string, string> = {
    '/donors':       method === 'POST' ? '/addDonor'      : '/getDonors',
    '/recipients':   method === 'POST' ? '/addRecipient'  : '/getRecipients',
    '/allocations':  '/allocations',
    '/allocate':     '/allocateOrgan',
    '/notifications':'/notifications',
    '/activity':     '/activity',
    '/stats':        '/stats',
  };

  // Strip query string for mapping, re-append after
  const [pathOnly, query] = localPath.split('?');
  const awsPath = awsPathMap[pathOnly] ?? pathOnly;
  return `${AWS_BASE}${awsPath}${query ? `?${query}` : ''}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const url = resolveUrl(path, method);

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    method,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    request<AuthSession>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  // Donors
  getDonors: () => request<Donor[]>('/donors'),
  addDonor: (data: Omit<Donor, 'donorId' | 'timestamp' | 'expiryTime' | 'status'>) =>
    request<Donor>('/donors', { method: 'POST', body: JSON.stringify(data) }),
  deleteDonor: (donorId: string) =>
    request<void>(`/donors/${donorId}`, { method: 'DELETE' }),

  // Recipients
  getRecipients: () => request<Recipient[]>('/recipients'),
  addRecipient: (data: Omit<Recipient, 'recipientId' | 'timestamp' | 'status'>) =>
    request<Recipient>('/recipients', { method: 'POST', body: JSON.stringify(data) }),
  deleteRecipient: (recipientId: string) =>
    request<void>(`/recipients/${recipientId}`, { method: 'DELETE' }),

  // Allocations
  getAllocations: () => request<Allocation[]>('/allocations'),
  allocateOrgan: (donorId: string) =>
    request<Allocation>('/allocate', { method: 'POST', body: JSON.stringify({ donorId }) }),

  // Notifications
  getNotifications: (userId?: string) =>
    request<Notification[]>(`/notifications${userId ? `?userId=${userId}` : ''}`),
  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    request<void>('/notifications/read-all', { method: 'POST' }),

  // Activity log (admin)
  getActivityLogs: () => request<ActivityLog[]>('/activity'),

  // Stats (admin)
  getStats: () => request<ReturnType<typeof import('./store').getStats>>('/stats'),
};
