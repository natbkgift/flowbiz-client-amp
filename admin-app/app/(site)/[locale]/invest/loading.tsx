export default function InvestLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-6 h-10 w-2/3 rounded bg-slate-200" />
        <div className="mb-4 h-5 w-1/2 rounded bg-slate-200" />
        <div className="mb-8 h-5 w-1/3 rounded bg-slate-200" />
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 h-6 w-2/3 rounded bg-slate-200" />
              <div className="mb-2 h-4 w-full rounded bg-slate-200" />
              <div className="h-4 w-3/4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
