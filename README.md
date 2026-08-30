# 👏 ClapBack — Hackathon Prototype

> Gamified gig-economy app connecting brands with creators via Tinder-style swipe bounties.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys:
#   ELEVENLABS_API_KEY
#   GEMINI_API_KEY
#   OPENAI_API_KEY

npm run dev
# → API running on http://localhost:3001
```

### 2. Mobile App (Expo)

```bash
cd mobile

# For physical device: update EXPO_PUBLIC_API_URL in .env to your Mac's IP
# e.g. EXPO_PUBLIC_API_URL=http://192.168.1.X:3001

npm start
# Scan QR with Expo Go (iOS/Android)
```

---

## 📱 Demo Flow

1. **Onboarding** — Pick a creator persona (Micro/Mid/Macro influencer tier)
2. **Discover** — Swipe through bounties:
   - **→ Right**: Accept (starts deadline timer)
   - **← Left**: Decline
   - **↑ Up**: Save for later
3. **Active Tasks** — Tap any accepted bounty → Upload MP4
4. **Verification Pipeline** — Watch in real time:
   - 🎵 Audio extracted via FFmpeg
   - 🎙️ Transcribed by ElevenLabs
   - 🤖 Verified by Gemini Flash + GPT-4o-mini (dual consensus)
   - 👥 5 simulated reviewers rate your video (10s)
   - ✅ Brand Approved!
5. **Ledger** — See ClapCoins credited, Trust Score updated

---

## 🏗️ Architecture

```
ClapBack/
├── mobile/        # Expo React Native (TypeScript)
│   ├── app/       # expo-router screens
│   ├── components/
│   ├── store/     # Zustand state
│   └── lib/       # API client
└── backend/       # Node.js + Express (TypeScript)
    └── src/
        ├── routes/
        ├── services/   # ElevenLabs, Gemini, OpenAI, FFmpeg
        └── db/         # In-memory DB (10 seeded bounties)
```

## 🔑 API Keys Required

| Key | Purpose |
|-----|---------|
| `ELEVENLABS_API_KEY` | Speech-to-text transcription |
| `GEMINI_API_KEY` | Deliverable verification (LLM #1) |
| `OPENAI_API_KEY` | Deliverable verification (LLM #2) |

## 💡 ClapScore Logic

| Followers | Multiplier | Tier |
|-----------|-----------|------|
| < 10K | 1.0x | Micro |
| 10K – 50K | 1.5x | Mid |
| 50K+ | 2.0x | Macro |

INFLUENCER bounty payout = `base_payout × clap_score`

## 🎮 Backend Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/mock-instagram` | Simulate Meta OAuth |
| `GET` | `/api/bounties` | Fetch bounty deck |
| `POST` | `/api/bounties/:id/accept` | Accept bounty |
| `POST` | `/api/bounties/:id/decline` | Decline bounty |
| `POST` | `/api/bounties/:id/save` | Bookmark bounty |
| `POST` | `/api/submissions` | Upload MP4 |
| `GET` | `/api/submissions/:id/status` | Poll verification |
| `GET` | `/api/ledger` | ClapCoins balance |
| `GET` | `/health` | Health check |
