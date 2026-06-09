export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden animate-pulse">
      {/* Header row */}
      <div className="border-b border-green-100 bg-green-50 px-4 py-3 flex gap-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      {/* Data rows */}
      <div className="divide-y divide-green-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4 items-center">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gray-200" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-32 bg-gray-200 rounded" />
    </div>
  )
}
