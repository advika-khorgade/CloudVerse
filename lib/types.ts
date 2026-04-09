// ─── Shared TypeScript types ───────────────────────────────────────────────

export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
export type OrganType = 'Heart' | 'Liver' | 'Kidney' | 'Lung' | 'Pancreas' | 'Cornea';
export type DonorStatus = 'available' | 'allocated' | 'expired';
export type RecipientStatus = 'waiting' | 'allocated';
export type UserRole = 'donor' | 'recipient' | 'admin';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  donorId?: string;
  recipientId?: string;
}

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  donorId?: string;
  recipientId?: string;
}

// ─── Donor Health Details ─────────────────────────────────────────────────────
export interface DonorHealthDetails {
  weight?: number;           // kg
  height?: number;           // cm
  bmi?: number;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholUse: 'none' | 'occasional' | 'regular';
  diabetes: boolean;
  hypertension: boolean;
  heartDisease: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  cancer: boolean;
  infectiousDiseases: string; // HIV, Hepatitis B/C, etc.
  medications: string;        // current medications
  allergies: string;
  lastMedicalCheckup?: string; // ISO date
  additionalNotes: string;
}

// ─── Donor ────────────────────────────────────────────────────────────────────
export interface Donor {
  donorId: string;
  userId?: string;
  organType: OrganType;
  bloodGroup: BloodGroup;
  age: number;
  location: string;
  timestamp: string;
  expiryTime: string;
  status: DonorStatus;
  healthDetails?: DonorHealthDetails;
}

// ─── Recipient ────────────────────────────────────────────────────────────────
export interface Recipient {
  recipientId: string;
  userId?: string;
  requiredOrgan: OrganType;
  bloodGroup: BloodGroup;
  age: number;
  location: string;
  urgency: number;
  timestamp: string;
  status: RecipientStatus;
  medicalNotes?: string;
}

// ─── Allocation ───────────────────────────────────────────────────────────────
export interface Allocation {
  allocationId: string;
  donorId: string;
  recipientId: string;
  organType: OrganType;
  timestamp: string;
  reason: {
    urgency: number;
    waitingTime: string;
    compatibilityFactors: string[];
    distanceKm?: number;
    priorityScore?: number;
  };
  donor?: Donor;
  recipient?: Recipient;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'allocation' | 'expiry_warning' | 'expiry'
  | 'new_donor' | 'new_recipient' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUserId?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export interface ActivityLog {
  logId: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Blood group compatibility (Rh-aware) ─────────────────────────────────────
export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// ─── Age compatibility ────────────────────────────────────────────────────────
export function isAgeCompatible(donorAge: number, recipientAge: number): boolean {
  const diff = recipientAge - donorAge;
  return diff >= 0 ? diff <= 40 : Math.abs(diff) <= 10;
}

// ─── Organ viability ──────────────────────────────────────────────────────────
export const ORGAN_VIABILITY_HOURS: Record<OrganType, number> = {
  Heart: 4, Liver: 12, Kidney: 36, Lung: 6, Pancreas: 12, Cornea: 72,
};
