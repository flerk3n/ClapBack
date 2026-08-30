# ClapBack

**A demo-first creator bounty platform: discover a campaign, upload real UGC, verify the brand ask, collect human ratings, and see the final scoreboard.**

ClapBack combines an Expo creator app with a local Express backend and a lightweight QR-linked reviewer page. The current repository is intentionally optimized for one complete, presentation-ready loop rather than production infrastructure.

## What works today

- Demo Creator sign-in and persisted mobile session
- Niche selection and swipe-based Bounty discovery
- Bounty Acceptance and active-task restoration
- Real MP4 selection, preview, multipart upload, and byte progress
- ElevenLabs transcription or deterministic mock transcription
- Deterministic phrase and maximum-duration Deliverable checks
- Semantic relevance verification using **Gemini 2.5 Flash only**
- QR-linked vertical reviewer feed with anonymous 1–5 Ratings
- Creator-controlled review close and frozen video-wise Scoreboard
- Automatic, pre-approved Uniqlo fixture videos from `backend/demo-videos/`

## Demo journey

```text
Creator signs in
  -> selects Niches
  -> accepts a Bounty
  -> uploads a real MP4
  -> watches transcription and verification progress
  -> starts human review after AI_PASSED
  -> shares or opens the QR review page
  -> reviewers rate each video
  -> Creator stops review
  -> mobile displays the ranked Scoreboard
```

The featured demo Bounty is **Uniqlo — Men's Outfit Haul**:

- Show and describe a men's outfit.
- Keep the Creator video strictly under one minute (`durationSeconds < 60`).
- Combine the real Creator upload with up to four curated fixture videos for review.

## Architecture

```text
Expo Creator app
  -> Express API
  -> local MP4 storage
  -> ElevenLabs transcription (or mock transcript)
  -> deterministic Deliverable checks
  -> Gemini 2.5 Flash relevance check
  -> AI_PASSED
  -> Express-served reviewer page
  -> anonymous Ratings
  -> frozen Scoreboard
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Creator mobile | `frontend/apps/mobile` | Auth, Bounties, Acceptances, upload, processing status, QR controls, Scoreboard |
| Shared contracts | `frontend/packages/contracts` | Canonical Zod schemas and TypeScript API models |
| Demo data | `frontend/packages/demo-data` | Mobile fixture data and stable Bounty visuals |
| Backend | `backend` | Auth, in-memory state, uploads, verification, review rounds, Ratings, Scoreboard |
| Reviewer page | `backend/public/review.html` | Mobile-first vertical video review experience |
| Canonical status | `docs/PROJECT_STATUS.md` | Implemented capabilities, validation, blockers, and next actions |

### Deliberate demo constraints

The active implementation uses in-memory state, local disk, public local playback, picker-reported duration, and manually approved folder fixtures. Supabase, durable jobs, private storage, signed uploads, production OAuth, frame-level visual inspection, and real payouts are deferred.

## Prerequisites

- Node.js and npm
- Expo Go on the test phone, or an Android emulator
- Android Platform Tools (`adb`) for USB-connected Android testing
- A Gemini API key for Bounties with `RELEVANCE` Deliverables
- An ElevenLabs API key only when using real transcription

## Installation

Install Backend dependencies:

```bash
cd backend
npm install
cp .env.example .env
```

Install mobile dependencies:

```bash
cd frontend/apps/mobile
npm install
cp .env.example .env
```

Never commit either generated `.env` file.

## Environment configuration

### Backend — `backend/.env`

Generate a local JWT secret:

```bash
openssl rand -hex 32
```

Then configure:

```env
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001
JWT_SECRET=<paste-the-generated-secret>
DEMO_CREATOR_PIN=1234
DEMO_ADMIN_PIN=5678

TRANSCRIPTION_MODE=mock
MOCK_TRANSCRIPT=Here is my complete Uniqlo men's outfit look for today
ELEVENLABS_API_KEY=

GEMINI_API_KEY=<your-google-ai-studio-key>

USE_IN_MEMORY_DB=true
UPLOADS_DIR=uploads
DEMO_VIDEOS_DIR=demo-videos
```

The PINs are local demo passwords. `EXPO_PUBLIC_DEMO_CREATOR_PIN` in the mobile app must exactly match `DEMO_CREATOR_PIN`.

For real transcription, switch to:

```env
TRANSCRIPTION_MODE=elevenlabs
MOCK_TRANSCRIPT=
ELEVENLABS_API_KEY=<your-elevenlabs-key>
```

Gemini relevance verification is locked to `gemini-2.5-flash`. There is no OpenAI or keyword-heuristic relevance fallback. A missing key, failed provider call, or invalid Gemini response causes the Submission to enter `PROCESSING_ERROR` rather than silently changing models.

### Mobile — `frontend/apps/mobile/.env`

Android emulator:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_DEMO_CREATOR_PIN=1234
```

Physical phone over the same LAN:

```env
EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3001
EXPO_PUBLIC_DEMO_CREATOR_PIN=1234
```

On macOS, find the Wi-Fi address with:

```bash
ipconfig getifaddr en0
```

Set Backend `PUBLIC_BASE_URL` to the same reachable host when a separate phone must open the reviewer URL.

## Running locally

Start the Backend in one terminal:

```bash
cd backend
npm run dev
```

Start Expo in another terminal:

```bash
cd frontend/apps/mobile
npm start
```

Backend health check:

```bash
curl http://localhost:3001/health
```

### USB-connected Android workflow

`localhost` on a phone normally points to the phone itself. Android USB reverse forwarding maps phone-local ports back to the Mac:

```bash
adb reverse tcp:3001 tcp:3001
adb reverse tcp:8081 tcp:8081
```

Use this mobile configuration:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3001
EXPO_PUBLIC_DEMO_CREATOR_PIN=1234
```

Start Expo with a clean Metro cache:

```bash
cd frontend/apps/mobile
npm start -- --localhost --clear
```

Open `exp://127.0.0.1:8081` in Expo Go. USB forwarding lasts only while the device remains connected; rerun the two `adb reverse` commands after reconnecting.

To reset Expo Go completely, including stored demo auth tokens:

```bash
adb shell pm clear host.exp.exponent
```

A second reviewer phone cannot use the first phone's USB forwarding. For cross-device QR review, use the Mac's LAN IP or an HTTPS tunnel in `PUBLIC_BASE_URL` and ensure the host firewall permits inbound traffic.

## Uniqlo demo fixture videos

Place two to four curated MP4s in:

```text
backend/demo-videos/
```

Recommended names:

```text
01-look.mp4
02-layering.mp4
03-weekend-fit.mp4
```

Rules:

- Fixtures attach only to the Uniqlo Men's Outfit Haul Bounty.
- Files are selected alphabetically, with at most four fixtures.
- Each fixture must show a men's outfit and be under one minute.
- Fixtures are manually pre-approved; the Backend does not transcribe, inspect, or derive duration from them.
- Starting review repeatedly does not duplicate them.
- Local MP4s in this folder are ignored by Git.

The resulting round contains one real Creator upload plus the curated fixtures, capped at five videos total.

## Verification behavior

| Deliverable kind | Verification |
| --- | --- |
| `SPOKEN_PHRASE` | Deterministic transcript matching |
| `MAX_DURATION` | Deterministic strict duration comparison |
| `RELEVANCE` | Structured Gemini 2.5 Flash response only |

The Uniqlo duration rule is strict: `59.99` seconds passes, while `60` seconds or unknown duration fails. The current mobile demo trusts duration reported by the Expo picker; production-grade media probing is deferred.

## Validation

Run the focused checks before presenting:

```bash
cd backend
npm run build -- --noEmit

cd ../frontend/apps/mobile
npm run typecheck
npm run lint
```

For current observed validation, known limitations, and presentation blockers, see [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Project documentation

- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — canonical current state and next actions
- [`docs/INTEGRATION_CONTRACT.md`](docs/INTEGRATION_CONTRACT.md) — active Client/Backend contract
- [`TECHNICAL_PLAN.md`](TECHNICAL_PLAN.md) — architecture and delivery plan
- [`docs/BACKEND_PLATFORM_PLAN.md`](docs/BACKEND_PLATFORM_PLAN.md) — Backend scope and deferred production design
- [`docs/FRONTEND_APP_PLAN.md`](docs/FRONTEND_APP_PLAN.md) — creator/reviewer application plan

## Security and scope

This repository is a local demo, not a production deployment. Demo PINs are intentionally simple, CORS and local playback are permissive, state is reset when the Backend restarts, and `.env` files must remain local. Do not reuse demo secrets or expose this configuration as a public production service.
