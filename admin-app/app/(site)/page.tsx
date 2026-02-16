import Link from 'next/link';

import { Container } from '../../components/layout/Container';

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="hero">
        <Container>
          <h1>ค้นหาทรัพย์สินในพัทยา</h1>
          <p className="hero-subtitle">Find Properties in Pattaya</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/rent">
              Browse Listings
            </Link>
            <Link className="btn btn-secondary" href="/projects">
              View Projects
            </Link>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 style={{ marginBottom: 8 }}>Welcome</h2>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
            Demo look, real data. Use Listings and Projects to explore properties.
          </p>
        </Container>
      </section>
    </main>
  );
}
