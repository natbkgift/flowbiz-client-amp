export function Header() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="header">
        <div className="container header-shell">
          <a className="brand locale-safe" href="/en">
            FlowBiz
          </a>
          <button className="btn btn-secondary nav-toggle" type="button" aria-label="Toggle navigation">
            Menu
          </button>
          <nav className="nav" aria-label="Primary">
            <a className="nav-link locale-safe" href="/en/about">
              About
            </a>
            <a className="nav-link locale-safe" href="/en/projects">
              Projects
            </a>
            <a className="nav-link locale-safe" href="/en/property/sample-property">
              Properties
            </a>
            <a className="nav-link locale-safe" href="/en/contact">
              Contact
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
