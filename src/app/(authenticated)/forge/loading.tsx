export default function ForgeLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] animate-pulse">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-6 bg-card/40">
        <div className="h-5 w-5 bg-muted rounded mr-3" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>

      {/* Project cards */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-44 bg-muted/15 border border-border rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
