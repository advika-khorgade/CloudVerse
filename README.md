# 🫀 OrganMatch – Real-Time Organ Donation Match & Allocation System

A production-ready, full-stack organ donation platform with rule-based matching, real-time notifications, and role-based authentication.

## ✨ Features

### Core Functionality
- **Rule-Based Matching Engine** (no ML, fully deterministic)
  - Rh-factor aware blood compatibility (8 blood groups: O+, O-, A+, A-, B+, B-, AB+, AB-)
  - Asymmetric age rules: younger→older (40yr gap), older→younger (10yr strict)
  - Organ type exact match
  - Location preference (same city prioritized)
  - Priority: urgency DESC → waiting time ASC

- **Organ Viability Timers**
  - Heart: 4h, Liver: 12h, Kidney: 36h, Lung: 6h, Pancreas: 12h, Cornea: 72h
  - Live countdown timers with color coding
  - Automatic expiry via EventBridge (production) or polling (local)

- **Atomic Allocation**
  - DynamoDB conditional writes prevent race conditions
  - One donor → one recipient guarantee
  - Concurrent allocation conflict detection

### Authentication & Roles
- **3 User Roles:**
  - **Donor**: Register organs, track donations, view allocation history
  - **Recipient**: Join waiting list, track urgency, receive allocation notifications
  - **Admin**: Full system control, user management, activity logs

- **Secure Auth**
  - Email/password registration
  - Session persistence (localStorage)
  - Role-based route protection
  - Demo account: `admin@organmatch.com` / `admin123`

### Real-Time Features
- **Live Dashboard** (10s polling)
  - Available donors with countdown timers
  - Critical patients (urgency ≥ 8/10)
  - Recent allocations
  - Expiry warnings (< 2h remaining)

- **Notification Center**
  - Real-time alerts (8s polling)
  - Allocation events
  - Expiry warnings
  - Critical patient additions
  - Unread badge counter
  - Severity-based color coding

- **Activity Log** (Admin)
  - Full audit trail
  - Donor registrations
  - Recipient additions
  - Organ allocations
  - Expiry events
  - User actions

### Dashboards

#### Donor Dashboard (`/my-donor`)
- Register multiple organs
- Track active donations with live timers
- View allocation history (lives saved)
- See expired organs

#### Recipient Dashboard (`/my-recipient`)
- Join waiting list with urgency slider
- Track waiting status
- View compatible available donors
- Receive allocation notifications

#### Admin Panel (`/admin`)
- System overview with stats
- Blood compatibility matrix
- Manage all donors & recipients
- Trigger manual allocations
- View full activity log
- Delete/remove entries

### UI/UX
- Modern dark theme (Tailwind CSS)
- Responsive design
- Color-coded severity (red/yellow/green)
- Live status badges
- Countdown timers
- Toast notifications
- Loading states
- Error handling

## 🚀 Quick Start

```bash
cd organ-donation-system
npm install
npm run dev
# Open http://localhost:3000
```

**Demo Login:**
- Email: `admin@organmatch.com`
- Password: `admin123`

## 📁 Project Structure

```
organ-donation-system/
├── app/
│   ├── page.tsx                    # Live Dashboard
│   ├── login/page.tsx              # Login
│   ├── register/page.tsx           # Registration (donor/recipient)
│   ├── my-donor/page.tsx           # Donor personal dashboard
│   ├── my-recipient/page.tsx       # Recipient personal dashboard
│   ├── admin/page.tsx              # Admin control panel
│   ├── donors/page.tsx             # Public donor registry
│   ├── recipients/page.tsx         # Public waiting list
│   ├── allocations/page.tsx        # Transparency panel
│   └── api/                        # Next.js API routes
│       ├── auth/                   # Login/register
│       ├── donors/                 # CRUD donors
│       ├── recipients/             # CRUD recipients
│       ├── allocations/            # View allocations
│       ├── allocate/               # Trigger allocation
│       ├── notifications/          # Notification feed
│       ├── activity/               # Activity log
│       └── stats/                  # System stats
├── components/
│   ├── Navbar.tsx                  # Role-aware navigation
│   ├── NotificationBell.tsx        # Real-time notification dropdown
│   ├── DonorForm.tsx               # Register organ form
│   ├── RecipientForm.tsx           # Join waiting list form
│   ├── DonorTable.tsx              # Donor list with allocate button
│   ├── RecipientTable.tsx          # Recipient list with urgency
│   ├── AllocationTable.tsx         # Transparency panel
│   ├── CountdownTimer.tsx          # Live organ expiry timer
│   ├── StatCard.tsx                # Dashboard stat cards
│   └── Badge.tsx                   # Status badges
├── context/
│   └── AuthContext.tsx             # Auth state management
├── lib/
│   ├── types.ts                    # Shared TypeScript types
│   ├── auth.ts                     # In-memory auth store
│   ├── store.ts                    # In-memory DynamoDB mirror
│   └── api.ts                      # API client
├── lambda/                         # AWS Lambda functions
│   ├── shared/compatibility.js     # Matching rules
│   ├── addDonor.js
│   ├── addRecipient.js
│   ├── getDonors.js / getRecipients.js / getAllocations.js
│   ├── allocateOrgan.js            # Core matching engine
│   └── expiryChecker.js            # EventBridge-triggered
└── infrastructure/
    └── template.yaml               # AWS SAM (CloudFormation)
```

## 🧬 Blood Group Compatibility (Rh-Aware)

| Donor | Can donate to |
|-------|---------------|
| O-    | O-, O+, A-, A+, B-, B+, AB-, AB+ (universal) |
| O+    | O+, A+, B+, AB+ |
| A-    | A-, A+, AB-, AB+ |
| A+    | A+, AB+ |
| B-    | B-, B+, AB-, AB+ |
| B+    | B+, AB+ |
| AB-   | AB-, AB+ |
| AB+   | AB+ only |

## 🎯 Age Compatibility Rules

- **Younger donor → Older recipient**: Up to 40 years gap allowed
- **Older donor → Younger recipient**: Maximum 10 years gap (strict)

Example:
- Donor age 30 can donate to recipient age 70 ✅
- Donor age 50 can donate to recipient age 45 ✅
- Donor age 50 cannot donate to recipient age 35 ❌

## 🔔 Notification Types

| Type | Severity | Trigger |
|------|----------|---------|
| Allocation | Success | Organ matched to recipient |
| Expiry Warning | Warning | Organ < 2h remaining |
| Expiry | Warning | Organ expired |
| New Donor | Info | Organ registered |
| New Recipient | Critical | High urgency patient added (≥8/10) |
| System | Info | System events |

## 📊 Admin Features

- **System Stats**: Total donors, recipients, allocations, critical patients
- **Blood Compatibility Matrix**: Visual reference table
- **User Management**: View all users, delete entries
- **Manual Allocation**: Trigger allocation for any available donor
- **Activity Log**: Full audit trail with timestamps
- **Real-time Monitoring**: Live updates every 8-10 seconds

## 🛡️ Security & Data Integrity

- **Atomic Operations**: DynamoDB conditional writes prevent double allocation
- **Role-Based Access**: Protected routes for donor/recipient/admin
- **Session Management**: Persistent auth with localStorage
- **Input Validation**: Form validation on client & server
- **Error Handling**: Graceful error messages, no crashes

## 🌐 Deployment

### Local Development
```bash
npm run dev
```
Data stored in-memory, resets on restart.

### AWS Production
See `DEPLOY.md` for full AWS deployment guide:
- Lambda functions (Node.js 20)
- API Gateway (REST)
- DynamoDB (3 tables)
- EventBridge (expiry checker)
- CloudWatch (monitoring)

## 🎨 UI Color Coding

- **Green**: Available, safe, success
- **Blue**: Allocated, info
- **Yellow**: Waiting, medium urgency, warning
- **Red**: Critical, expired, high urgency

## 📈 Suggested Enhancements

1. **SMS/Email Notifications** (Twilio/SendGrid)
2. **WebSocket Support** (real-time push instead of polling)
3. **Geographic Distance Calculation** (Haversine formula)
4. **Multi-organ Allocation** (allocate multiple organs from one donor)
5. **Recipient Priority Score** (combine urgency + waiting time + medical factors)
6. **Hospital Integration** (API for hospital systems)
7. **Mobile App** (React Native)
8. **Analytics Dashboard** (allocation success rate, average wait time)
9. **Export Reports** (PDF/CSV for audits)
10. **Multi-language Support** (i18n)
11. **2FA Authentication** (TOTP)
12. **Organ Transport Tracking** (GPS integration)
13. **Medical History Integration** (EHR systems)
14. **Predictive Analytics** (ML for demand forecasting)
15. **Blockchain Audit Trail** (immutable allocation records)

## 🏆 Hackathon-Ready Features

- ✅ Clean, modern UI
- ✅ Real-time updates
- ✅ Role-based auth
- ✅ Transparency panel
- ✅ Activity log
- ✅ Notification center
- ✅ Live countdown timers
- ✅ Blood group compatibility matrix
- ✅ Admin control panel
- ✅ Personal dashboards
- ✅ Responsive design
- ✅ Production-ready architecture
- ✅ AWS deployment ready
- ✅ Zero ML dependencies (pure rules)
- ✅ Atomic operations (no race conditions)

## 📝 License

MIT

## 👥 Credits

Built with Next.js, Tailwind CSS, TypeScript, and AWS serverless architecture.
