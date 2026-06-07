# ShipCheck

Ship with intention. Not just enthusiasm.

ShipCheck is a pre-launch readiness tool for builders. Answer 20 sharp questions across 5 areas of product thinking, get honest AI feedback specific to your product type, and receive a shareable readiness score before you ship.

Built for the Mind the Product World Product Day Hackathon 2026. We ran ShipCheck on ShipCheck before submitting. Score: 67. See the report: `/report/00000000-0000-4000-8000-000000000067`

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project
- An OpenAI API key
- A Novus.ai account
- Vercel for deployment

### Local Development

1. Clone the repo.
2. `cp .env.example .env.local` and fill in values.
3. `npm install`
4. Run `migrations/001_initial.sql` in Supabase SQL editor.
5. `npx tsx scripts/seed-sample-report.ts` to seed the sample report.
6. `npm run dev` and open `http://localhost:3000`.

If Supabase env vars are absent, the app uses a local in-memory fallback for development and tests. Production should use Supabase.

## Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key, server-side only |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_EVALUATION_MODEL` | OpenAI model for evaluation, default `gpt-5-mini` |
| `NEXT_PUBLIC_NOVUS_API_KEY` | Novus/Pendo API key |
| `NEXT_PUBLIC_APP_URL` | Deployed app URL |
| `SEED_REPORT_ID` | UUID of seeded sample report |

## Running Tests

```bash
npm run test
npm run test:unit
npm run test:api
```

`npm run test` runs Vitest with coverage thresholds on API routes and scoring logic.

## Deployment

```bash
vercel --prod
```

Add all env vars in Vercel project settings before deploying. The report API route is configured with a 60-second function duration in `vercel.json`.

## Tech Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + IBM Plex Sans
- Supabase PostgreSQL
- OpenAI API, default `gpt-5-mini`, per-section evaluation streamed to the client with SSE
- Novus.ai analytics
- Vercel

## License

MIT
