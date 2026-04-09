/**
 * Shared matching rules — no ML, pure rule-based logic.
 * Rh-factor aware blood compatibility + asymmetric age rules.
 */

// Rh-aware blood compatibility: donor → compatible recipient groups
const BLOOD_COMPATIBILITY = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // universal donor
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

const ORGAN_VIABILITY_HOURS = {
  Heart: 4, Liver: 12, Kidney: 36, Lung: 6, Pancreas: 12, Cornea: 72,
};

/**
 * Rh-aware blood compatibility check.
 */
function isBloodCompatible(donorBlood, recipientBlood) {
  return (BLOOD_COMPATIBILITY[donorBlood] || []).includes(recipientBlood);
}

/**
 * Asymmetric age rule:
 *  - Younger donor → older recipient: up to 40 years gap allowed
 *  - Older donor → younger recipient: max 10 years gap (strict)
 */
function isAgeCompatible(donorAge, recipientAge) {
  const diff = recipientAge - donorAge; // positive = recipient is older
  if (diff >= 0) return diff <= 40;     // donor younger or same
  return Math.abs(diff) <= 10;          // donor older → strict
}

function getExpiryTime(organType, fromDate = new Date()) {
  const hours = ORGAN_VIABILITY_HOURS[organType] || 24;
  return new Date(fromDate.getTime() + hours * 3600 * 1000).toISOString();
}

module.exports = { BLOOD_COMPATIBILITY, ORGAN_VIABILITY_HOURS, isBloodCompatible, isAgeCompatible, getExpiryTime };
