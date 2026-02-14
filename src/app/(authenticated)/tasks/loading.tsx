export default function TasksLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] animate-pulse">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40">
        <div className="h-5 w-5 bg-muted rounded mr-3" />
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted/50 rounded ml-2" />
      </div>

      {/* Filter bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3">
        <div className="h-7 w-28 bg-muted/30 rounded-lg" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-7 w-16 bg-muted/20 rounded-lg" />
          ))}
        </div>
        <div className="ml-auto h-7 w-24 bg-muted/30 rounded-lg" />
      </div>

      {/* Task groups */}
      <div className="flex-1 p-6 space-y-6">
        {[1, 2].map(group => (
          <div key={group} className="space-y-2">
            <div className="h-3 w-40 bg-muted/30 rounded" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-muted/15 border border-border rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
