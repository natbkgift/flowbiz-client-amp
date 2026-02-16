import { Container } from '../../../components/layout/Container';
import { LeadForm } from '../../../components/forms/LeadForm';

export default function AreaGuidePage() {
  return (
    <main id="main-content">
      <section className="hero">
        <Container>
          <h1>Pattaya Area Guide</h1>
          <p className="hero-subtitle">Tell us your lifestyle and we&apos;ll match the right area</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>How to Choose an Area</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Commute • beach access • nightlife • schools • budget. We&apos;ll narrow it down fast.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 12 }}>Tell Us Your Priorities</h2>
          <LeadForm defaultMessage="I want an area recommendation. I care about..." />
        </Container>
      </section>
    </main>
  );
}
