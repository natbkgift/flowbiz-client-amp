export default function AnalyticsLoading() {
  return (
    <main className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-40 rounded bg-slate-200" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded bg-slate-200" />
          ))}
        </div>
        <div className="h-64 rounded bg-slate-200" />
      </div>
    </main>
  );
}
