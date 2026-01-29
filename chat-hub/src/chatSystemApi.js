const DEFAULT_TIMEOUT_MS = 20000;

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function getChatSystemUrl() {
  const direct = import.meta.env.VITE_CHAT_SYSTEM_URL;
  if (direct) return direct.replace(/\/$/, '');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing VITE_CHAT_SYSTEM_URL (or VITE_SUPABASE_URL) in Vite env');
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/chat-system`;
}

async function request({ method, path, sessionId, body, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!sessionId) throw new Error('Missing sessionId');

  const url = `${getChatSystemUrl()}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId
  };

  const res = await withTimeout(
    fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }),
    timeoutMs
  );

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response (${res.status})`);
    }
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function getRealtimeToken({ sessionId }) {
  return request({ method: 'GET', path: '?action=get_realtime_token', sessionId });
}

export async function listConversations({ sessionId }) {
  return request({ method: 'GET', path: '', sessionId });
}

export async function getConversation({ sessionId, conversationId }) {
  const qs = new URLSearchParams({ conversationId: String(conversationId) });
  return request({ method: 'GET', path: `?${qs.toString()}`, sessionId });
}

export async function sendMessage({ sessionId, conversationId, recipientId, content }) {
  return request({
    method: 'POST',
    path: '',
    sessionId,
    body: { conversationId, recipientId, content }
  });
}

export async function markConversationRead({ sessionId, conversationId }) {
  return request({
    method: 'PUT',
    path: '',
    sessionId,
    body: { conversationId }
  });
}

export async function clearConversation({ sessionId, conversationId }) {
  const qs = new URLSearchParams({ conversationId: String(conversationId) });
  return request({ method: 'DELETE', path: `?${qs.toString()}`, sessionId });
}

export async function blockConversation({ sessionId, conversationId, recipientId }) {
  return request({
    method: 'POST',
    path: '',
    sessionId,
    body: { conversationId, recipientId, action: 'block' }
  });
}

export async function unblockConversation({ sessionId, conversationId, recipientId }) {
  return request({
    method: 'POST',
    path: '',
    sessionId,
    body: { conversationId, recipientId, action: 'unblock' }
  });
}

export async function reportConversation({ sessionId, conversationId, recipientId, reason }) {
  return request({
    method: 'POST',
    path: '',
    sessionId,
    body: { conversationId, recipientId, action: 'report', reason }
  });
}

