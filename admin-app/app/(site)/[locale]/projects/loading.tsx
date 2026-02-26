import { LoadingCardGrid } from '@/components/ui/StateBlocks';

export default function ProjectsLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <div className="container section-stack">
        <div className="mb-6 h-8 w-1/3 rounded bg-slate-200" />
        <div className="mb-8 h-5 w-1/2 rounded bg-slate-200" />
        <LoadingCardGrid cards={6} />
      </div>
    </main>
  );
}
