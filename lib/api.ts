import { NextResponse } from 'next/server'

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function parseJsonBigIntSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
  )
}

export function normalizeStatus(status: string | null | undefined, fallback = 'submitted') {
  return (status || fallback).toLowerCase()
}
