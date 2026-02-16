import Link from 'next/link';

import { Container } from './Container';

export function Footer() {
  return (
    <footer className="footer">
      <Container>
        <div className="footer-content">
          <div>
            <h3>Asset Management Property</h3>
            <p style={{ color: 'var(--color-gray-300)' }}>
              Professional property management in Pattaya.
            </p>
          </div>

          <div>
            <h3>Quick Links</h3>
            <p>
              <Link href="/rent">Listings</Link>
            </p>
            <p>
              <Link href="/projects">Projects</Link>
            </p>
            <p>
              <Link href="/invest">Invest</Link>
            </p>
          </div>

          <div>
            <h3>Contact</h3>
            <p style={{ color: 'var(--color-gray-300)' }}>info@amppattaya.com</p>
            <p>
              <Link href="/contact">Contact form</Link>
            </p>
          </div>
        </div>

        <p style={{ color: 'var(--color-gray-300)', fontSize: 14 }}>
          © {new Date().getFullYear()} Asset Management Property
        </p>
      </Container>
    </footer>
  );
}
