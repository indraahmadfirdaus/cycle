# Cycle

A mobile-first, inclusive period and rhythm tracking app with AI-powered insights and partner care sharing. Built with Next.js 14, Supabase, and Tailwind CSS.

---

## What is Cycle?

Cycle helps people track their menstrual cycle, daily moods, body symptoms, and energy rhythms. It goes beyond basic period tracking — the app predicts cycle phases, offers AI-driven gentle answers, and lets users optionally share select insights with a trusted partner.

### Who is it for?

- **Cycle trackers** — anyone who menstruates and wants to understand their body patterns
- **Rhythm trackers** — people focused on energy, sleep, and mood without cycle tracking
- **Partners** — loved ones who want to offer better support with informed, consent-based sharing

### Core experience

1. **Phase Hero** — a beautiful ring visualization of where you are in your cycle (Menstrual, Follicular, Ovulation, Luteal) with predictions for your next period, fertile window, and PMS window. The primary button is context-aware: during your period it shows "End my period", otherwise "My period started".
2. **Quick Check-In** — log your mood and symptoms in seconds with emoji-driven pickers
3. **Calendar** — browse any month, tap a day to record bleeding, flow intensity, feeling, and symptoms
4. **Ask AI** — ask questions about how you're feeling and get gentle, phase-aware responses
5. **Partner Care** — generate a share code, connect with a partner, and choose exactly what they see (phase, period date, mood, symptoms)
6. **Body Rhythm** — track daily energy and sleep on a 1–5 scale

### How partner sharing works

Cycle lets you invite someone you trust to see select insights about your cycle — so they can support you better, without over-sharing.

**For the person tracking (you):**
1. Go to the **Partner** tab
2. Under "Share a care code", tap **Create code** — you'll get a 5-character code (e.g. `A1B2C`)
3. Send that code to your partner through any channel (text, WhatsApp, in person)
4. Under "What feels okay to share", toggle exactly which data is visible:
   - **Phase** — your current cycle phase (Menstrual, Follicular, etc.)
   - **Period date** — when your next period may start
   - **Mood** — how you're feeling today
   - **Symptoms** — what your body is showing
5. You can pause sharing or change toggles anytime — changes take effect immediately

**For the partner (your boyfriend, girlfriend, friend, or family):**
1. They create their own Cycle account
2. Go to the **Partner** tab
3. Under "Enter a care code", type the 5-character code you shared
4. Tap **Join** — they're now connected
5. The Partner card updates to show only the data you chose to share:
   - Your current phase (e.g., "Luteal") or "Kept just for you" if hidden
   - Your next period prediction or "Kept just for you"
   - Your today's mood or "Kept just for you"
   - A care idea based on your phase (e.g., "During Luteal, patience and practical help can mean a lot.")
6. They can pause the connection from their side at any time

**Under the hood:**
- Partner connections are bidirectional — both people must have an account
- Share codes are generated server-side, stored in the `partners` table
- Visibility toggles are per-field and enforced at both the API and UI level
- No data leaves your account — the partner's view is a filtered read-only projection

### Privacy first

All data belongs to the user. Partner sharing is opt-in, granular, and reversible. No tracking pixels, no third-party analytics. The AI endpoint uses DeepSeek when configured and falls back to a safe local response otherwise.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 with custom design tokens |
| Icons | Lucide React |
| State | Zustand with `persist` middleware (localStorage) |
| Backend | Supabase (Postgres, Auth, RLS) |
| AI | DeepSeek API (optional, server-side only) |
| Date utils | date-fns |
| Auth | Supabase Auth (email/password + Google OAuth) |

---

## Project Structure

```
├── app/
│   ├── api/                  # API route handlers
│   │   ├── ai/               # AI chat + insights
│   │   ├── cycle/            # Cycle log, history, predictions
│   │   ├── notifications/    # Push notification subscriptions
│   │   └── partner/          # Partner invite, connect, visibility
│   ├── auth/                 # Supabase auth page
│   ├── layout.tsx            # Root layout with font + metadata
│   └── page.tsx              # App entry (redirects to /auth if unauthenticated)
├── components/
│   └── cycle-app.tsx         # Main SPA shell + all view components
├── lib/
│   ├── cycle.ts              # Cycle math: phase detection, prediction engine, calendar helpers
│   ├── store.ts              # Zustand store with localStorage persistence
│   ├── api/route-helpers.ts  # Shared auth + Supabase helpers for API routes
│   └── supabase/             # Supabase client (browser + server + admin)
├── supabase/
│   └── schema.sql            # Database schema + RLS policies
├── middleware.ts             # Auth redirect for protected routes
├── tailwind.config.ts        # Custom color tokens (berry, rose, petal, luteal, etc.)
└── README.md
```

---

## Architecture

### Data Flow

```
User → Browser (React SPA) → Supabase Auth → Zustand Store (local)
                                  ↓
                          API Routes (Next.js)
                                  ↓
                    Supabase Postgres (RLS-enforced)
                                  ↓
                     DeepSeek API (optional, server-side)
```

### State Management

Zustand with `persist` middleware stores all user data in localStorage and syncs to Supabase via API routes. Key slices:

- **Cycle logs** — period start dates, cycle history
- **Daily logs** — mood, flow, symptoms per date
- **Rhythm logs** — energy, sleep, mood per date
- **Partner** — connection code, partner name, visibility toggles
- **Profile** — display name, tracking mode, notification preferences

### Prediction Engine (`lib/cycle.ts`)

- `predictCycle()` — computes rolling average cycle length, predicts next period date, ovulation date (14 days before), PMS window (7 days before), confidence level, and irregular-cycle range
- `getCurrentPhase()` — determines user's current phase (menstrual / follicular / ovulation / luteal) and current day number
- All predictions use lightweight rolling averages — no ML required

### API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/cycle/log` | Create or update a daily log or period start |
| `GET` | `/api/cycle/history` | Fetch user's cycle log history |
| `GET` | `/api/cycle/predict` | Return computed predictions |
| `POST` | `/api/partner/invite` | Generate a 5-char partner share code |
| `POST` | `/api/partner/connect` | Join a partner via share code |
| `PATCH` | `/api/partner/visibility` | Update per-field sharing toggles |
| `POST` | `/api/ai/chat` | Submit a question, get phase-aware AI reply |
| `GET` | `/api/ai/insight` | Daily insight based on current phase + logs |
| `POST` | `/api/notifications/subscribe` | Register push notification subscription |

All routes are protected — they extract the Supabase session server-side and enforce row-level security.

### Database (`supabase/schema.sql`)

Tables with RLS policies:

- `profiles` — user display name, tracking mode, notification prefs
- `cycle_logs` — period start dates (one per cycle)
- `daily_logs` — mood, flow, symptoms per date
- `rhythm_logs` — energy, sleep per date
- `partners` — bidirectional partner connections with codes
- `partner_visibility` — per-field sharing toggles
- `push_subscriptions` — web push notification endpoints

---

## Key Design Decisions

### Why a single `cycle-app.tsx` component?

The app is intentionally a single-page shell with tab navigation. This avoids unnecessary page transitions for a mobile-first wellness tool where users switch between views frequently. Each "view" is a component within the same file, sharing the same Zustand store instance.

### Why Supabase?

Supabase provides auth (email + OAuth), Postgres with RLS, and real-time subscriptions — all with zero infrastructure overhead. The RLS policies ensure data isolation per user without writing custom access-control middleware.

### Why rolling averages over ML?

The prediction engine uses simple rolling averages with confidence scoring. This is:
- Deterministic and explainable (users can understand how predictions work)
- Zero cold-start problem (works with just one logged cycle)
- No server cost beyond basic compute
- Gracefully handles irregular cycles with a wider prediction window

---

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env.local`:

```env
DEEPSEEK_API_KEY=            # Optional — enables AI chat
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-only
VAPID_PUBLIC_KEY=            # Optional — web push
VAPID_PRIVATE_KEY=           # Server-only, optional
```

The service role key and DeepSeek key are never exposed to the browser.
