export default function CompareLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-6 h-10 w-2/3 rounded bg-slate-200" />
        <div className="mb-8 h-5 w-1/2 rounded bg-slate-200" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 h-6 w-1/3 rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-10 rounded bg-slate-200" />
            <div className="h-10 rounded bg-slate-200" />
            <div className="h-10 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </main>
  );
}
