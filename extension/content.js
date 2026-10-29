// Runs inside supplier.meesho.com so the request is same-origin and carries the
// page's own session and bot-manager cookies. Read-only: only the list endpoint is called.
(() => {
  if (window.__meeshoAdsMonitorLoaded) return;
  window.__meeshoAdsMonitorLoaded = true;

  const ENDPOINT = "https://supplier.meesho.com/api/ads/campaigns/fetch-campaign-list";
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

  async function fetchCampaigns(body, fallback) {
    const info = accountInfo();
    const identifier = info.identifier || fallback?.identifier;
    const supplierId = info.supplierId || fallback?.supplierId;
    const browserIdRaw = readCookie("browser_id") || fallback?.browserId;

    if (info.looksLikeLogin) return { ok: false, kind: "session", detail: "Tab is on the login page" };
    if (!identifier) return { ok: false, kind: "account", detail: "Cannot detect account identifier" };
    if (!supplierId) return { ok: false, kind: "session", detail: "Supplier cookie missing (logged out?)" };

    const headers = {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      "client-type": "m-web",
      identifier,
      "supplier-id": supplierId,
    };
    if (browserIdRaw) headers["browser-id"] = safeDecode(browserIdRaw);

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
