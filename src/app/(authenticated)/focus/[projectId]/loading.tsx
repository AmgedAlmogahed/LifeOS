export default function FocusLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] animate-pulse px-4 md:px-6 pt-4 pb-16 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-5 w-20 bg-muted/30 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted/30 rounded" />
          <div className="h-8 w-8 bg-muted/30 rounded" />
          <div className="h-8 w-20 bg-muted/30 rounded" />
        </div>
      </div>

      {/* Done ribbon */}
      <div className="h-12 bg-muted/15 border border-border rounded-xl" />

      {/* Current task zone */}
      <div className="h-48 bg-muted/15 border border-border rounded-xl" />

      {/* Queue zone */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted/30 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 w-40 shrink-0 bg-muted/15 border border-border rounded-lg" />
          ))}
        </div>
      </div>

      {/* Backlog zone */}
      <div className="space-y-2">
        <div className="h-4 w-28 bg-muted/30 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-muted/10 border border-border rounded-lg" />
        ))}
      </div>
    </div>
  );
}
