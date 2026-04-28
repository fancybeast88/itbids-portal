'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
        <p className="text-sm text-red-700 mt-2">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
