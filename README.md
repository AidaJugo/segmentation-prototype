# Loan Segmentation Prototype

Interactive prototype for defining loan portfolio segments using dimension-based rules.

## Live URL

https://segmentation-theta.vercel.app

## Getting started

You need Node.js installed (v18 or later).

1. Unzip the folder
2. Open a terminal in the `segmentation` directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:5173 in your browser

## Deployment options

### Vercel (preferred)

We use Vercel for hosting. To deploy your own copy:

1. Install the Vercel CLI: `npm i -g vercel`
2. From the `segmentation` folder, run: `vercel`
3. Follow the prompts (defaults work fine)
4. To update after changes: `vercel --prod`

### Replit

1. Create a new Repl and import this folder (upload zip or connect via git)
2. In the Shell tab, run:
   ```bash
   npm install
   npm run dev -- --host
   ```
3. Replit will detect the port and provide a public URL

## What it does

- Create segment groups and nested segments
- Select dimensions for segmentation (80 loan dimensions organized by category)
- Define buckets for range dimensions (e.g., FICO score ranges)
- Build rules with conditions (AND logic) and exceptions
- View matched instruments, balance coverage, and unassigned instruments
- Overlap prevention: values already used by other segments are greyed out
- Overlap detection: warns when instruments match multiple segments across dimensions

## Known limitations

- Synthetic data (200 loan instruments, 80 dimensions)
- State is in-memory only (refreshing resets everything)

## Tech stack

React, TypeScript, Vite, Tailwind CSS
