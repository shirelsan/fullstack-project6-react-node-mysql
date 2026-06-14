const store = new Map();

function now() {
  return Date.now();
}

function getCached(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

function setCached(key, value, ttlMs = 120000) {
  store.set(key, { value, expiresAt: now() + ttlMs });
}

function invalidateByPrefixes(prefixes = []) {
  if (!Array.isArray(prefixes) || prefixes.length === 0) return;
  for (const key of store.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      store.delete(key);
    }
  }
}

function clearCache() {
  store.clear();
}

function cacheSize() {
  return store.size;
}

function cacheSnapshot() {
  const current = now();
  const items = [];
  for (const [key, value] of store.entries()) {
    const ttl_ms = value.expiresAt - current;
    if (ttl_ms <= 0) {
      store.delete(key);
      continue;
    }
    items.push({ key, ttl_ms });
  }
  return {
    count: items.length,
    items: items.sort((a, b) => a.key.localeCompare(b.key))
  };
}

module.exports = {
  getCached,
  setCached,
  invalidateByPrefixes,
  clearCache,
  cacheSize,
  cacheSnapshot
};
