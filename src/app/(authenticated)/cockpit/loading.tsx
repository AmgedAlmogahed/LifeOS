export default function CockpitLoading() {
  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-8 px-4 animate-pulse">
      {/* AI Recommendation card */}
      <div className="h-40 bg-muted/10 border border-primary/10 rounded-xl" />

      {/* Projects grid */}
      <div className="space-y-4">
        <div className="h-5 w-40 bg-muted/30 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-36 bg-muted/15 border border-border rounded-xl" />
          ))}
        </div>
      </div>

      {/* Financial + Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-32 bg-muted/15 border border-border rounded-xl" />
        <div className="h-32 bg-muted/15 border border-border rounded-xl" />
      </div>
    </div>
  );
}
