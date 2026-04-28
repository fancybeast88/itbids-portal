import { NextRequest, NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  identifier?: string
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const id = opts.identifier ?? clientIp(req)
  const bucketKey = `${opts.key}:${id}`
  const now = Date.now()

  let bucket = buckets.get(bucketKey)
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + opts.windowMs }
    buckets.set(bucketKey, bucket)
  }

  bucket.count += 1

  if (bucket.count > opts.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k)
    }
  }

  return null
}
