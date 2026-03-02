export default function BuyLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-6 h-8 w-1/3 rounded bg-slate-200" />
        <div className="mb-8 h-5 w-1/2 rounded bg-slate-200" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-4 h-40 w-full rounded-lg bg-slate-200" />
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
