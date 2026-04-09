// ─── Shared TypeScript types ───────────────────────────────────────────────

export type BloodGroup = 'O' | 'A' | 'B' | 'AB';
export type OrganType = 'Heart' | 'Liver' | 'Kidney' | 'Lung' | 'Pancreas' | 'Cornea';
export type DonorStatus = 'available' | 'allocated' | 'expired';
export type RecipientStatus = 'waiting' | 'allocated';

export interface Donor {
  donorId: string;
  organType: OrganType;
  bloodGroup: BloodGroup;
  age: number;
  location: string;
  timestamp: string;       // ISO string
  expiryTime: string;      // ISO string
  status: DonorStatus;
}

export interface Recipient {
  recipientId: string;
  requiredOrgan: OrganType;
  bloodGroup: BloodGroup;
  age: number;
  location: string;
  urgency: number;         // 1–10
  timestamp: string;       // ISO string
  status: RecipientStatus;
}

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
  };
  donor?: Donor;
  recipient?: Recipient;
}

// Blood group compatibility map: donor → compatible recipients
export const BLOOD_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  O:  ['O', 'A', 'B', 'AB'],
  A:  ['A', 'AB'],
  B:  ['B', 'AB'],
  AB: ['AB'],
};

// Organ viability in hours
export const ORGAN_VIABILITY_HOURS: Record<OrganType, number> = {
  Heart:    4,
  Liver:    12,
  Kidney:   36,
  Lung:     6,
  Pancreas: 12,
  Cornea:   72,
};
