# ShipCheck

**Ship with intention. Not just enthusiasm.**

[Try ShipCheck](https://shipcheck-three.vercel.app) | [Open the narrated presentation](https://samfresh-ai.github.io/shipcheck-demo/) | [Read the ShipCheck report on ShipCheck](https://shipcheck-three.vercel.app/report/00000000-0000-4000-8000-000000000067)

ShipCheck is a pre-launch readiness tool for builders. Answer 20 sharp questions across five areas of product thinking, get honest AI feedback specific to your product type and stage, and leave with a shareable readiness report before real users tell you the hard way.

Built for the [Mind the Product World Product Day 2026 Hackathon](https://mindtheproduct.devpost.com/) | Theme: **Everyone Ships Now**

The hackathon is tool-agnostic for AI APIs. ShipCheck currently supports OpenAI and NVIDIA API Catalog evaluation, with Novus.ai installed as the required product analytics layer.

## The self-check

Before submitting, we ran ShipCheck on itself.

**Score: 67 - Almost Ready.**

- GREEN: user definition, current alternative, first-use clarity, analytics learning
- AMBER: urgency, completion metric
- RED: distribution plan, Day 7 retention

The public report is not a mock screenshot or a placeholder. It is the seeded ShipCheck report running on the deployed app:

https://shipcheck-three.vercel.app/report/00000000-0000-4000-8000-000000000067

The biggest weakness ShipCheck found in itself was distribution. The report called out that naming communities is not enough; the first-10-users plan needs exact people, messages, and a sequence.

The app is instrumented with Novus/Pendo so the behavior loop can be measured instead of guessed. 

## How it works

1. Tell ShipCheck about the product: name, category, stage, and one-liner.
2. Answer 20 questions across five sections: Your User, The Problem, Your Solution, Getting Users, and Measuring Success.
3. Get per-answer AI feedback scored RED, AMBER, or GREEN, with concrete next steps for RED items.
4. Share the public report URL with a co-founder, judge, investor, or teammate.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + IBM Plex Sans |
| Database | Supabase PostgreSQL |
| AI evaluation | OpenAI or NVIDIA API Catalog, per-section results streamed with SSE |
| Analytics | Novus.ai / Pendo |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |

## Local development

### Prerequisites

- Node.js 20+
- Supabase project
- OpenAI API key or NVIDIA API Catalog key
- Novus.ai account
- Vercel for deployment

### Setup

```bash
git clone https://github.com/Samfresh-ai/shipcheck.git
cd shipcheck
cp .env.example .env.local
npm install
```

Fill in `.env.local`, then run the database migration in your Supabase SQL editor:

```bash
# Copy and run this file in Supabase:
migrations/001_initial.sql
```

Seed the public sample report:

```bash
npx tsx scripts/seed-sample-report.ts
```

Start the dev server:

```bash
npm run dev
# Open http://localhost:3000
```

If Supabase env vars are absent, the app falls back to an in-memory store for local development and tests. Production should use Supabase so reports persist across serverless invocations.

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key, server-side only |
| `SHIPCHECK_AI_PROVIDER` | `auto`, `openai`, or `nvidia`; default behavior prefers OpenAI first, then NVIDIA |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_EVALUATION_MODEL` | OpenAI model for evaluation, default `gpt-5-mini` |
| `NVIDIA_API_KEY` | NVIDIA API Catalog key; `NVCF_RUN_KEY` also works |
| `NVIDIA_BASE_URL` | NVIDIA OpenAI-compatible base URL, default `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_EVALUATION_MODEL` | Comma-separated NVIDIA model list for evaluation, default `nvidia/nvidia-nemotron-nano-9b-v2` |
| `NVIDIA_MAX_TOKENS` | Per-call NVIDIA output cap, default `2500`, server-capped to `2500` |
| `NVIDIA_TIMEOUT_MS` | NVIDIA request timeout, default `30000`, server-capped to `45000`; lower values are honored |
| `NEXT_PUBLIC_NOVUS_API_KEY` | Novus/Pendo API key |
| `NEXT_PUBLIC_APP_URL` | Deployed app URL |
| `SEED_REPORT_ID` | UUID of the seeded sample report |

## Tests

```bash
npm run test
npm run test:unit
npm run test:api
```

`npm run test` runs Vitest with coverage thresholds over API routes and scoring logic.

## Deployment

```bash
vercel --prod
```

Add all environment variables in Vercel project settings before deploying. The `/api/reports` route is configured with a 60-second max function duration in `vercel.json` so per-section AI evaluation can complete.

## Project structure

```text
shipcheck/
|-- app/
|   |-- page.tsx
|   |-- check/
|   |   |-- page.tsx
|   |   `-- [step]/page.tsx
|   |-- report/[id]/page.tsx
|   |-- about/page.tsx
|   `-- api/
|-- components/
|-- src/lib/
|   |-- questions.ts
|   |-- evaluate.ts
|   |-- scoring.ts
|   `-- supabase.ts
|-- migrations/
|   `-- 001_initial.sql
`-- scripts/
    `-- seed-sample-report.ts
```

## Scoring

Five sections, weighted by product risk:

| Section | Weight | What it tests |
| --- | ---: | --- |
| Your User | 20% | Specificity of the target user |
| The Problem | 25% | Evidence of real pain, frequency, and cost |
| Your Solution | 25% | Focus, self-service clarity, and differentiated insight |
| Getting Users | 20% | Concrete first-users plan and retention thinking |
| Measuring Success | 10% | North star metric and behavioral data |

Score tiers:

| Score | Tier | Meaning |
| ---: | --- | --- |
| 82-100 | Ship It | Exceptional product thinking. Ship it and keep watching the data. |
| 62-81 | Almost Ready | Strong thinking with fixable gaps. Address the REDs. |
| 38-61 | Getting There | Foundation exists, but real holes remain. |
| 0-37 | Not Ready | Major gaps. Do not ship yet. |

## License

MIT

Built by Samfresh, Abuja, Nigeria.
