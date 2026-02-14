export default function AuthenticatedLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40">
        <div className="h-4 w-4 bg-muted rounded mr-3" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        {/* Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-muted/20 border border-border rounded-xl" />
          ))}
        </div>

        {/* List items */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 bg-muted/15 border border-border rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
