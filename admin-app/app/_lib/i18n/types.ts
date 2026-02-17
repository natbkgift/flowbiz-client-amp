export type Locale = 'en' | 'th';

export type Dictionary = {
  brand: {
    name: string;
    tagline: string;
  };
  nav: {
    home: string;
    invest: string;
    buy: string;
    live: string;
    areaGuide: string;
    contact: string;
  };
  cta: {
    exploreInvestment: string;
    speakToAdvisor: string;
    whatsapp: string;
    line: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    pathInvest: { title: string; desc: string };
    pathBuy: { title: string; desc: string };
    pathLive: { title: string; desc: string };
    trustTitle: string;
    trustBullets: string[];
    featuredTitle: string;
    featuredSubtitle: string;
    insightTitle: string;
    insightSubtitle: string;
    insightCards: { title: string; body: string }[];
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    premiumCtaTitle: string;
    premiumCtaBody: string;
    pathSectionTitle: string;
    pathSectionSubtitle: string;
    trustSubtitle: string;
    heroPanelTitle: string;
    heroPanelMeta: string;
  };
  buy: {
    title: string;
    subtitle: string;
    processTitle: string;
    processSubtitle: string;
    processCards: { title: string; body: string }[];
    quotaTitle: string;
    quotaSubtitle: string;
    quotaCards: { title: string; body: string }[];
    legalTitle: string;
    legalSubtitle: string;
    legalBullets: string[];
    featuredTitle: string;
    featuredSubtitle: string;
    advisoryCtaTitle: string;
    advisoryCtaBody: string;
  };
  invest: {
    title: string;
    subtitle: string;
    whyTitle: string;
    whySubtitle: string;
    whyCards: { title: string; body: string }[];
    demandTitle: string;
    demandSubtitle: string;
    demandBullets: string[];
    yieldTitle: string;
    yieldSubtitle: string;
    yieldCards: { title: string; body: string }[];
    riskTitle: string;
    riskSubtitle: string;
    riskBullets: string[];
    reportCtaTitle: string;
    reportCtaBody: string;
  };
  areaGuide: {
    title: string;
    subtitle: string;
    areasTitle: string;
    areasSubtitle: string;
    mapTitle: string;
    mapSubtitle: string;
    mapLabels: { lifestyle: string; investment: string };
  };
  contact: {
    title: string;
    subtitle: string;
    advisoryTitle: string;
    advisoryBody: string;
    formTitle: string;
    trustTitle: string;
    trustBullets: string[];
    channelsTitle: string;
  };
  common: {
    language: string;
    english: string;
    thai: string;
    leadForm: {
      headingDefault: string;
      description: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      phonePlaceholder: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      success: string;
      errorPrefix: string;
    };
    testimonials: { quote: string; name: string; context: string }[];
    footerDisclaimer: string;
  };
};
