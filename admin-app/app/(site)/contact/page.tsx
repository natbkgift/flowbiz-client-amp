import { Container } from '../../../components/layout/Container';
import { LeadForm } from '../../../components/forms/LeadForm';
import { CTA } from '../../_lib/public-cta';

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
            <a className="btn btn-primary" href={CTA.lineUrl} target="_blank" rel="noreferrer">
              LINE Chat
            </a>
            <a className="btn btn-secondary" href={CTA.whatsAppUrl} target="_blank" rel="noreferrer">
              ClickWhatsApp
            </a>
            <a className="btn btn-secondary" href={CTA.phoneTel}>
              Call: 063-453-3526
            </a>
          </div>

          <LeadForm heading="Send us your request" defaultMessage="Hi AMP Pattaya — I want to ask about..." />
        </Container>
      </section>
    </main>
  );
}
