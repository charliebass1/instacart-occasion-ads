# Occasion-Based Ad Targeting — Instacart Product Concept

Interactive prototype demonstrating a new ad primitive for Instacart's retail media platform. Built as part of an APM application by Charlie Bass.

## What This Is

A React prototype showing how Instacart could use real-time basket composition to infer shopping occasions and serve contextually targeted ads — for both endemic (CPG) and non-endemic advertisers.

**5 tabs:** Occasion Engine | Brand Dashboard | Consumer UX | Economics & Strategy | About

## Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub

```bash
# From this folder:
git init
git add .
git commit -m "Occasion-based ad targeting prototype"
gh repo create instacart-occasion-ads --public --source=. --push
```

Or create the repo manually at github.com/new, then:

```bash
git init
git add .
git commit -m "Occasion-based ad targeting prototype"
git remote add origin https://github.com/YOUR_USERNAME/instacart-occasion-ads.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `instacart-occasion-ads` repo
4. Vercel auto-detects Vite — just click **Deploy**
5. Done. Your site is live at `instacart-occasion-ads.vercel.app`

Every push to `main` auto-deploys.

### Optional: Custom domain

In Vercel dashboard → Settings → Domains → add your custom domain.

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Tech Stack

- React 18 + Vite 5
- Tailwind CSS 3 (with custom Instacart brand colors)
- Lucide React icons
- Zero backend — fully static

## Author

Charlie Bass · March 2026
