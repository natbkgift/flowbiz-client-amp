export default function SellListPropertyLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container animate-pulse">
        <div className="mb-4 h-10 w-1/2 rounded bg-[var(--color-border)]" />
        <div className="mb-8 h-6 w-2/3 rounded bg-[var(--color-border)]" />
        <div className="grid grid-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl bg-[var(--color-white)] p-4">
              <div className="mb-3 h-6 w-2/3 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-full rounded bg-[var(--color-border)]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
