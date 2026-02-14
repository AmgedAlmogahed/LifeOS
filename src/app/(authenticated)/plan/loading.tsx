export default function PlanLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] animate-pulse p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-36 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted/50 rounded" />
      </div>

      {/* Recommendation card */}
      <div className="h-32 bg-muted/15 border border-border rounded-xl" />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-muted/15 border border-border rounded-xl" />
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-muted/30 rounded" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-muted/15 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
