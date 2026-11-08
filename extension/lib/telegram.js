const API = "https://api.telegram.org";

/** Sends a plain-text message. Never throws; returns { ok, error }. */
export async function sendTelegram(token, chatId, text) {
  if (!token || !chatId) return { ok: false, error: "Telegram not configured" };
  try {
    const res = await fetch(`${API}/bot${encodeURIComponent(token)}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      return { ok: false, error: body?.description || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "Network error" };
  }
}

/**
 * Finds chats that recently messaged the bot, so the owner does not have to
 * look up the chat id manually. Requires the owner to send /start to the bot first.
 */
export async function detectChats(token) {
  if (!token) return { ok: false, error: "Enter the bot token first" };
  try {
    const res = await fetch(`${API}/bot${encodeURIComponent(token)}/getUpdates`);
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      return { ok: false, error: body?.description || `HTTP ${res.status}` };
    }
    const seen = new Map();
    for (const update of body.result ?? []) {
      const chat = (update.message ?? update.channel_post ?? update.my_chat_member)?.chat;
      if (chat?.id !== undefined) {
        seen.set(String(chat.id), {
          id: String(chat.id),
          name: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || "Chat",
          type: chat.type,
        });
      }
    }
    return { ok: true, chats: [...seen.values()] };
  } catch (err) {
    return { ok: false, error: err?.message || "Network error" };
  }
}
