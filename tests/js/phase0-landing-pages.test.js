const fs = require('fs');
const path = require('path');

function readLandingPage(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '../../demo-website', relativePath), 'utf8');
}

describe('Phase 0 landing pages', () => {
  test('buy landing page includes pain-agitation messaging required by phase 0', () => {
    const html = readLandingPage('buy-condo-pattaya/index.html');

    expect(html).toContain("Buying Property in Thailand Isn't Like Back Home");
    expect(html).toContain('Licensed Pattaya agency');
  });

  test('investment landing page exists with required core messaging', () => {
    const html = readLandingPage('pattaya-condo-investment/index.html');

    expect(html).toContain('Invest in Pattaya Condos — Verified Yield Data, Not Developer Hype');
    expect(html).toContain('Yield Comparison Table');
    expect(html).toContain('Featured Investment Units');
    expect(html).toContain('What We Tell You That Others Won\'t');
    expect(html).toContain('Trust Signals');
    expect(html).toContain('FAQ');
    expect(html).toContain('Request a Yield Report for Current Listings');
    expect(html).toContain('SubmitLead');
    expect(html).toContain('ClickWhatsApp');
  });

  test('rental landing page exists with required core messaging', () => {
    const html = readLandingPage('rent-condo-pattaya/index.html');

    expect(html).toContain('Find Your Pattaya Rental — No Ghost Listings, No Hidden Fees');
    expect(html).toContain('Pattaya Area Guide');
    expect(html).toContain('Featured Rentals');
    expect(html).toContain("What's Included in Every Rental");
    expect(html).toContain('Trust Signals');
    expect(html).toContain('FAQ');
    expect(html).toContain("Tell Us What You're Looking For");
    expect(html).toContain('SubmitLead');
    expect(html).toContain('ClickWhatsApp');
  });
});
