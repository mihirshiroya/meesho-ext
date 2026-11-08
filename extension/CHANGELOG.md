# Changelog

## 1.1.0

- Campaign-wise limits: each campaign can have its own spend limit, expected ROI and auto-stop choice (Settings → Campaign-wise limits, or setup step 4). Empty fields fall back to the shop defaults.
- Auto-stop (opt-in, off by default): pauses a campaign via Meesho's `pause-campaign` endpoint when it reaches its spend limit and its ROI is below the expected ROI (or always, when no expected ROI is set). Campaigns over the limit with good ROI keep running and are re-checked every cycle.
- Optional: stop today's low-ROI campaigns when the daily total limit is crossed.
- Safety: max stops per check (default 5), one pause per campaign per IST day, session/block errors during a stop pause monitoring, failed stops alert once ("Could NOT stop… pause it manually").
- Popup lists live campaigns with spend vs limit and ROI vs expected.

## 1.0.0

- Read-only campaign-list monitor running through the logged-in Meesho tab (content script, same-origin).
- Rules: per-campaign limit, budget %, 0-order wasted spend, daily total (IST), optional minimum ROI. Dedup with a re-alert step and daily reset.
- Desktop and Telegram alerts, with desktop fallback when Telegram fails. Daily heartbeat.
- Pauses on logout, 401/403/429, captcha or non-JSON responses. Manual Resume; a logged-in page load auto-resumes after a logout.
- Jittered schedule, per-profile start offset, active hours, auto-opened pinned Ads tab, optional pagination (max 3 requests).
- Interactive setup guide (opens on install) with live checklist, Telegram chat ID auto-detect, and in-page usage/troubleshooting help.
- Popup with status, setup progress, recent alerts, Check now and Resume. Settings page with export/import (Telegram token excluded).
- Uses the `cookies` permission as a read-only fallback when `s_id` / `browser_id` are HttpOnly and not visible to page scripts.
- Mock mode and `node --test` unit tests.
