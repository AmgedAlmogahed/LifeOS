export default function CalendarLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] animate-pulse">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-muted/30 rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted/30 rounded" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-4 bg-muted/20 rounded mx-auto w-8" />
          ))}
        </div>

        {/* Calendar cells */}
        {[1, 2, 3, 4, 5].map(week => (
          <div key={week} className="grid grid-cols-7 gap-1 mb-1">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="h-20 bg-muted/10 border border-border rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
