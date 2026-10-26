// One idempotency key per intended coin action. A double click or a retried request
// re-sends the SAME key, so the server applies the action once. Call clear() after a
// confirmed success so the next, separate action gets a new key.
const makeKey = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch (_ignored) { /* fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
};

export const createRequestKeys = () => {
  const keys = new Map();
  return {
    for(intent) {
      const id = String(intent);
      if (!keys.has(id)) keys.set(id, makeKey());
      return keys.get(id);
    },
    clear(intent) { keys.delete(String(intent)); },
  };
};
