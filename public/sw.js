// VirtualGYM Service Worker — v3
// Strategy per resource type:
//   R2 exercise GIFs   → CacheFirst  (immutable, 1 year)
//   Supabase REST GET  → NetworkFirst (3s timeout → cache fallback)
//   _next/static       → CacheFirst  (content-hashed, safe forever)
//   Navigation         → NetworkFirst → /offline fallback

const STATIC_CACHE  = 'vg-static-v3'
const GIF_CACHE     = 'vg-exercises-v1'  // only bump when GIF assets change
const API_CACHE     = 'vg-api-v3'

const R2_ORIGIN       = 'https://pub-135146decfd44634b9e8e73a717545d1.r2.dev'
const SUPABASE_ORIGIN = 'https://cblwoeoozzjagxgpmrbd.supabase.co'

const PRECACHE = ['/', '/offline', '/manifest.json']

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// ─── Activate — purge stale caches ───────────────────────────────────────────
self.addEventListener('activate', (e) => {
  const VALID = new Set([STATIC_CACHE, GIF_CACHE, API_CACHE])
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !VALID.has(k)).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 1. R2 exercise GIFs ── CacheFirst (immutable, never changes after upload)
  if (url.origin === R2_ORIGIN && url.pathname.startsWith('/exercises/')) {
    e.respondWith(cacheFirst(request, GIF_CACHE))
    return
  }

  // 2. Supabase REST reads ── NetworkFirst with 3s timeout → stale cache
  if (url.origin === SUPABASE_ORIGIN && url.pathname.startsWith('/rest/v1/')) {
    e.respondWith(networkFirst(request, API_CACHE, 3000))
    return
  }

  // 3. Next.js immutable static assets ── CacheFirst (content hash in URL)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 4. Same-origin page navigation ── NetworkFirst → /offline
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline').then(r => r || Response.error())
      )
    )
  }
})

// ─── Strategy: CacheFirst ─────────────────────────────────────────────────────
// Serve instantly from cache. On miss, fetch → cache → return.
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return Response.error()
  }
}

// ─── Strategy: NetworkFirst ───────────────────────────────────────────────────
// Try network first with a hard timeout. On timeout/failure, serve stale cache.
// This keeps data fresh on good connections and resilient on bad ones.
async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName)

  const networkRace = new Promise((resolve, reject) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    fetch(request, { signal: controller.signal })
      .then(res => { clearTimeout(timer); resolve(res) })
      .catch(err => { clearTimeout(timer); reject(err) })
  })

  try {
    const response = await networkRace
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    // Network timed out or offline — return stale cache if available
    const cached = await cache.match(request)
    return cached || Response.error()
  }
}
