export default function BlogDetailLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-3 h-4 w-1/3 rounded bg-[var(--color-border)]" />
        <div className="mb-6 h-10 w-2/3 rounded bg-[var(--color-border)]" />
        <div className="mb-3 h-5 w-full rounded bg-[var(--color-border)]" />
        <div className="mb-3 h-5 w-full rounded bg-[var(--color-border)]" />
        <div className="h-5 w-5/6 rounded bg-[var(--color-border)]" />
      </div>
    </main>
  );
}
