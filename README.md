# Overflow Budget V2

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


## V2 corrections
- Current checking is editable directly from Home.
- Checking supports negative balances such as `-99`.
- Safe to Spend Today never uses future income.
- Recovery Mode activates below the protected checking floor.
- Next money in and after-payday projection are shown separately.
- Balance freshness warnings appear after 72 hours.
- Payday allocation follows recovery priorities before savings.
- iPhone touch behavior is hardened against accidental double-tap zoom.


## V2.2 paycheck model
- $1,680 is treated as the employer-side paycheck amount before the three fixed $100 allocations.
- $100 401(k), $100 Roth IRA, and $100 HYSA are non-negotiable and occur before checking.
- Only $1,380 is treated as the checking deposit.
- Variable categories are programmable per pay cycle.
- Each variable category can be set to $0 or turned off when it is not currently needed.
- Spending entered against a category reduces only that category's remaining need.


## V2.3 payroll flexibility
- Paycheck before allocations is editable.
- 401(k), Roth IRA, HYSA, and an optional Other payroll deduction are editable independently.
- The checking deposit is calculated automatically from those values.
- Changes immediately update the paycheck plan and projections.


## V2.4 bill checklist
- Upcoming bills now have a checklist on Home.
- Marking a bill paid turns it green.
- Paid bills remain visible for confirmation but contribute $0 to future required allocations.
- Paid status is tracked by bill and month, so marking August phone paid does not mark September phone paid.
- Bills can also be marked/unmarked directly from upcoming-event cards.
