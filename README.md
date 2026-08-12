# Overflow Budget

A private, local-first Progressive Web App tailored for payday-first budgeting.

## Starting plan included
- $1,680 paycheck every 14 days, next payday 2026-08-21
- $600 income on the 1st of each month
- $100 Roth IRA + $100 HYSA transfer per paycheck
- $100 401(k) contribution tracked separately
- $250 protected checking floor, with a $1,000 goal
- Recurring bills and monthly essentials
- $800 starting credit-card debt
- Separate Eclipse Collectibles business area

## Run locally on Windows
Opening `index.html` directly works for most app features, but installation/offline/service workers require HTTPS or localhost.

From the folder, if Python is installed:
    python -m http.server 8080

Then open:
    http://localhost:8080

## Put it online free
Recommended: GitHub Pages.
1. Create a free GitHub account/repository.
2. Upload all files in this folder to the repository root.
3. Repository Settings > Pages.
4. Under Build and deployment, choose Deploy from a branch.
5. Select `main` and `/ (root)`, Save.
6. Open the generated HTTPS Pages address on iPhone Safari.
7. Share > Add to Home Screen > turn on Open as Web App > Add.

## Important iPhone limitation
A Home Screen web app can install like an app and can request web notifications, but a true iOS Home Screen widget is implemented with Apple's WidgetKit and therefore requires a native iOS app build. This PWA includes the same at-a-glance information on its Home screen.

## Data privacy
Version 1 stores your balances and budget data in the browser's localStorage on that device. It does not transmit banking data anywhere. Export a backup periodically from More > Data.

## Items to confirm
The renter's-insurance due date was not specified, so it is included with "date needed". Edit it in More > Recurring bills.
