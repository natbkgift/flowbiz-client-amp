export default function ContactLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-6 h-8 w-1/3 rounded bg-slate-200" />
        <div className="mb-8 h-5 w-1/2 rounded bg-slate-200" />
        <div className="mx-auto max-w-lg space-y-4">
          <div className="h-10 w-full rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-200" />
          <div className="h-24 w-full rounded bg-slate-200" />
          <div className="h-10 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
