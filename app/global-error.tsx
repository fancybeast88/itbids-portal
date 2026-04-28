'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-slate-50">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-xl border border-red-200 bg-white p-6 text-center shadow-card">
            <h2 className="text-xl font-semibold text-slate-900">Application error</h2>
            <p className="text-sm text-slate-600 mt-2">
              {error?.message || 'A critical error occurred. Please retry.'}
            </p>
            <button
              onClick={() => reset()}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
