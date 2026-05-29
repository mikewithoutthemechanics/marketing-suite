# Marrow Studio
Marketing copy studio powered by Groq with Brand Kit + History stored in Supabase.

## Easiest automation
- Deploy once with Vercel’s GitHub integration; after that every push auto-deploys (no CI setup needed).
- Supabase schema is a one-time action: run [schema.sql](file:///workspace/marketing-app/supabase/schema.sql) in Supabase SQL Editor.

## One-click Vercel deploy
Replace `<YOUR_GITHUB_REPO_URL>` with your repo URL after you push to GitHub.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<YOUR_GITHUB_REPO_URL>&project-name=marrow-studio&root-directory=marketing-app&env=SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,GROQ_API_KEY,GROQ_MODEL&envDescription=Required%20vars%20for%20Supabase%20and%20optional%20Groq%20AI%20generation&demo-title=Marrow%20Studio)

## Supabase setup (one-time)
1. Create a Supabase project
2. Open SQL Editor → run: [supabase/schema.sql](file:///workspace/marketing-app/supabase/schema.sql)
3. Copy these values from Supabase project settings:
   - Project URL → `SUPABASE_URL`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

## Vercel setup (one-time)
1. Import the GitHub repo into Vercel
2. Set Root Directory to `marketing-app`
3. Add env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY` (optional; if missing the app still works with stub output)
   - `GROQ_MODEL` (optional; default is `llama-3.1-70b-versatile`)

## Local development
```bash
cd marketing-app
cp .env.example .env
npm install
npm run dev
```
