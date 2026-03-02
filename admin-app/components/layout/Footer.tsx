export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-grid">
        <section className="footer-nap locale-safe" aria-label="Contact details">
          <h3>FlowBiz Pattaya</h3>
          <p>123 Beach Road, Pattaya, Chonburi 20150</p>
          <p>+66 38 000 000</p>
          <p>hello@flowbiz.co</p>
        </section>
        <nav className="footer-links" aria-label="Footer links">
          <a href="/en/about">About</a>
          <a href="/en/projects">Projects</a>
          <a href="/en/marketplace">Properties</a>
          <a href="/en/contact">Contact</a>
        </nav>
        <nav className="footer-social" aria-label="Social links">
          <a href="https://facebook.com/flowbiz">Facebook</a>
          <a href="https://instagram.com/flowbiz">Instagram</a>
          <a href="https://youtube.com/@flowbiz">YouTube</a>
        </nav>
      </div>
      <div className="container footer-legal">
        <a href="/en/privacy">Privacy Policy</a>
        <a href="/en/terms">Terms of Service</a>
        <span>Copyright 2026 FlowBiz</span>
      </div>
    </footer>
  );
}
