export type GuideStep = {
  id: string
  title: string
  summary: string
  items: string[]
  warning?: string
}

export const installSteps: GuideStep[] = [
  {
    id: 'install',
    title: 'Load the extension in Chrome',
    summary: 'Do this once in every Chrome profile that has a Meesho shop.',
    items: [
      'Download this project (top-right menu → Download ZIP) and unzip it. The extension lives in the extension/ folder.',
      'Open chrome://extensions and turn on Developer mode (top right).',
      'Click Load unpacked and select the extension folder, the one that contains manifest.json.',
      'Click the puzzle icon in the toolbar and pin Meesho Ads Spend Monitor.',
    ],
  },
]

export const setupSteps: GuideStep[] = [
  {
    id: 'account',
    title: 'Connect your Meesho account',
    summary: 'No passwords. The extension reuses your existing login.',
    items: [
      'In the same Chrome profile, log in to supplier.meesho.com as usual.',
      'Open Ads from the left menu. The URL should look like /panel/v3/new/ads/<id>/advertisement.',
      'Keep the tab open. The account is detected automatically and the guide turns green.',
    ],
  },
  {
    id: 'body',
    title: 'Copy the request body (one time)',
    summary: 'This tells the extension exactly which campaign list to read.',
    items: [
      'On the Ads page press F12, then open the Network tab.',
      'Type fetch-campaign-list in the filter box and reload the page.',
      'Click the request, open Payload → view source, and copy the short JSON.',
      'Paste it into the setup guide and click Save body.',
    ],
    warning:
      'Copy only the Payload. Never copy Headers or cookies (connect.sid, s_id, _abck). They give full access to your account.',
  },
  {
    id: 'limits',
    title: 'Set your spend limits',
    summary: 'All amounts are in ₹. Leave a field empty to turn that rule off.',
    items: [
      'Shop name: shown at the start of every alert, e.g. "Shop A".',
      'Per-campaign limit: alert when a LIVE campaign has spent this much.',
      'Daily total limit: alert when all of today’s campaigns together cross this.',
      'Budget warning % (default 80) and wasted-spend ₹ with 0 orders (default 50).',
    ],
  },
  {
    id: 'telegram',
    title: 'Get alerts on your phone with Telegram',
    summary: 'Optional, but recommended. Desktop pop-ups work without it.',
    items: [
      'In Telegram, open @BotFather and send /newbot. Pick any name.',
      'Paste the token BotFather gives you into the Bot token field.',
      'Open your new bot and send it any message, such as /start.',
      'Click Detect chat ID, save, then click Send test alert.',
    ],
  },
  {
    id: 'check',
    title: 'Run your first check',
    summary: 'Confirms everything works end to end.',
    items: [
      'Click Check now in the guide or the toolbar popup.',
      'You should see your live campaign count and today’s spend.',
      'From now on, checks run automatically every 15–25 minutes during active hours.',
    ],
  },
  {
    id: 'profiles',
    title: 'Add your other shops',
    summary: 'Each Chrome profile monitors one Meesho account independently.',
    items: [
      'In the first profile: Settings → Export settings. The Telegram token is not included.',
      'In each other profile: Load unpacked → log in to that shop → open Ads → Settings → Import settings.',
      'Re-enter the Telegram token, set the shop label, and use start offsets of 0, 7, 14… minutes.',
    ],
  },
]

export const alertTypes = [
  { name: 'Per-campaign limit', icon: '⚠️', when: 'A LIVE campaign has spent your per-campaign ₹ limit or more', action: 'Decide whether to pause it in Meesho Ads' },
  { name: 'Budget % used', icon: '⚠️', when: 'A LIVE campaign has used your warning % of its own budget', action: 'Check whether it converts before it reaches 100%' },
  { name: 'Spend with 0 orders', icon: '⚠️', when: 'Spend reached your wasted-spend amount with no orders', action: 'Usually worth pausing or changing the catalog' },
  { name: 'Daily limit crossed', icon: '🚨', when: 'Campaigns started today (IST) crossed your daily total', action: 'Review all of today’s campaigns' },
  { name: 'Monitoring paused', icon: '⛔', when: 'Logout, block (401/403/429), captcha or unexpected response', action: 'Log in to Meesho manually, then click Resume' },
  { name: 'Heartbeat', icon: '💚', when: 'Once a day (default 21:00 IST) with today’s spend', action: 'Nothing. If it’s missing, check that Chrome and the PC are on' },
]

export const badges = [
  { badge: 'No badge', meaning: 'Healthy. Monitoring on schedule.', tone: 'ok' as const },
  { badge: 'SET', meaning: 'Setup incomplete. Open the popup and continue the guide.', tone: 'warn' as const },
  { badge: '!', meaning: 'Paused. Log in to Meesho, then click Resume.', tone: 'danger' as const },
]

export const keepRunning = [
  { title: 'Chrome stays open', body: 'Each profile window can be minimized, but not closed.' },
  { title: 'Meesho stays logged in', body: 'A closed Ads tab is reopened automatically as a pinned background tab.' },
  { title: 'PC stays awake', body: 'Windows: Settings → System → Power → Sleep → Never while plugged in.' },
]

export const faqs = [
  {
    q: 'The badge shows “SET” or says “Open the Meesho Ads page once”',
    a: 'Open the Ads section of Meesho in this profile. The account identifier is detected from the page URL.',
  },
  {
    q: '“Request body not configured” or “not valid JSON”',
    a: 'Repeat the Payload copy step. The JSON starts with { and ends with }. To test alerts without it, tick “Use demo data”.',
  },
  {
    q: 'Monitoring paused: session expired or blocked',
    a: 'Log in again in the Meesho tab and solve any captcha, then click Resume. The extension never retries a block automatically, to keep your account safe.',
  },
  {
    q: 'The test alert shows no desktop pop-up',
    a: 'Allow Google Chrome in your OS notification settings (Windows: Settings → System → Notifications; turn off Focus assist). Also check chrome://settings/content/notifications.',
  },
  {
    q: 'Telegram says “chat not found” or Detect finds nothing',
    a: 'Bots can’t message you until you message them first. Send /start to your bot, then click Detect chat ID again.',
  },
  {
    q: 'Only 10 of my campaigns are being read',
    a: 'If the Payload has a page or offset field, enter its name under Settings → Advanced → Pagination field. At most 3 pages are fetched per check.',
  },
]
