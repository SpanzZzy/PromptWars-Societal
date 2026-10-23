# PromptWars-Societal — SignalBridge 🌉
> **Universal Bridge Between Human Intent and Complex Real-World Civic Systems**  
> *AI-powered civic intelligence, multilingual public welfare navigation, and actionable community safety.*

---

## 1. Product Vision

Citizens often encounter critical real-world problems—dangerous road potholes, exposed live high-voltage wiring, burst water pipelines, or complicated public welfare paperwork—but struggle to communicate them effectively to institutions. Their input may be an emotional message in Marathi or Hindi, a smartphone photograph of broken asphalt, a voice recording with heavy ambient street noise, or a complex government notice PDF.

**SignalBridge** converts unstructured, multilingual community input into structured, evidence-backed reports with concrete, step-by-step resolution pathways:

$$\text{Report} \longrightarrow \text{Extract / Transcribe} \longrightarrow \text{Review} \longrightarrow \text{Analyze with Gemini} \longrightarrow \text{Verify Evidence} \longrightarrow \text{Structured Report} \longrightarrow \text{Recommend Next Steps}$$

---

## 2. Core Workflows Implemented

1. **Civic Safety & Infrastructure Hazards**:
   - Potholes, road aggregate collapses, open electrical feeder junction boxes, live sparking wiring, storm drain blockages.
   - Automatic emergency hazard detection with immediate advisories for national helplines (**112**, **101**, **108**, **1912**).
   - Automated routing to municipal desks (e.g., BMC Ward Offices, PMC Care Portal, MSEDCL emergency dispatch).
2. **Document & Public-Service Assistance**:
   - Senior citizen pension discrepancies, Jeevan Pramaan biometric mismatch guidance, ration card Aadhaar linkage, official public notices.
   - Missing information warnings, alternative procedural pathways (e.g., Jeevan Pramaan Face RD app without branch visit), and document preparation checklists.

---

## 3. Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, no loose any)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a restrained, accessible civic design system
- **AI Engine**: Official [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK with `gemini-2.5-flash` / `gemini-1.5-flash`
- **Schema Validation**: [Zod](https://zod.dev/) canonical shared schema across client and server
- **Mapping**: [Leaflet](https://leafletjs.com/) with [OpenStreetMap](https://www.openstreetmap.org/) standard tiles and strict attribution
- **Icons**: [Lucide React](https://lucide.dev/)
- **Test Runner**: [Vitest](https://vitest.dev/) (29 unit & integration tests)

---

## 4. Key Architectural Pillars

### A. Universal Multilingual Intake
- **Typed and Pasted Text**: Up to 10,000 characters.
- **In-Browser Audio Recording**: Native HTML5 `MediaRecorder` API with waveform animation, live timer, and audio playback.
- **Multilingual Support**: Spoken and written **Marathi (मराठी)**, **Hindi (हिंदी)**, **English**, and code-switching (Hinglish/Marathi-English).
- **Supported File Uploads**: Photos (JPEG, PNG, WebP), Audio (MP3, WAV, WebM, M4A, OGG), and Documents (PDF, TXT) up to 10MB per file.
- **Prompt Injection Defense**: Untrusted user inputs are wrapped in isolation delimiters (`formatUntrustedContent`) with explicit system instructions to prevent prompt override attacks.

### B. Two-Stage Processing Architecture
1. **Stage A — Extract and Review**: Transcribes spoken audio, extracts text/dates/serial codes from images and PDFs, detects language with confidence levels, and displays an editable review screen. The citizen can correct names, landmarks, or spellings before analysis.
2. **Stage B — Analyze and Act**: Generates a strict structured report validated by Zod. Facts are categorized by **provenance**:
   - `user_reported`: Citizen statements without third-party proof.
   - `extracted_from_source`: Visible in uploaded images, documents, or audio codes.
   - `needs_confirmation`: Technical claims requiring field supervisor inspection.
   - `independently_verified`: Corroborated by official government registries.
   - *AI confidence scores are never presented as proof.*

### C. Live Community Map (Leaflet + OpenStreetMap)
- Displays only explicitly approved, moderated public reports.
- **Location Approximation**: Residential addresses and exact GPS coordinates are generalized to ward or street levels for citizen privacy.
- Standard OpenStreetMap attribution: `© OpenStreetMap contributors` linked to [https://www.openstreetmap.org/copyright](https://www.openstreetmap.org/copyright).
- **Synchronized List Alternative**: Fully responsive list view toggle for mobile devices, screen readers, or when map tiles fail.

### D. Protected Admin Moderation Portal (`/admin`)
- Accessible via `/admin/login`.
- Server-side authentication using **scrypt salted password hashing** (`crypto.scryptSync`) and constant-time HMAC-signed HTTP-only session cookies.
- Moderation queue with filters by domain, workflow status, and urgency.
- Real moderation controls: update status (`submitted` → `under_review` → `action_taken` → `resolved`), toggle public map visibility (`approved`, `pending`, `private`, `rejected`), and add internal administrative notes.
- *Clear distinction*: Admin approval does not automatically mark an incident as independently verified.

### E. Privacy, Data Protection & Self-Service Deletion
- Accessible `/privacy` and `/terms` pages.
- Every created report receives a private `deleteSecret`.
- **Right to Erasure**: Users can permanently purge their report and associated data at any time via `/api/reports/[id]/delete`.

### F. Optional User-Provided Gemini Backup Key
- Default mode uses the server-configured `GEMINI_API_KEY`. Normal citizens are never prompted for an API key.
- If the server key is unconfigured or hits rate limits (`429`), an optional action is offered: *"Use my own Gemini key"*.
- The key is held strictly in client-side memory for the active session, transmitted over HTTPS only for that specific authorized call, and **never saved** to cookies, localStorage, databases, or logs.
- Includes explicit unchecked consent checkboxes and a *"Forget Key"* option.

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24.20.0, npm 11.19.0)

### 1. Installation
```bash
git clone <repository-url>
cd SignalBridge
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory (a template is provided in `.env.local.example`):

```bash
# Optional: Google Gemini API Key (obtain from https://aistudio.google.com/apikey)
# If left empty, SignalBridge seamlessly runs in Demo Mode with full local simulation.
GEMINI_API_KEY=

# Server-Side Admin Demo Authentication
ADMIN_USERNAME=admin

# Salted scrypt password hash format: <salt>:<hash>
# Default credentials for local demo: username "admin", password "b174f4feb8303c1ec8199fcf"
ADMIN_PASSWORD_HASH=1bf79c25b663ede40c9a1a9e7e48e6ff:203b2c2883076e1a2148d6f895751f4dfdc60b0947766e3002549d56e0963046f9b118689547da52614a033c54e0eaafd4b6ccee9c7fab6afb68a361955ca6f1

# Session cookie secret (64-char random hex)
ADMIN_SESSION_SECRET=1d9d15cdf3d827bf2bd90a4a384e7cc77776628f2ef3107cc3841095e651cedf

# OpenStreetMap Configuration
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build and Run Production Server
```bash
npm run build
npm start
```

### 5. Run Automated Tests
```bash
npm run test
```
Runs 29 comprehensive Vitest unit and integration tests covering schemas, upload security, admin auth, repository persistence, and the 3-workflow evaluation dataset.

---

## 6. Admin Demo Login Details

| Parameter | Value |
| :--- | :--- |
| **Login Route** | [/admin/login](http://localhost:3000/admin/login) |
| **Username** | `admin` |
| **Password** | `b174f4feb8303c1ec8199fcf` |
| **Storage Security** | Stored strictly as salted scrypt hash in git-ignored `.env.local` |

---

## 7. Automated Test Results Summary

```
Test Files  5 passed (5)
     Tests  29 passed (29)
  Duration  519ms

✓ src/tests/schema.test.ts (5 tests)
  - validates complete compliant SignalReport
  - rejects invalid urgency levels
  - enforces strict provenance enums
  - strips internal secrets in PublicSafeReportSchema
  - enforces non-empty title and summary

✓ src/tests/sanitizer.test.ts (8 tests)
  - validates allowed audio/image/document MIME types
  - rejects dangerous/executable files
  - enforces 10MB per-file size boundary
  - strips directory traversal and null bytes in filenames
  - verifies prompt injection isolation wrappers
  - blocks loopback/intranet SSRF attempts (localhost, 127.0.0.1, 10.x, 192.168.x)

✓ src/tests/auth.test.ts (6 tests)
  - verifies password against scrypt salt:hash
  - rejects incorrect passwords and malformed hashes
  - validates username + password combinations
  - creates and verifies HMAC-signed session tokens
  - rejects tampered session tokens

✓ src/tests/repository.test.ts (5 tests)
  - initializes with seed demo reports
  - filters approved public reports and masks private fields
  - updates workflow status and administrative notes
  - enforces self-service deletion via deleteSecret
  - computes real-time operational statistics

✓ src/tests/gemini.test.ts (5 tests)
  - detects backup key eligibility (quota, missing key, invalid key)
  - rejects backup key for unrelated errors
  - evaluates Marathi voice report (live wires hazard)
  - evaluates Hindi road infrastructure report (pothole damage)
  - evaluates English document assistance report (pension certificate)
```

---

## 8. Limitations & Hackathon Scope

- **No Emergency Dispatch**: SignalBridge is not a 911/112 operator. Life-threatening emergencies are directed to national helplines.
- **Municipal Integration**: SignalBridge generates actionable dossiers and links to official portals (e.g., BMC, PMC, MSEDCL, CPGRAMS); it does not claim automated API integration with proprietary municipal dispatch systems without formal government agreements.
- **Ground Verification**: All community reports require physical verification by ward officers before being designated as certified public records.

---

*SignalBridge — Built with Google Gemini for Hack2Skill × GDG.*
