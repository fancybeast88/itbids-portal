export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
        <span className="text-sm">Loading portal data...</span>
      </div>
    </div>
  )
}
