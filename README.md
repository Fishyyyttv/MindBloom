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

## Crisis Safety

The AI chat includes:
- Keyword detection for crisis phrases (`suicidal`, `self-harm`, etc.)
- Immediate redirection to 988 Lifeline messaging when detected
- Crisis banner on every app page
- "Not a clinical service" disclaimers throughout
