export default function AreaGuideDetailLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-4 h-10 w-1/2 rounded bg-[var(--color-border)]" />
        <div className="mb-8 h-6 w-2/3 rounded bg-[var(--color-border)]" />
        <div className="h-56 rounded-xl bg-[var(--color-border)]" />
      </div>
    </main>
  );
}
