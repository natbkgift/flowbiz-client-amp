export default function PropertyDetailLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-6 h-64 w-full rounded-xl bg-[var(--color-border)]" />
        <div className="mb-4 h-8 w-2/3 rounded bg-[var(--color-border)]" />
        <div className="mb-3 h-5 w-1/3 rounded bg-[var(--color-border)]" />
        <div className="mb-6 h-4 w-1/2 rounded bg-[var(--color-border)]" />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-[var(--color-border)]" />
            <div className="h-4 w-5/6 rounded bg-[var(--color-border)]" />
            <div className="h-4 w-4/6 rounded bg-[var(--color-border)]" />
          </div>
          <div className="rounded-xl bg-[var(--color-white)] p-6 shadow-sm">
            <div className="mb-3 h-6 w-1/2 rounded bg-[var(--color-border)]" />
            <div className="h-10 w-full rounded bg-[var(--color-border)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
