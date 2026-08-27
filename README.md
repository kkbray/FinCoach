# FinCoach Prototype

This is a mobile-first clickable prototype using fake data only.

## Open It

Best option on Windows:

Double-click `Start_FinCoach_Prototype.bat`.

That starts a tiny local preview server and opens:

`http://127.0.0.1:4173/`

Keep the server window open while using the prototype. If the page disappears or says it cannot connect, double-click the launcher again.

Alternative:

Open `index.html` directly in Microsoft Edge or Chrome. The file is bundled with its styles and scripts inline so it can still render if a browser has trouble loading nearby local assets. Some embedded browsers still block local `file://` pages, so the batch launcher is the most reliable path.

No install step is required.

## What Works

- Dynamic coach dashboard with fake financial state.
- Recommended actions that route to real prototype screens.
- Secondary action row.
- Vertical contextual feed.
- Savings Opportunities, Daily Wins, and Money Moves.
- Bottom navigation: Home, Workflows, Reports, Settings.
- Secondary screens for Bills, Transactions, Savings, Wins, Insights, Accounts, Cash Flow, Goals, Reports, and Settings.
- Simple workflows for logging a win, moving savings, reviewing a subscription, and adding funds.

## Files

- `index.html`: app shell
- `styles.css`: mobile-first visual system
- `app.js`: fake data, state engine, routing, and screens
