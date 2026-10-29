# Meesho Ads Spend Monitor

A Chrome extension (Manifest V3) that checks your Meesho Supplier Panel ad spend every 15–25 minutes and alerts you on desktop and Telegram when campaigns cross your limits.

- **Read-only.** It only calls the campaign *list* endpoint. It never pauses, edits or creates campaigns.
- **No credentials.** It reuses your already-logged-in Meesho tab. It never asks for or stores your password or OTP.
- **Safe by default.** It runs at low frequency with random jitter, and stops completely on any logout, block or captcha.

> An interactive setup guide opens automatically after install. You can reopen it any time from the popup (**Setup & help guide**) or from Settings.

---

## 1. Install (once per Chrome profile)

1. Download or copy this `extension/` folder to your PC, for example `C:\meesho-ads-monitor`.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder that contains `manifest.json`.
5. Pin the extension: puzzle icon → pin **Meesho Ads Spend Monitor**.

The **Setup guide** tab opens and walks you through the steps below with live checkmarks.

## 2. Set up each profile

| Step | What to do |
|---|---|
| Connect account | Log in to supplier.meesho.com in this profile and open **Ads**. The account is detected from the URL. |
| Request body | DevTools (F12) → **Network** → filter `fetch-campaign-list` → reload → click the request → **Payload** → *view source* → copy → paste into the guide. |
| Limits | Set a per-campaign ₹ limit, a daily total ₹ limit, or both. Give the shop a label such as "Shop A". |
| Alerts | Leave desktop notifications on, and/or connect Telegram (below). |
| Test | Click **Send test alert**, then **Check now**. |

> ⚠️ Copy only the **Payload**. Never copy request **Headers** or cookies (`connect.sid`, `s_id`, `bm_sv`, `_abck`). If you ever shared them, log out of Meesho and back in.

### Telegram bot token and chat ID

1. In Telegram, open **@BotFather** → send `/newbot` → choose a name and username.
2. Copy the token it gives you (`123456:ABC…`) into **Bot token**.
3. Open your new bot and send it any message, such as `/start`.
4. Click **Detect chat ID**. It fills in automatically.
5. Save, then **Send test alert**.

Use the **same bot and chat** in every profile. Each message starts with the shop label.

### Multiple shops

1. In the first profile: **Settings → Export settings**. This saves limits and the request body, but not the Telegram token.
2. In each other profile: Load unpacked (same folder) → log in to that shop → open Ads → **Settings → Import settings**.
3. Re-enter the Telegram token, set the shop label, and give each profile a different **Start offset** (0, 7, 14, 21…).

## 3. Daily use

- Keep **Chrome open**, keep each profile **logged in to Meesho**, and keep the **PC awake**. The extension reopens a closed Ads tab as a pinned background tab.
- Checks only run in **active hours** (default 08:00–23:00 IST). A **heartbeat** message at 21:00 confirms it's alive.
- The **toolbar badge**: no badge = healthy · `SET` = setup incomplete · `!` = paused, needs you.

| Alert | Meaning |
|---|---|
| ⚠️ Per-campaign limit | A LIVE campaign has spent ≥ your per-campaign ₹ limit |
| ⚠️ Budget % used | A LIVE campaign has used ≥ 80% (configurable) of its budget |
| ⚠️ Spend with 0 orders | Spend ≥ ₹50 (configurable) with no orders |
| 🚨 Daily limit crossed | Campaigns started today (IST, any status) have spent ≥ your daily limit in total |
| ⛔ Monitoring paused | Logout, HTTP 401/403/429, captcha or non-JSON response. Log in, then click **Resume** |
| 💚 Heartbeat | Daily "alive" message with today's spend |

Each alert is sent once per campaign and rule. It repeats only after spend rises by another ₹50 (**Re-alert step**). Alert memory resets at midnight IST.

## 4. Troubleshooting

- **"Open the Meesho Ads page once…"**: open Ads in this profile so the account identifier can be detected.
- **"Request body not configured / not valid JSON"**: repeat the Payload copy step. Tick *Use demo data* to test alerts without it.
- **Paused: session expired or blocked**: log in again in the Meesho tab and solve any captcha, then click **Resume**. It never auto-retries a block.
- **No desktop pop-up**: allow Chrome in OS notification settings (Windows: Settings → System → Notifications; turn off Focus assist).
- **Telegram "chat not found"**: message the bot first, then click Detect chat ID again.
- **No heartbeat**: Chrome was closed, the PC slept, or the heartbeat time is empty in Settings.
- **Only 10 of many campaigns seen**: enter the pagination field name from the Payload under **Settings → Advanced**. The extension fetches at most 3 pages per check.

## Development

No dependencies and no build step. To run the unit tests:

```bash
cd extension
node --test tests/*.test.js
```

Mock mode (**Settings → Advanced → Use demo data**) feeds `fixtures/sample-response.json`, with today's dates, through the full alert path.

### Manual test checklist

- [ ] Send test alert → desktop and Telegram both received
- [ ] Mock mode → Check now → budget % and 0-order alerts arrive once; a second Check now sends nothing
- [ ] Log out of Meesho → Check now → "Monitoring paused" alert; badge `!`; log in → Resume
- [ ] Wrong Telegram token → alert still shows on desktop with a "Telegram failed" note
- [ ] Two profiles with offsets 0 and 7 → checks staggered (see "Next check" in the popup)
