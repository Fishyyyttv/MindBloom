# 🌱 MindBloom — AI Wellness Companion

A full-stack subscription-based AI therapy companion built with Next.js 14, Clerk, Stripe, Supabase, and Llama 3.3 70B via Groq.

## Features

- 💬 **AI Therapy Chat** — Streaming conversations powered by Llama 3.3 70B, with crisis detection and safe messaging
- 🌡️ **Mood Check-In** — Log emotions with intensity tracking and history
- 🌿 **Grounding Techniques** — 5-4-3-2-1, Body Scan, Safe Place visualization
- 🌬️ **Breathing Exercises** — Box, 4-7-8, Calm, Energizing with animated visual guides
- 🔥 **Anger Management** — 90-second wave timer, trigger mapping, cool-down tools
- 📋 **Worksheets** — 8 interactive CBT/DBT worksheets with save-to-Supabase
- 📚 **DBT/CBT Skills** — Full skill library with step-by-step walkthroughs
- 🧰 **Coping Toolkit** — Quick-access cards for right-now tools
- 📓 **Private Journal** — Encrypted diary with mood tagging and prompts
- 💳 **Stripe Subscriptions** — $9.99/month with 7-day free trial
- 🔐 **Clerk Auth** — Email + social login with subscription gating middleware

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom design system |
| Auth | Clerk |
| Payments | Stripe |
| Database | Supabase (PostgreSQL) |
| AI Model | Meta Llama 3.3 70B via Groq |
| Animation | Framer Motion |
| Deployment | Vercel |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`:

#### Clerk (https://clerk.com)
1. Create a new application
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. In Clerk dashboard → Webhooks → Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
4. Copy the webhook signing secret to `CLERK_WEBHOOK_SECRET`

#### Stripe (https://stripe.com)
1. Create a product: "MindBloom Monthly" at $9.99/month
2. Copy the Price ID to `STRIPE_PRICE_ID`
3. Copy your publishable and secret keys
4. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Supabase (https://supabase.com)
1. Create a new project
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key
4. Copy your service role key (Settings → API)

#### HUGGING FACE 
1. Sign up and create an API key
2. Add to `GROQ_API_KEY`
3. Groq hosts Llama 3.3 70B for free (generous rate limits)

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Clerk + fonts)
│   ├── globals.css                 # Global styles + Tailwind
│   ├── sign-in/                    # Clerk sign-in
│   ├── sign-up/                    # Clerk sign-up
│   ├── subscribe/                  # Stripe checkout page
│   ├── privacy/                    # Privacy policy
│   ├── terms/                      # Terms of service
│   ├── app/                        # Protected app (requires subscription)
│   │   ├── layout.tsx              # Sidebar navigation
│   │   ├── page.tsx                # Dashboard home
│   │   ├── chat/page.tsx           # AI therapy chat
│   │   ├── mood/page.tsx           # Mood check-in
│   │   ├── breathe/page.tsx        # Breathing exercises
│   │   ├── grounding/page.tsx      # Grounding techniques
│   │   ├── anger/page.tsx          # Anger management
│   │   ├── worksheets/page.tsx     # CBT/DBT worksheets
│   │   ├── skills/page.tsx         # DBT/CBT skill library
│   │   ├── coping/page.tsx         # Coping toolkit
│   │   └── diary/page.tsx          # Private journal
│   └── api/
│       ├── chat/route.ts           # Groq streaming endpoint
│       ├── diary/route.ts          # Diary CRUD
│       ├── mood/route.ts           # Mood log CRUD
│       ├── stripe/
│       │   ├── create-checkout/    # Stripe Checkout session
│       │   └── portal/             # Billing portal
│       └── webhooks/
│           ├── stripe/             # Stripe subscription events
│           └── clerk/              # Clerk user sync
├── components/
│   ├── ui/                         # Reusable UI primitives
│   └── layout/                     # Layout components
├── hooks/
│   ├── useChat.ts                  # Chat state management
│   └── useSubscription.ts          # Subscription status
├── lib/
│   ├── groq.ts                     # Groq client + system prompt
│   ├── stripe.ts                   # Stripe client + plans
│   ├── supabase.ts                 # Supabase clients
│   └── utils.ts                    # cn(), formatDate()
├── types/
│   ├── database.ts                 # Supabase table types
│   └── index.ts                    # Shared types + data constants
└── middleware.ts                   # Auth + subscription gating
```

## Deployment (Vercel)

```bash
npm run build   # Test build locally first
vercel deploy
```

Make sure to add all environment variables in Vercel's dashboard under Settings → Environment Variables.

Update your Stripe and Clerk webhook URLs to your production domain after deploying.

## Auth Flow

```
/ (Landing)
  └── /sign-up → Clerk
        └── /subscribe → Stripe Checkout (7-day trial)
              └── /app/chat → Main App (subscription gated)
```

Middleware in `src/middleware.ts` checks:
1. Is the user signed in? (Clerk)
2. Does `users.subscription_status` = `active` or `trialing`? (Supabase)
3. If not → redirect to `/subscribe`

## Crisis Safety

The AI chat includes:
- Keyword detection for crisis phrases (`suicidal`, `self-harm`, etc.)
- Immediate redirection to 988 Lifeline messaging when detected
- Crisis banner on every app page
- "Not a clinical service" disclaimers throughout

## Customization

- **Branding**: Update colors in `tailwind.config.ts` and the logo Heart icon
- **AI Personality**: Edit `THERAPIST_SYSTEM_PROMPT` in `src/lib/groq.ts`
- **Pricing**: Update `PLANS` in `src/lib/stripe.ts` and the subscribe page
- **Skills/Content**: All therapeutic content is in `src/types/index.ts` — easy to edit

## License

MIT — build on it, fork it, make it your own.
