import { LoadingCardGrid } from '@/components/ui/StateBlocks';

export default function MarketplaceLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container section-stack">
        <div className="mb-6 h-8 w-1/3 rounded bg-[var(--color-border)]" />
        <div className="mb-8 h-5 w-1/2 rounded bg-[var(--color-border)]" />
        <LoadingCardGrid cards={6} />
      </div>
    </main>
  );
}
