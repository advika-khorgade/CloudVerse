import { NextRequest, NextResponse } from 'next/server';

// ─── Rule-based chatbot — no external API, no build issues ───────────────────

interface Rule { keywords: string[]; answer: string; }

const DONOR_RULES: Rule[] = [
  {
    keywords: ['match', 'how', 'work', 'process', 'matching'],
    answer: 'Organ matching works by comparing blood group compatibility, organ type, age difference, and location. The system uses a priority score: urgency × 1000 − waiting hours × 10 − distance × 0.1. The highest scoring recipient gets the organ.',
  },
  {
    keywords: ['viability', 'window', 'time', 'expire', 'hours', 'long'],
    answer: 'Organ viability windows: Heart → 4 hours, Lung → 6 hours, Liver → 12 hours, Pancreas → 12 hours, Kidney → 36 hours, Cornea → 72 hours. Once registered, a countdown timer starts automatically.',
  },
  {
    keywords: ['blood', 'type', 'compatible', 'donate', 'group'],
    answer: 'Blood compatibility (Rh-aware): O− is the universal donor (can donate to all). O+ → O+, A+, B+, AB+. A− → A−, A+, AB−, AB+. A+ → A+, AB+. B− → B−, B+, AB−, AB+. B+ → B+, AB+. AB− → AB−, AB+. AB+ → AB+ only.',
  },
  {
    keywords: ['age', 'difference', 'gap', 'young', 'old'],
    answer: 'Age rules: A younger donor can donate to a recipient up to 40 years older. An older donor can only donate to a recipient up to 10 years younger. This protects younger recipients.',
  },
  {
    keywords: ['health', 'condition', 'eligible', 'eligibility', 'medical', 'disease'],
    answer: 'Common conditions that may affect eligibility: active cancer, HIV, uncontrolled diabetes, or severe organ disease in the organ being donated. Always consult your doctor for a personal assessment.',
  },
  {
    keywords: ['register', 'add', 'how to', 'sign up', 'submit'],
    answer: 'To register as a donor: go to the Donors page, click "Register Donor", fill in organ type, blood group, age, and location. The system auto-generates a timestamp and expiry time.',
  },
  {
    keywords: ['score', 'priority', 'formula', 'calculated', 'rank'],
    answer: 'Priority score = (urgency × 1000) − (waiting hours × 10) − (distance km × 0.1). Urgency dominates — a 1-point urgency difference equals 1000 score points. Distance is only a tiebreaker.',
  },
  {
    keywords: ['location', 'distance', 'city', 'nearby', 'close'],
    answer: 'Location affects the priority score as a soft tiebreaker. Same-city recipients score higher than distant ones, but urgency and waiting time always take precedence.',
  },
  {
    keywords: ['allocated', 'status', 'what happen', 'after'],
    answer: 'Once your organ is allocated, its status changes to "Allocated" and the matched recipient is notified. You can see the full allocation history including who received it and why in your donor dashboard.',
  },
];

const RECIPIENT_RULES: Rule[] = [
  {
    keywords: ['priority', 'score', 'calculated', 'rank', 'how', 'formula'],
    answer: 'Your priority is calculated as: (urgency × 1000) − (waiting hours × 10) − (distance × 0.1). Urgency is the most important factor. If two patients have the same urgency, the one who has waited longer wins.',
  },
  {
    keywords: ['blood', 'type', 'compatible', 'receive', 'group', 'donate to me'],
    answer: 'Who can donate to you depends on your blood group: If you are AB+ → anyone can donate. AB− → O−, A−, B−, AB−. A+ → O−, O+, A−, A+. A− → O−, A−. B+ → O−, O+, B−, B+. B− → O−, B−. O+ → O−, O+. O− → O− only.',
  },
  {
    keywords: ['wait', 'long', 'average', 'time', 'how long'],
    answer: 'Wait time depends on your blood group, organ type, urgency score, and available donors. Critical patients (urgency 8-10) are prioritized. There is no fixed average — it varies by organ availability.',
  },
  {
    keywords: ['urgency', 'score', 'set', 'change', 'update'],
    answer: 'Urgency is set when you register (1-10 scale). 1-4 is low, 5-7 is medium, 8-10 is critical. A higher urgency score significantly boosts your priority. Contact your medical team to update it if your condition changes.',
  },
  {
    keywords: ['allocated', 'what happen', 'after', 'receive', 'next step'],
    answer: 'When an organ is allocated to you: your status changes to "Allocated", you receive a notification, and your hospital will be contacted. Act quickly — organs have limited viability windows.',
  },
  {
    keywords: ['register', 'join', 'waiting list', 'add', 'sign up'],
    answer: 'To join the waiting list: go to the Recipients page, click "Add Recipient", fill in required organ, blood group, age, location, and urgency level. You will be automatically considered for matching.',
  },
  {
    keywords: ['location', 'city', 'distance', 'nearby'],
    answer: 'Your location affects matching as a soft tiebreaker. Donors in the same city are slightly preferred, but urgency and waiting time are far more important factors.',
  },
  {
    keywords: ['age', 'donor age', 'compatible age'],
    answer: 'Age compatibility: a donor up to 40 years younger than you can donate to you. A donor older than you can donate only if the age gap is 10 years or less.',
  },
  {
    keywords: ['notification', 'alert', 'notify', 'inform'],
    answer: 'You will receive a real-time notification in the notification bell (top right) when an organ is allocated to you. The system polls every 8 seconds for updates.',
  },
];

const FALLBACK_DONOR = "I'm here to help with organ donation questions. You can ask me about blood compatibility, viability windows, age rules, the matching process, or how to register as a donor.";
const FALLBACK_RECIPIENT = "I'm here to help with transplant questions. You can ask me about your priority score, blood compatibility, wait times, urgency levels, or what happens after allocation.";

function findAnswer(message: string, rules: Rule[], fallback: string): string {
  const lower = message.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.answer;
    }
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, role } = await req.json();
    const lastMessage = messages?.[messages.length - 1]?.content || '';
    const rules = role === 'recipient' ? RECIPIENT_RULES : DONOR_RULES;
    const fallback = role === 'recipient' ? FALLBACK_RECIPIENT : FALLBACK_DONOR;
    const reply = findAnswer(lastMessage, rules, fallback);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: 'Sorry, something went wrong. Please try again.' });
  }
}
