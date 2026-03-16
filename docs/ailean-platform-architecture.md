# AILEAN Platform — System Architecture Documentation
**Version 1.0 | Confidential**
**Prepared by:** Kristian Steen, AILEAN / vimpl
**Contact:** kristian.steen@vimpl.com

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Voice-to-launch](#3-voice-to-launch)
4. [Visualise-to-Implement](#4-visualise-to-implement)
5. [Integration Architecture](#5-integration-architecture)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Non-Functional Characteristics](#7-non-functional-characteristics)
8. [Architecture Decision Records](#8-architecture-decision-records)
9. [Security Questionnaire](#9-security-questionnaire)
10. [GDPR & Data Privacy](#10-gdpr--data-privacy)
11. [API Integration Guide](#11-api-integration-guide)

---

## 1. Executive Summary

AILEAN is a two-application SaaS platform that automates lean process transformation. It combines AI-driven process discovery with visual project execution, replacing the traditional consultant engagement model with a software-native workflow.

The platform consists of two integrated products:

| Product | Technical Name | Role |
|---|---|---|
| **Voice-to-launch** | `voice-2-bpmn` | Process discovery — voice/text → BPMN diagram → improvement plan |
| **Visualise-to-Implement** | `vimpl-saas` | Project execution — receives plan → creates visual lean project board |

A user completes a full lean engagement — from blank page to live project board — in under one hour, at a fraction of the cost of a traditional lean consultant engagement.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AILEAN Platform                              │
│                                                                     │
│  ┌─────────────────────────┐       ┌─────────────────────────────┐  │
│  │    Voice-to-launch       │       │   Visualise-to-Implement    │  │
│  │  (Client SPA — React)    │──────▶│  Frontend  │   Backend API  │  │
│  │  voice-2-launch.vercel   │  POST │  vimpl.com │  Express/TS   │  │
│  │                          │/import│            │  Vercel SaaS  │  │
│  └──────────┬───────────────┘       └──────────────────┬──────────┘  │
│             │                                          │             │
│             ▼                                          ▼             │
│      ┌─────────────┐                         ┌────────────────┐     │
│      │ Anthropic   │                         │  Supabase      │     │
│      │ Claude API  │                         │  PostgreSQL    │     │
│      └─────────────┘                         └────────────────┘     │
│      ┌─────────────┐                         ┌────────────────┐     │
│      │ ElevenLabs  │                         │  Google OAuth  │     │
│      │ TTS API     │                         │  Resend Email  │     │
│      └─────────────┘                         └────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Voice-to-launch

### 3.1 Overview

Voice-to-launch is a **100% client-side Single Page Application**. There is no dedicated backend. All AI processing calls are made directly from the browser to external APIs. The Visualise-to-Implement backend is used optionally for cloud save and project export.

### 3.2 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.3 |
| Build Tool | Vite | 6.0 |
| Styling | Tailwind CSS | 3.4 |
| BPMN Renderer | bpmn-js | 17.11 |
| LLM SDK | @anthropic-ai/sdk | 0.39 |
| Hosting | Vercel (static) | — |

### 3.3 Process Pipeline

The core of the application is a 5-stage AI pipeline:

```
┌──────────────────────────────────────────────────────────────────┐
│                     PROCESSING PIPELINE                          │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  STAGE 1 │    │  STAGE 2 │    │  STAGE 3 │    │  STAGE 4 │   │
│  │  CAPTURE │───▶│  DESCRIBE│───▶│  DIAGRAM │───▶│  IMPROVE │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
│       │                │               │               │         │
│  Voice/text       Claude API       Claude API      Claude API    │
│  Web Speech       → Structured     → BPMN JSON     → 4–8        │
│  API (STT)        description      + XML           improvements  │
│                                                        │         │
│                                                   ┌──────────┐   │
│                                                   │  STAGE 5 │   │
│                                                   │   PLAN   │   │
│                                                   └──────────┘   │
│                                                   Claude API     │
│                                                   → 14-week      │
│                                                   project plan   │
└──────────────────────────────────────────────────────────────────┘
```

**All LLM calls use:** `claude-sonnet-4-20250514` via `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true`

| Stage | Function | Input | Output | Max Tokens |
|---|---|---|---|---|
| 1 → 2 | `parseVoiceToDescription()` | Raw transcript | Structured JSON (roles, steps, exceptions) | 3,000 |
| 2 → 3 | `parseToBpmn()` | Structured description | BPMN element JSON | 4,000 |
| 3 | `generateBpmnXml()` | BPMN JSON | BPMN 2.0 XML (local, no API call) | — |
| 3 → 4 | `getStructuredImprovements()` | BPMN JSON | Improvement array (effort/impact scored) | 3,000 |
| 4 → 5 | `generateProjectPlan()` | BPMN + improvements | 14-week plan (tracks, tasks, risks) | 4,000 |

### 3.4 AI Interview Mode (Ailean)

A conversational AI layer runs on top of the recording flow:

```
User speaks → Web Speech API (STT) → Recording stops
    → Claude API: getInterviewFollowUp() [120 tokens max]
    → Ailean persona generates 1 follow-up question
    → ElevenLabs API: eleven_turbo_v2_5 model (Sarah voice)
    → Audio played in browser
    → User responds → loop continues
```

Conversation history (last 3 turns) is passed with each call to maintain context. Falls back to browser `SpeechSynthesisUtterance` if no ElevenLabs key is provided.

### 3.5 BPMN XML Generation

XML is generated entirely client-side (no API call) by `xmlGenerator.js`:

- **Auto-detects** swimlane layout vs. flat diagram based on whether roles are assigned to activities
- **Layout algorithm:** DAG level-order traversal, left-to-right, 180px step
- **Output:** Valid BPMN 2.0 XML with `<BPMNDiagram>` visual coordinates
- **Rendered** live in browser via `bpmn-js`

### 3.6 Authentication & Session Model

```
┌─────────────────────────────────────────────────────┐
│                  AUTH FLOW                          │
│                                                     │
│  1. App loads → check localStorage for vimpl token │
│  2. No token → show login screen                   │
│  3a. Google OAuth:                                  │
│      → redirect to vimpl backend /auth/google      │
│      → Google consent → vimpl backend callback     │
│      → redirect to /callback.html?token=...        │
│      → token stored in localStorage                │
│  3b. Vimpl email login:                             │
│      → redirect to vimpl.com/login                 │
│      → login → redirect back with ?token=          │
│  4. Token in localStorage → app is accessible      │
└─────────────────────────────────────────────────────┘
```

### 3.7 Data Persistence

| Data | Storage | Persistence | Notes |
|---|---|---|---|
| Anthropic API key | React state only | Session | Lost on page refresh — by design |
| ElevenLabs API key | React state only | Session | Lost on page refresh — by design |
| vimpl auth token | `localStorage` | Cross-session | Key: `voice2bpmn_vimpl_config` |
| Work-in-progress draft | `localStorage` | Cross-session | Auto-saved on every state change |
| Custom taxonomy | `localStorage` | Cross-session | User-uploaded APQC-compatible JSON |
| BPMN diagrams (cloud) | vimpl backend DB | Persistent | Optional, requires login |

### 3.8 External Dependencies

| Service | Purpose | Auth Model | Data Sent |
|---|---|---|---|
| Anthropic API | LLM — all AI pipeline stages + interview | API key (runtime, browser) | Process transcripts, JSON structures |
| ElevenLabs | TTS for Ailean interviewer voice | API key (runtime, browser) | Follow-up question text only |
| vimpl backend | Google OAuth, diagram cloud save, project export | Bearer JWT | BPMN XML, project plan JSON |
| Google OAuth | User identity | Delegated via vimpl backend | Origin URL (redirect only) |
| Web Speech API | STT — voice capture in browser | Browser built-in | Audio processed locally, never transmitted |

---

## 4. Visualise-to-Implement

### 4.1 Overview

Visualise-to-Implement is a **full-stack SaaS application** with a TypeScript/Express REST API backend, a static HTML/JS frontend, and a managed PostgreSQL database on Supabase. It is deployed as serverless functions on Vercel.

### 4.2 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Express | 4.18 |
| Language | TypeScript | 5.3 |
| ORM | Prisma | 5.9 |
| Database | PostgreSQL (Supabase) | 15 |
| Auth | JWT + Passport.js | — |
| OAuth | passport-google-oauth20 | 2.0 |
| Email | Resend API | — |
| Security | Helmet, cors, express-rate-limit | — |
| Logging | Winston, Morgan | — |
| API Docs | Swagger (swagger-jsdoc) | — |
| Frontend | Vanilla HTML/CSS/JS | — |
| Hosting | Vercel (backend: serverless, frontend: static) | — |

### 4.3 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                   THREE-TIER ARCHITECTURE                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PRESENTATION TIER — Static Frontend (vimpl.com)            │   │
│  │  HTML / CSS / Vanilla JS                                     │   │
│  │  Pages: index, login, register, dashboard, board, pricing   │   │
│  └───────────────────────────┬──────────────────────────────────┘   │
│                              │  HTTPS REST                          │
│  ┌───────────────────────────▼──────────────────────────────────┐   │
│  │  APPLICATION TIER — Backend API (Vercel Serverless)          │   │
│  │                                                              │   │
│  │  Middleware: Helmet → CORS → Body-parser → Rate-limit → Auth │   │
│  │                                                              │   │
│  │  Routes: /auth  /boards  /portfolio  /subscription           │   │
│  │          /admin  /diagrams  /leads  /eventlog                │   │
│  │                                                              │   │
│  │  Controllers → Services → Prisma ORM                        │   │
│  └───────────────────────────┬──────────────────────────────────┘   │
│                              │  Prisma + PgBouncer                  │
│  ┌───────────────────────────▼──────────────────────────────────┐   │
│  │  DATA TIER — Supabase PostgreSQL (AWS eu-central-1)          │   │
│  │  Connection pooling: PgBouncer (transaction mode)            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.4 Data Model

```
User ──────────────────────────────────────────────────────────┐
 │ id, email, name, passwordHash                               │
 │ authProvider (email|google), authProviderId                 │
 │ subscriptionTier (student|commercial|enterprise)            │
 │ subscriptionStatus, subscriptionStartDate/EndDate           │
 │ stripeCustomerId (reserved for payment integration)         │
 │                                                             │
 ├──▶ Board                                                    │
 │     │ id, title, slug (unique URL), isPublic                │
 │     │ gridData (JSON — GridStack layout)                    │
 │     │ version (optimistic concurrency lock)                 │
 │     │                                                       │
 │     ├──▶ Section                                            │
 │     │     │ type: text|matrix|weekplan|kpi|actions|         │
 │     │     │       postit-area|team                          │
 │     │     │ positionX, positionY, width, height             │
 │     │     │ content (JSON — type-specific data)             │
 │     │     └──▶ Postit                                       │
 │     │           color, content, owner, status               │
 │     │           xValue, yValue (matrix coords)              │
 │     │           riskScore, mitigation (risk matrix)         │
 │     │                                                       │
 │     ├──▶ BoardCollaborator                                  │
 │     │     userId, permission (view|edit|admin)              │
 │     │     invitedBy, invitedAt, acceptedAt                  │
 │     │                                                       │
 │     └──▶ EventLog                                           │
 │           eventType, elementId, elementType, details (JSON) │
 │                                                             │
 ├──▶ BpmnDiagram                                              │
 │     name, xml (BPMN 2.0), processName                      │
 │                                                             │
 ├──▶ LoginAudit                                               │
 │     loginMethod, success, ipAddress, userAgent              │
 │                                                             │
 └──▶ Session                                                 │
       expiresAt, data (JSON)                                 │
```

### 4.5 Authentication Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOWS                       │
│                                                               │
│  EMAIL/PASSWORD                    GOOGLE OAUTH               │
│  ─────────────                     ────────────               │
│  POST /auth/register               GET /auth/google           │
│    → hash password (bcrypt/12)       → Passport redirect      │
│    → create User                     → Google consent screen  │
│    → send verify email               → GET /auth/google/callback
│  POST /auth/verify-email             → findOrCreateGoogleUser │
│    → mark emailVerified=true         → generateTokens()       │
│  POST /auth/login                    → redirect to frontend   │
│    → compare bcrypt hash                                      │
│    → generateTokens()              Both flows produce:        │
│                                    ┌──────────────────────┐   │
│  TOKEN STORAGE                     │ accessToken (24h JWT) │   │
│  Access: Authorization header      │ refreshToken (7d JWT) │   │
│  Refresh: HTTP-only cookie         │ in HTTP-only cookie   │   │
│  Refresh: POST /auth/refresh       └──────────────────────┘   │
│  Logout:  POST /auth/logout (clears cookie)                   │
└───────────────────────────────────────────────────────────────┘
```

### 4.6 API Surface

**Base URL:** `https://backend-eight-rho-46.vercel.app/api/v1`
**Documentation:** `/api/docs` (Swagger UI)
**Rate limit:** 1,000 requests per 15 minutes per IP

| Domain | Key Endpoints |
|---|---|
| **Auth** | POST /auth/register, POST /auth/login, GET /auth/google, POST /auth/refresh, GET /auth/me |
| **Boards** | GET /boards, POST /boards, GET /boards/:id, PUT /boards/:id, DELETE /boards/:id |
| **Import** | POST /boards/import *(Voice-to-launch integration)* |
| **Sections** | POST /boards/:id/sections, PUT /boards/:boardId/sections/:id, DELETE |
| **Post-its** | POST /boards/:id/postits, PUT /boards/:boardId/postits/:id, DELETE |
| **Portfolio** | GET /portfolio/dashboard, GET /portfolio/comparison, GET /portfolio/activity |
| **Subscription** | GET /subscription/current, GET /subscription/can-create-board, POST /subscription/upgrade |
| **Diagrams** | GET /diagrams, POST /diagrams, PUT /diagrams/:id, DELETE /diagrams/:id |
| **Admin** | GET /admin/login-audits, GET /admin/login-audits/stats, GET /admin/subscriptions |
| **Leads** | POST /leads |

### 4.7 Subscription Model

| Tier | Price | Board Limit | Key Capabilities |
|---|---|---|---|
| **Student** | Free | 1 board | All section types, unlimited post-its, JSON export, basic support |
| **Commercial** | $9/month | Unlimited | + Portfolio dashboard, board sharing, analytics, priority support |
| **Enterprise** | Custom | Unlimited | + SSO/SAML, API integration, dedicated manager, 24/7 SLA |

Access control is enforced server-side on every board creation. Expired subscriptions auto-downgrade to Student tier. Stripe integration is architecturally reserved in the schema but not yet active — tier changes are currently manual.

### 4.8 Security Controls

| Control | Implementation |
|---|---|
| Transport security | HTTPS enforced, HSTS via Helmet |
| CORS | Whitelist: vimpl.com, vercel.app subdomains, localhost dev |
| Rate limiting | 1,000 req / 15 min / IP (express-rate-limit) |
| Password hashing | bcryptjs, 12 salt rounds |
| Token storage | Access: Authorization header. Refresh: HTTP-only cookie |
| Input validation | Zod schema validation on all request bodies |
| SQL injection | Prevented by Prisma parameterised queries |
| Security headers | Helmet (CSP, X-Frame-Options, X-Content-Type, HSTS) |
| Audit logging | All login attempts logged (LoginAudit) with IP + user agent |
| Secrets management | Environment variables via Vercel, never committed to git |

---

## 5. Integration Architecture

### 5.1 Voice-to-launch → Visualise-to-Implement

The handover between the two products is a single authenticated API call:

```
Voice-to-launch (browser)
        │
        │  POST /api/v1/boards/import
        │  Authorization: Bearer <vimpl JWT>
        │  Content-Type: application/json
        │  Body: ProjectPlan JSON (see Section 11 for schema)
        │
        ▼
Visualise-to-Implement backend (atomic DB transaction)
        │
        ├── Creates Board         (title = plan_name, unique slug)
        ├── Creates Section       (type: weekplan, tracks × weeks grid)
        ├── Creates Postit × N    (one per task, color-coded by track)
        ├── Creates Postit × R    (one per risk, placed in risk matrix)
        └── Creates Postit × I    (one per improvement, placed in ideas matrix)
        │
        │  Response: { boardId, boardUrl, sectionId, tasksCreated }
        │
        ▼
Voice-to-launch opens boardUrl — user lands on fully-populated board
```

### 5.2 Shared Authentication

Both products share the same identity provider (Visualise-to-Implement backend Google OAuth). A user authenticates once and the same JWT token works across both applications.

---

## 6. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL PLATFORM                        │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────────────┐  │
│  │   Voice-to-launch   │   │  Visualise-to-Implement     │  │
│  │                     │   │                             │  │
│  │  Static SPA         │   │  Frontend (Static CDN)      │  │
│  │  voice-2-launch.    │   │  vimpl.com                  │  │
│  │  vercel.app         │   │                             │  │
│  │                     │   │  Backend (Serverless Fn)    │  │
│  │  Build: Vite        │   │  backend-eight-rho-46.      │  │
│  │  Output: dist/      │   │  vercel.app                 │  │
│  │  Auto-deploy: main  │   │  Max duration: 30s          │  │
│  └─────────────────────┘   └─────────────────────────────┘  │
│                                         │                   │
└─────────────────────────────────────────┼───────────────────┘
                                          │ Prisma + PgBouncer
                               ┌──────────▼──────────┐
                               │   Supabase          │
                               │   PostgreSQL 15     │
                               │   AWS eu-central-1  │
                               │   Managed backups   │
                               └─────────────────────┘
```

| Component | URL | Hosting Model | Deploy Trigger |
|---|---|---|---|
| Voice-to-launch | `voice-2-launch.vercel.app` | Vercel static CDN | Push to `main` |
| Visualise-to-Implement frontend | `vimpl.com` | Vercel static CDN | Push to `main` |
| Visualise-to-Implement backend | `backend-eight-rho-46.vercel.app` | Vercel serverless | Push to `main` |
| Database | Supabase | Managed PostgreSQL, AWS eu-central-1 | Schema migration |

---

## 7. Non-Functional Characteristics

### Scalability
- **Voice-to-launch** scales infinitely — static CDN-served SPA with no server-side state
- **Visualise-to-Implement backend** scales automatically via Vercel serverless (cold start ~200–400ms)
- **Database** scales via Supabase managed tier; PgBouncer prevents connection exhaustion

### Availability
- **Frontend (both):** Vercel global CDN — effectively 100% availability
- **Backend:** Vercel serverless — dependent on Vercel platform SLA
- **Database:** Supabase managed — 99.9% SLA on Pro tier

### Data Residency
- **Database:** AWS eu-central-1 (Frankfurt, Germany)
- **Vercel CDN:** Global edge network
- **Anthropic API:** US-based inference (process transcripts leave EU)
- **ElevenLabs API:** US-based inference (question text leaves EU)

> **Enterprise note:** Customers with strict data residency requirements should note that interview transcript content is processed by Anthropic's US-based API. An enterprise deployment option can route all Anthropic calls through a customer-controlled EU-based proxy to satisfy GDPR Chapter V transfer requirements.

---

## 8. Architecture Decision Records

| Decision | Choice | Rationale |
|---|---|---|
| Voice-to-launch has no backend | Client-side SPA only | Reduces operational complexity; API keys are user-provided per session, avoiding server-side key management |
| Anthropic called directly from browser | `dangerouslyAllowBrowser: true` | Simplifies architecture for BYOK (bring your own key) model; shifts API key responsibility to the user |
| BPMN XML generated client-side | Custom `xmlGenerator.js` | Deterministic, instant, no API cost, works offline after initial load |
| Vite + React for Voice-to-launch | SPA | Rich interactive UI with multi-panel resizable layout requiring fine-grained state management |
| Vanilla JS for Visualise-to-Implement frontend | No framework | Admin-style CRUD pages without complex UI state; eliminates build pipeline for the marketing/dashboard layer |
| PostgreSQL via Prisma ORM | Type-safe ORM | Schema migrations, full TypeScript type safety, expressive relation queries |
| JWT stateless auth | No session store | Scales horizontally without shared state; fits serverless execution model |
| Supabase over self-hosted Postgres | Managed | Built-in connection pooling, automated backups, monitoring, and point-in-time recovery out of the box |

---

## 9. Security Questionnaire

### 9.1 Authentication & Access Control

**Q: What authentication methods are supported?**
Email/password (with email verification) and Google OAuth 2.0. Both flows issue JWT access tokens (24-hour expiry) and refresh tokens (7-day, HTTP-only cookie).

**Q: Is MFA supported?**
Not currently. Google OAuth users inherit whatever MFA policy they have configured on their Google account. Native MFA (TOTP) is on the product roadmap.

**Q: How are passwords stored?**
Passwords are hashed using bcryptjs with 12 salt rounds. Plaintext passwords are never logged, stored, or transmitted after the point of hashing.

**Q: How is access to boards controlled?**
Board access is enforced server-side on every request. A user can access a board if they are the owner or an invited collaborator (view, edit, or admin permission). Public boards can be read by unauthenticated users.

**Q: Is there role-based access control (RBAC)?**
At the board level: `view`, `edit`, and `admin` collaborator permissions. At the platform level: `student`, `commercial`, and `enterprise` subscription tiers with different feature entitlements. Platform-wide admin access is controlled via a separate middleware layer.

### 9.2 Data Security

**Q: Is data encrypted in transit?**
Yes. All traffic is served over HTTPS/TLS. HTTP Strict Transport Security (HSTS) is enforced via Helmet middleware.

**Q: Is data encrypted at rest?**
Yes. Supabase PostgreSQL encrypts data at rest using AES-256 (managed by AWS).

**Q: Where is data stored geographically?**
Primary database: AWS eu-central-1 (Frankfurt, Germany). CDN edge caches (Vercel): global. Anthropic and ElevenLabs API processing: United States.

**Q: How are API keys and secrets managed?**
All secrets (database credentials, JWT signing keys, Google OAuth keys, email API keys) are stored as environment variables in Vercel's encrypted secrets store. They are never committed to source control.

**Q: What data is sent to third-party AI services?**
Only the content that the user explicitly inputs: process interview transcripts and the resulting structured JSON are sent to Anthropic for processing. Follow-up question text (1–2 sentences) is sent to ElevenLabs for voice synthesis. No PII beyond what the user voluntarily includes in their process descriptions is transmitted.

**Q: Are API keys (Anthropic, ElevenLabs) stored server-side?**
No. In the current BYOK (bring your own key) model, users provide their own API keys at runtime. Keys are held in browser memory (React state) only and are never sent to or stored on the AILEAN backend.

### 9.3 Infrastructure & Operations

**Q: How is the application hosted?**
Vercel (global CDN + serverless functions). Database is hosted on Supabase (managed PostgreSQL on AWS eu-central-1).

**Q: What is the disaster recovery approach?**
Supabase provides automated daily backups with point-in-time recovery. Vercel deployments are immutable and can be instantly rolled back to any prior deployment. Application code is version-controlled in Git.

**Q: Is there rate limiting?**
Yes. All API endpoints are rate-limited to 1,000 requests per 15-minute window per IP address, returning HTTP 429 on breach.

**Q: Is there audit logging?**
Yes. All login attempts (successful and failed) are recorded in the `LoginAudit` table with timestamp, method, IP address, and user agent. All board change events are recorded in the `EventLog` table.

**Q: Is there a vulnerability disclosure / responsible disclosure policy?**
Contact kristian.steen@vimpl.com for security disclosures. We target a 72-hour acknowledgement and 30-day remediation window for critical findings.

### 9.4 Compliance

**Q: Is the platform GDPR compliant?**
The platform stores user data in the EU (AWS eu-central-1). A Data Processing Agreement (DPA) is available for enterprise customers. See Section 10 for a full GDPR data flow analysis.

**Q: Is SOC 2 certification available?**
Not currently. Supabase (our database provider) holds SOC 2 Type II. Vercel (our hosting provider) holds SOC 2 Type II. A platform-level SOC 2 assessment is planned.

**Q: Is penetration testing performed?**
Not on a formal schedule at current stage. Planned for pre-enterprise launch.

---

## 10. GDPR & Data Privacy

### 10.1 Data Controller & Processor

| Role | Entity | Contact |
|---|---|---|
| **Data Controller** | AILEAN / vimpl | kristian.steen@vimpl.com |
| **Sub-processor: Hosting** | Vercel Inc. (US) | DPA available |
| **Sub-processor: Database** | Supabase Inc. (US) — data hosted EU | DPA available |
| **Sub-processor: AI processing** | Anthropic PBC (US) | DPA available |
| **Sub-processor: TTS** | ElevenLabs Inc. (US) | DPA available |
| **Sub-processor: Email** | Resend Inc. (US) | DPA available |
| **Sub-processor: Auth** | Google LLC (US) | Standard Contractual Clauses |

### 10.2 Personal Data Inventory

| Data Category | Fields | Location | Legal Basis | Retention |
|---|---|---|---|---|
| Account identity | name, email, avatarUrl | Supabase DB | Contract | Until account deletion |
| Authentication credentials | passwordHash (bcrypt) | Supabase DB | Contract | Until account deletion |
| OAuth identity | authProviderId (Google ID) | Supabase DB | Contract | Until account deletion |
| Login behaviour | IP address, user agent, timestamp, method | Supabase DB (LoginAudit) | Legitimate interest (security) | Not currently TTL'd — to be defined |
| Process content | Interview transcripts, BPMN diagrams, project plans | Browser localStorage + optional Supabase DB | Contract | User-controlled |
| Communication | Email address for verification, invitations | Supabase DB + Resend (transient) | Contract | Until account deletion |
| Billing (future) | Stripe customer ID | Supabase DB | Contract | Per Stripe retention policy |

### 10.3 Data Flow Diagram

```
USER
 │
 │  (1) Account creation: name, email, password
 ▼
AILEAN BACKEND (Supabase DB — eu-central-1)
 │  Stores: User, LoginAudit, Board, BpmnDiagram
 │
 │  (2) Password hash → bcrypt → stored in DB
 │      Plaintext never persisted
 │
 │  (3) Verification email → Resend API (US)
 │      Transient: email address + link
 │      Not stored by Resend after delivery
 │
USER BROWSER (Voice-to-launch)
 │
 │  (4) User types/speaks process interview
 │      Content stays in browser (localStorage draft)
 │
 │  (5) User clicks Parse → transcript sent to:
 │      Anthropic API (US) — inference only
 │      Not stored by Anthropic (per API terms)
 │      Returns structured JSON to browser
 │
 │  (6) [Optional] User enables Ailean interviewer
 │      Follow-up question text sent to:
 │      ElevenLabs API (US) — TTS synthesis only
 │      Returns audio blob to browser, not stored
 │
 │  (7) [Optional] User exports to Visualise-to-Implement
 │      Project plan JSON → AILEAN BACKEND
 │      Creates Board + Post-its in Supabase DB
 │
 │  (8) [Optional] User saves BPMN diagram to cloud
 │      XML → AILEAN BACKEND → Supabase DB
 │
```

### 10.4 Data Subject Rights

| Right | How to Exercise |
|---|---|
| Right of access | Email kristian.steen@vimpl.com — full data export available within 30 days |
| Right to rectification | Update name/email directly in account settings |
| Right to erasure | Email kristian.steen@vimpl.com — account and all associated board/diagram data deleted within 30 days |
| Right to portability | Board data exportable as JSON; BPMN diagrams exportable as .xml files |
| Right to restrict processing | Contact kristian.steen@vimpl.com |
| Right to object | Contact kristian.steen@vimpl.com |

### 10.5 International Data Transfers

Process transcript content is sent to Anthropic (US) for AI inference. This constitutes a transfer under GDPR Chapter V. Current legal basis: Anthropic's standard contractual clauses (SCCs).

For enterprise customers requiring EU-only processing: a deployment option is available to proxy all Anthropic API calls through a customer-controlled EU-based serverless function, keeping transcript data within EU borders.

---

## 11. API Integration Guide

This section is intended for enterprise customers or technical integrators who wish to connect their own systems to the Visualise-to-Implement API.

### 11.1 Authentication

All API calls require a Bearer token obtained via the authentication endpoints.

**Get a token:**
```http
POST https://backend-eight-rho-46.vercel.app/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "..." }
}
```

**Use the token:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expiry: 24 hours. Refresh via `POST /api/v1/auth/refresh` (requires valid refresh cookie).

### 11.2 Import a Project Plan

This is the primary integration endpoint — used by Voice-to-launch to create a populated board from a structured project plan.

```http
POST /api/v1/boards/import
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "plan_name": "Invoice Approval Improvement Plan",
  "process_name": "Invoice Approval Process",
  "duration_weeks": 12,
  "overview": "Text describing the overall process...",
  "scope": "In scope: ... Out of scope: ...",
  "tracks": [
    { "id": "track_1", "name": "Technology" },
    { "id": "track_2", "name": "Process" },
    { "id": "track_3", "name": "Change Management" }
  ],
  "tasks": [
    {
      "id": "task_1",
      "title": "Requirements & vendor selection",
      "track_id": "track_1",
      "week_start": 1,
      "week_end": 3,
      "owner": "IT Lead",
      "improvement_id": "imp_1"
    }
  ],
  "risks": [
    {
      "id": "risk_1",
      "title": "ERP integration delays",
      "probability": 60,
      "consequence": 70,
      "mitigation": "Engage vendor early; agree spec by week 2."
    }
  ],
  "improvements": [
    {
      "id": "imp_1",
      "title": "Automate PO Matching",
      "category": "automation",
      "effort_score": 45,
      "impact_score": 85,
      "description": "Implement automated 3-way matching.",
      "benefit": "Reduces manual checking by ~70%."
    }
  ]
}
```

**Response `201 Created`:**
```json
{
  "boardId": "3f8a2b1c-...",
  "boardUrl": "https://vimpl.com/board.html?id=3f8a2b1c-...",
  "sectionId": "7e4d9f0a-...",
  "tasksCreated": 8
}
```

**What happens internally:**
1. Subscription limit is checked (user must be able to create a board)
2. An atomic database transaction creates:
   - A `Board` with the plan name as title and a unique URL slug
   - A `Section` of type `weekplan` spanning the full duration
   - One `Postit` per task, colour-coded by track, positioned at the correct week/track cell
   - One `Postit` per risk, positioned in a risk matrix (probability vs. consequence)
   - One `Postit` per improvement, positioned in an ideas matrix (effort vs. impact)
   - Text sections for overview and scope (if provided)
3. Returns the direct URL for immediate navigation

### 11.3 Board CRUD

**List all boards:**
```http
GET /api/v1/boards
Authorization: Bearer <token>
```

**Create a blank board:**
```http
POST /api/v1/boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Lean Project",
  "description": "Optional description",
  "isPublic": false
}
```

**Get a board (with all sections and post-its):**
```http
GET /api/v1/boards/{boardId}
Authorization: Bearer <token>
```

**Update a board:**
```http
PUT /api/v1/boards/{boardId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "version": 3
}
```

> The `version` field enables optimistic concurrency control. Always pass the current version number; the server rejects the update if the board has been modified concurrently.

**Delete a board:**
```http
DELETE /api/v1/boards/{boardId}
Authorization: Bearer <token>
```

### 11.4 BPMN Diagram Storage

**Save a BPMN diagram:**
```http
POST /api/v1/diagrams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Invoice Approval v1",
  "processName": "Invoice Approval Process",
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
}
```

**List saved diagrams (no XML payload):**
```http
GET /api/v1/diagrams
Authorization: Bearer <token>
```

**Retrieve a diagram with full XML:**
```http
GET /api/v1/diagrams/{diagramId}
Authorization: Bearer <token>
```

### 11.5 Error Responses

All errors follow a consistent envelope:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

| HTTP Status | Meaning |
|---|---|
| `400` | Validation error — check request body |
| `401` | Missing or expired token |
| `403` | Authenticated but not authorised (e.g. not board owner) |
| `404` | Resource not found |
| `409` | Conflict — e.g. optimistic lock version mismatch |
| `429` | Rate limit exceeded — retry after 15 minutes |
| `500` | Internal server error |

### 11.6 Rate Limits

| Limit | Value |
|---|---|
| Requests per window | 1,000 |
| Window duration | 15 minutes |
| Scope | Per IP address |
| Response on breach | HTTP 429 |

For enterprise customers requiring higher limits, contact kristian.steen@vimpl.com.

### 11.7 API Versioning

The current API version is `v1`. The version prefix is part of the base path (`/api/v1/...`). Breaking changes will be introduced under a new version prefix with a minimum 6-month deprecation notice for `v1`.

### 11.8 Interactive API Documentation

A full Swagger UI with try-it-out functionality is available at:

```
https://backend-eight-rho-46.vercel.app/api/docs
```

The raw OpenAPI specification (JSON) is available at:

```
https://backend-eight-rho-46.vercel.app/api/docs.json
```

---

*Document prepared by AILEAN engineering. For questions, integration support, or enterprise enquiries contact kristian.steen@vimpl.com*
