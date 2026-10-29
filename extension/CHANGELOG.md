# Changelog

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
