# Ephor

Public dashboard for tracking state-level performance across the 50 states plus DC using official federal data.

## Stack

- `Next.js 15` + TypeScript + App Router
- `Postgres` + `Prisma`
- `Tailwind CSS`
- `TanStack Table`
- `Recharts`
- `react-simple-maps`
- `Vercel Cron`

## Metrics in the current MVP

- Unemployment rate
- Payroll job growth
- Real GDP growth
- Population growth
- Median household income
- Poverty rate
- Bachelor's attainment
- Cost of living index
- Homelessness rate
- State spending per capita
- Taxes per capita
- Gasoline cost

## Local setup

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start Postgres locally.
   You can use the included Docker helper with `docker compose up -d`.
4. Generate Prisma with `npm run prisma:generate`.
5. Bootstrap the database and load data with `npm run bootstrap:data`.
6. Start the app with `npm run dev`.

## Environment variables

- `DATABASE_URL`
- `CRON_SECRET`

`BEA_API_KEY` and `CENSUS_API_KEY` are not required by the current ingest pipeline.

## Publish to GitHub

1. Create a new GitHub repository.
2. Push this project to that repository.
3. Confirm GitHub Actions is enabled for the repo.

This repo includes a CI workflow at `.github/workflows/ci.yml` that runs lint, tests, and build on every push and pull request.

## Recommended GitHub repo settings

After publishing the repo, these settings are worth turning on:

1. Protect `main`.
   Require pull requests before merging, require the CI workflow to pass, and block force pushes.
2. Enable auto-delete for head branches after merge.
3. Allow squash merges.
   This works well for the small, reviewable PRs this project will likely use.
4. Add repository secrets only if you later move any deploy or data bootstrap tasks into GitHub Actions.
   The current setup does not require production secrets in GitHub.

## Deploy to Vercel

1. In Vercel, choose `Add New...` -> `Project`.
2. Import the GitHub repository for this app.
   For this repo, select `danielmcauley/ephor`.
3. Attach a Postgres database.
   Recommended: Neon via the Vercel Marketplace.
4. Add these production environment variables in Vercel:
   - `DATABASE_URL`
   - `CRON_SECRET`
5. Deploy the project.

## Connect this repo to Vercel

These are the exact settings to use for the published GitHub repo:

1. In Vercel, import `danielmcauley/ephor`.
2. Keep the framework preset as `Next.js`.
3. Set the production branch to `main`.
4. Leave preview deployments enabled so PRs and feature branches get shareable preview URLs.
5. Add the production environment variables before the first production deployment:
   - `DATABASE_URL`
   - `CRON_SECRET`
6. Attach the Postgres integration and confirm the resulting `DATABASE_URL` points at the production database.
7. Deploy once, then run the one-time bootstrap command against the production database.
8. After bootstrap finishes, open the site, `/methodology`, and `/api/metadata` to confirm production data loaded correctly.

## One-time production bootstrap

After the first deployment, run the data bootstrap once against the production database:

```bash
DATABASE_URL="your-production-database-url" npm run bootstrap:data
```

That will:

- apply the Prisma schema
- seed jurisdictions and metric definitions
- ingest the latest source data

## Scheduled refreshes

Daily refresh is already configured in `vercel.json`:

- path: `/api/cron/ingest`
- schedule: `0 13 * * *`

The ingest route expects `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set. Vercel cron can send that automatically when the secret is configured in the project environment.

## Production checklist

1. Open the deployed site and verify the homepage loads.
2. Check `/methodology` for refresh status across metrics.
3. Check `/api/metadata` for machine-readable refresh output.
4. Add a custom domain in Vercel.
5. Trigger a manual redeploy after any environment variable changes.

## Notes

- This app is public and read-only in the MVP.
- Rankings are metric-specific. There is no overall composite score in v1.
- The app serves the latest available period per metric rather than forcing one shared reporting date.
