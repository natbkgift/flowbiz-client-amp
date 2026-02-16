import { Container } from '../../../components/layout/Container';
import { LeadForm } from '../../../components/forms/LeadForm';

export default function InvestPage() {
  return (
    <main id="main-content">
      <section className="hero">
        <Container>
          <h1>Invest in Pattaya Condos — Verified Yield Data, Not Developer Hype</h1>
          <p className="hero-subtitle">Yield-first approach for serious investors</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Yield Comparison Table</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            We focus on realistic rent ranges, fees, and occupancy assumptions — not brochure numbers.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Featured Investment Units</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Browse live inventory and shortlist units for ROI comparison.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>What We Tell You That Others Won&apos;t</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            We highlight risks, holding costs, and realistic exit paths — so you can invest with eyes open.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Trust Signals</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Local team • transparent data assumptions • clear follow-up.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>FAQ</h2>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Ask us anything about yields, leases, fees, and purchase steps.
          </p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 12 }}>Request a Yield Report for Current Listings</h2>
          <LeadForm defaultMessage="I want a yield report for current listings." />
        </Container>
      </section>
    </main>
  );
}
