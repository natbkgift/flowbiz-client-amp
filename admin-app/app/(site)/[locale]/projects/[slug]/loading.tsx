import { Container } from '@/components/layout/Container';
import { LoadingCardGrid } from '@/components/ui/StateBlocks';

export default function ProjectDetailLoading() {
  return (
    <main id="main-content" className="section" aria-busy="true">
      <Container>
        <div className="mb-6 h-6 w-52 rounded bg-[var(--color-border)]" />
        <div className="mb-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="h-[380px] rounded-xl bg-[var(--color-border)]" />
          <div className="h-[380px] rounded-xl bg-[var(--color-border)]" />
        </div>
        <div className="mb-6 h-8 w-72 rounded bg-[var(--color-border)]" />
        <div className="mb-8 h-24 rounded-xl bg-[var(--color-border)]" />
        <LoadingCardGrid cards={3} />
      </Container>
    </main>
  );
}
