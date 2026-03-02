export default function LeadsLoading() {
  return (
    <main className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-6 w-1/4 rounded bg-slate-200" />
              <div className="h-6 w-1/4 rounded bg-slate-200" />
              <div className="h-6 w-1/6 rounded bg-slate-200" />
              <div className="h-6 w-1/6 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
