import { Container } from '../../../components/layout/Container';
import { LeadForm } from '../../../components/forms/LeadForm';

export default function ContactPage() {
  return (
    <main id="main-content">
      <section className="hero">
        <Container>
          <h1>Contact AMP Pattaya</h1>
          <p className="hero-subtitle">Fast response via WhatsApp or LINE</p>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <a className="btn btn-primary" href="https://line.me/ti/p/~@554dksqb" target="_blank" rel="noreferrer">
              LINE Chat
            </a>
            <a className="btn btn-secondary" href="https://wa.me/66634533526" target="_blank" rel="noreferrer">
              ClickWhatsApp
            </a>
            <a className="btn btn-secondary" href="tel:+66634533526">
              Call: 063-453-3526
            </a>
          </div>

          <LeadForm heading="Send us your request" defaultMessage="Hi AMP Pattaya — I want to ask about..." />
        </Container>
      </section>
    </main>
  );
}
