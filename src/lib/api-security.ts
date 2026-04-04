interface RateLimitConfig {
  key: string
  limit: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

const RATE_LIMIT_STORE_KEY = '__mindbloom_rate_limit_store__'

function getRateLimitStore(): Map<string, RateLimitEntry> {
  const globalScope = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitEntry>
  }

  if (!globalScope[RATE_LIMIT_STORE_KEY]) {
    globalScope[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitEntry>()
  }

  return globalScope[RATE_LIMIT_STORE_KEY]
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>, now: number): void {
  if (store.size < 5_000) return

  store.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  })
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const store = getRateLimitStore()
  pruneExpiredEntries(store, now)

  const current = store.get(config.key)
  if (!current || current.resetAt <= now) {
    store.set(config.key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      allowed: true,
      limit: config.limit,
      remaining: Math.max(0, config.limit - 1),
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    }
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  store.set(config.key, current)

  return {
    allowed: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  }
}

export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) }),
  }
}

function parseOrigin(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function deriveRequestOrigin(req: Request): string | null {
  const directOrigin = parseOrigin(req.url)
  if (directOrigin) return directOrigin

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!host) return null

  const protocol = req.headers.get('x-forwarded-proto') ?? 'https'
  return parseOrigin(`${protocol}://${host}`)
}

export function getRequestPath(req: Request): string {
  try {
    return new URL(req.url).pathname
  } catch {
    return '/'
  }
}

export function getRequestIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

export function buildRateLimitKey(prefix: string, req: Request, userId?: string | null): string {
  const identity = userId?.trim() || getRequestIp(req)
  return `${prefix}:${identity}`
}

interface OriginValidation {
  ok: true
}

interface OriginValidationFailure {
  ok: false
  reason: 'cross-site' | 'origin-mismatch' | 'invalid-origin'
}

const SAFE_SEC_FETCH_SITES = new Set(['same-origin', 'same-site', 'none'])

export function validateMutationOrigin(req: Request): OriginValidation | OriginValidationFailure {
  const method = req.method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { ok: true }
  }

  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite && !SAFE_SEC_FETCH_SITES.has(secFetchSite)) {
    return { ok: false, reason: 'cross-site' }
  }

  const allowedOrigins = new Set<string>()
  const appOrigin = parseOrigin(process.env.NEXT_PUBLIC_APP_URL ?? null)
  if (appOrigin) allowedOrigins.add(appOrigin)

  const requestOrigin = deriveRequestOrigin(req)
  if (requestOrigin) allowedOrigins.add(requestOrigin)

  const originHeader = req.headers.get('origin')
  const refererHeader = req.headers.get('referer')

  if (originHeader) {
    const origin = parseOrigin(originHeader)
    if (!origin) return { ok: false, reason: 'invalid-origin' }
    if (allowedOrigins.size > 0 && !allowedOrigins.has(origin)) {
      return { ok: false, reason: 'origin-mismatch' }
    }
    return { ok: true }
  }

  if (refererHeader) {
    const refererOrigin = parseOrigin(refererHeader)
    if (!refererOrigin) return { ok: false, reason: 'invalid-origin' }
    if (allowedOrigins.size > 0 && !allowedOrigins.has(refererOrigin)) {
      return { ok: false, reason: 'origin-mismatch' }
    }
  }

  return { ok: true }
}
