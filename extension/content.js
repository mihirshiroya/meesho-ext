// Runs inside supplier.meesho.com so the request is same-origin and carries the
// page's own session and bot-manager cookies. Reads the campaign list; the pause endpoint
// is only called when the user has turned on Auto-stop.
(() => {
  // Versioned so an updated script can be injected next to an older copy that lacks PAUSE_CAMPAIGN.
  if (window.__meeshoAdsMonitorV2) return;
  window.__meeshoAdsMonitorV2 = true;

  const ENDPOINT = "https://supplier.meesho.com/api/ads/campaigns/fetch-campaign-list";
  const PAUSE_ENDPOINT = "https://supplier.meesho.com/api/ads/campaigns/pause-campaign";
  // e.g. /panel/v3/new/ads/qxg7u/advertisement
  const ADS_PAGE_RE = /^\/panel\/v3\/new\/ads\/([^/?#]+)\/advertisement/;

  function readCookie(name) {
    const row = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`));
    return row ? row.slice(name.length + 1) : null;
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function accountInfo() {
    const match = ADS_PAGE_RE.exec(location.pathname);
    const identifier = match ? safeDecode(match[1]) : readCookie("identifier");
    return {
      identifier: identifier || null,
      supplierId: readCookie("s_id"),
      isAdsPage: Boolean(match),
      looksLikeLogin: /login|signin|sign-in/i.test(location.pathname + location.hash),
      url: location.origin + location.pathname,
    };
  }

  function requestContext(fallback) {
    const info = accountInfo();
    const identifier = info.identifier || fallback?.identifier;
    const supplierId = info.supplierId || fallback?.supplierId;
    const browserIdRaw = readCookie("browser_id") || fallback?.browserId;

    if (info.looksLikeLogin) return { error: { ok: false, kind: "session", detail: "Tab is on the login page" } };
    if (!identifier) return { error: { ok: false, kind: "account", detail: "Cannot detect account identifier" } };
    if (!supplierId) return { error: { ok: false, kind: "session", detail: "Supplier cookie missing (logged out?)" } };

    const headers = {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "client-type": "m-web",
      identifier,
      "supplier-id": supplierId,
    };
    if (browserIdRaw) headers["browser-id"] = safeDecode(browserIdRaw);
    return { headers, supplierId };
  }

  async function pauseCampaign(campaignId, fallback) {
    const ctx = requestContext(fallback);
    if (ctx.error) return ctx.error;
    const supplierNum = Number(ctx.supplierId);
    const campaignNum = Number(campaignId);
    if (!Number.isFinite(supplierNum) || !Number.isFinite(campaignNum)) {
      return { ok: false, kind: "account", detail: "Invalid supplier or campaign id" };
    }

    let res;
    try {
      res = await fetch(PAUSE_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: ctx.headers,
        body: JSON.stringify({ supplier_id: supplierNum, campaign_id: campaignNum, pause_nudge_status: "DETAILS_PAGE" }),
      });
    } catch (err) {
      return { ok: false, kind: "network", detail: err?.message || "Network error" };
    }

    if (res.status === 401) return { ok: false, kind: "session", status: 401, detail: "HTTP 401" };
    if (res.status === 403 || res.status === 429) {
      return { ok: false, kind: "blocked", status: res.status, detail: `HTTP ${res.status}` };
    }
    if (res.redirected && /login|signin/i.test(res.url || "")) {
      return { ok: false, kind: "session", status: res.status, detail: "Redirected to login" };
    }
    const text = await res.text().catch(() => "");
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      if (/captcha|challenge|access denied|akamai/i.test(text)) {
        return { ok: false, kind: "blocked", status: res.status, detail: "Captcha / challenge page" };
      }
    }
    if (!res.ok) return { ok: false, kind: "http", status: res.status, detail: `HTTP ${res.status}` };
    if (json && (json.success === false || json.error)) {
      const msg = typeof json.error === "string" ? json.error : json.error?.message || json.message || "Meesho rejected the request";
      return { ok: false, kind: "rejected", status: res.status, detail: msg };
    }
    return { ok: true, status: res.status, json };
  }

  async function fetchCampaigns(body, fallback) {
    const ctx = requestContext(fallback);
    if (ctx.error) return ctx.error;
    const { headers } = ctx;

    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      return { ok: false, kind: "network", detail: err?.message || "Network error" };
    }

    const finalUrl = res.url || "";
    if (res.status === 401) return { ok: false, kind: "session", status: 401, detail: "HTTP 401" };
    if (res.status === 403 || res.status === 429) {
      return { ok: false, kind: "blocked", status: res.status, detail: `HTTP ${res.status}` };
    }
    if (res.redirected && /login|signin/i.test(finalUrl)) {
      return { ok: false, kind: "session", status: res.status, detail: "Redirected to login" };
    }

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      const looksLikeChallenge = /captcha|challenge|access denied|akamai/i.test(text);
      return {
        ok: false,
        kind: "blocked",
        status: res.status,
        detail: looksLikeChallenge ? "Captcha / challenge page" : "Non-JSON response",
      };
    }

    if (!res.ok) return { ok: false, kind: "http", status: res.status, detail: `HTTP ${res.status}` };
    if (!json?.data || !Array.isArray(json.data.campaigns)) {
      return { ok: false, kind: "shape", status: res.status, detail: "Unexpected response shape" };
    }
    return { ok: true, status: res.status, json };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "GET_ACCOUNT_INFO") {
      sendResponse(accountInfo());
      return false;
    }
    if (msg?.type === "FETCH_CAMPAIGNS") {
      fetchCampaigns(msg.body, msg.fallback).then(sendResponse);
      return true;
    }
    if (msg?.type === "PAUSE_CAMPAIGN") {
      pauseCampaign(msg.campaignId, msg.fallback).then(sendResponse);
      return true;
    }
    return false;
  });

  function announce() {
    try {
      chrome.runtime.sendMessage({ type: "PAGE_LOADED", info: accountInfo() }).catch(() => {});
      return true;
    } catch {
      // extension was reloaded or removed; this old copy of the script is orphaned
      return false;
    }
  }

  announce();

  // Meesho is a single-page app: clicking "Ads" in the menu changes the URL without a
  // page load, so watch the path and re-announce when it changes.
  let lastPath = location.pathname;
  const watcher = setInterval(() => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    if (!announce()) clearInterval(watcher);
  }, 1500);
})();
