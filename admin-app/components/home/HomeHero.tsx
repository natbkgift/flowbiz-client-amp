import Image from "next/image";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { buildAdvisorWhatsApp } from "@/app/_lib/public-advisory";
import { HeroOverlay } from "@/components/home/HeroOverlay";
import { Container } from "@/components/layout/Container";
import { withLocale } from "@/app/_lib/i18n/routing";

// Cloudflare cached a stale 404 for the unversioned fallback asset on production.
const HERO_FALLBACK_IMAGE = "/images/hero-banner.webp?v=20260318";

type HomeHeroComposer = {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    primary_cta_label?: string;
    primary_cta_url?: string;
    secondary_cta_label?: string;
    secondary_cta_url?: string;
    trust_items?: string[];
    hero_image?: string | null;
    path_selector_enabled?: boolean;
    paths?: Array<{ key: string; label?: string; description?: string; url?: string }>;
};

type HomeHeroSupportLink = {
    label: string;
    href: string;
    eventPayload?: Record<string, unknown>;
};

function resolveLocalizedHref(locale: "en" | "th", href: string): string {
    if (!href.startsWith('/')) return href;
    if (href === `/${locale}` || href.startsWith(`/${locale}/`) || href.startsWith(`/${locale}?`)) {
        return href;
    }
    return withLocale(locale, href);
}

export function HomeHero({
    dict,
    locale,
    guidedHref,
    guidedLabel,
    primaryEventPayload,
    secondaryEventPayload,
    composer,
    supportLinks = [],
    guidanceNote,
}: {
    dict: any;
    locale: "en" | "th";
    guidedHref?: string;
    guidedLabel?: string;
    primaryEventPayload?: Record<string, unknown>;
    secondaryEventPayload?: Record<string, unknown>;
    composer?: HomeHeroComposer | null;
    supportLinks?: HomeHeroSupportLink[];
    guidanceNote?: string;
}) {
    const heroHeading = typeof composer?.heading === 'string' && composer.heading.trim()
        ? composer.heading.trim()
        : dict.home.heroTitle;
    const heroEyebrow = typeof composer?.eyebrow === 'string' && composer.eyebrow.trim()
        ? composer.eyebrow.trim()
        : dict.advisory.heroEyebrow;
    const heroSubheading = typeof composer?.subheading === 'string' && composer.subheading.trim()
        ? composer.subheading.trim()
        : dict.home.heroSubtitle;

    const primaryCtaLabel = typeof composer?.primary_cta_label === 'string' && composer.primary_cta_label.trim()
        ? composer.primary_cta_label.trim()
        : (locale === "th" ? "ขอคำปรึกษา" : "Request Consultation");
    const primaryCtaUrl = typeof composer?.primary_cta_url === 'string' && composer.primary_cta_url.trim()
        ? resolveLocalizedHref(locale, composer.primary_cta_url.trim())
        : withLocale(locale, "/contact");

    const secondaryCtaLabel = typeof composer?.secondary_cta_label === 'string' && composer.secondary_cta_label.trim()
        ? composer.secondary_cta_label.trim()
        : (locale === "th" ? "ดูโครงการ" : "Browse Projects");
    const secondaryCtaUrl = typeof composer?.secondary_cta_url === 'string' && composer.secondary_cta_url.trim()
        ? resolveLocalizedHref(locale, composer.secondary_cta_url.trim())
        : withLocale(locale, "/projects");

    const heroImageSrc = typeof composer?.hero_image === 'string' && composer.hero_image.startsWith('/media/')
        ? composer.hero_image
        : HERO_FALLBACK_IMAGE;
    const whatsAppHref = buildAdvisorWhatsApp(locale, dict);
    const resolvedGuidedHref = typeof guidedHref === 'string' ? guidedHref.trim() : '';
    const showGuidedTrigger = resolvedGuidedHref.length > 0;
    const guidedTriggerLabel = typeof guidedLabel === 'string' && guidedLabel.trim()
        ? guidedLabel.trim()
        : (dict.guided.heroTrigger ?? 'Not sure where to start? Let us guide you →');
    const resolvedPrimaryEventPayload = primaryEventPayload ?? { cta: "request_consultation", from: "home_hero" };
    const resolvedSecondaryEventPayload = secondaryEventPayload ?? { cta: "browse_projects", from: "home_hero" };
    const hasSupportRow = showGuidedTrigger || supportLinks.length > 0 || whatsAppHref.trim().length > 0;

    return (
        <section className="home-hero-section relative w-full bg-gray-900 overflow-hidden min-h-[640px] sm:min-h-[700px] md:min-h-[680px] xl:min-h-[720px]" data-home-perf="hero-media">
            <Image
                src={heroImageSrc}
                alt="AMP Pattaya Real Estate"
                fill
                priority
                fetchPriority="high"
                quality={82}
                sizes="100vw"
                className="absolute inset-0 w-full h-full object-cover object-[64%_center] sm:object-[60%_center] md:object-center block scale-[1.01]"
            />

            {/* Gradient overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/86 via-black/66 to-black/84 md:from-black/78 md:via-black/54 md:to-black/82">
                <HeroOverlay />
            </div>
            <div className="absolute inset-y-0 left-0 right-0 z-10 pointer-events-none bg-gradient-to-r from-black/78 via-black/38 to-transparent md:from-black/70 md:via-black/22 md:to-transparent" />

            {/* Content overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-20 flex flex-col justify-start md:justify-center pt-[84px] sm:pt-[96px] pb-5 md:py-28">
                <Container variant="wide">
                    <div className="hero-home-layout">
                        <div className="hero-home-panel max-w-[min(76ch,100%)]">
                        <p className="hero-home-eyebrow text-white/72 text-[11px] md:text-xs font-semibold tracking-[0.26em] uppercase mb-3 md:mb-4">
                            {heroEyebrow}
                        </p>
                        {/* Headline: weight ~500, tight tracking, 1.1 line-height, max-width 14ch for controlled wrapping */}
                        <h1 className={`hero-home-title ${locale === "th" ? "hero-home-title--th" : ""} text-white text-[length:var(--font-h1)] font-semibold font-serif mb-4 md:mb-7 leading-[0.98] tracking-[-0.03em] max-w-[13.5ch]`}>
                            {heroHeading}
                        </h1>
                        {/* Subcopy: 18px (text-lg), 1.6 lh, neutral opacity, 24px bottom spacing */}
                        <p className="hero-home-subtitle text-white/92 text-base sm:text-[15px] md:text-lg leading-[1.5] mb-5 md:mb-6 max-w-[58ch]">
                            {heroSubheading}
                        </p>

                        <div className="hero-cta-row flex flex-wrap gap-3 md:gap-4">
                            <TrackedLink
                                className="btn btn-primary hero-cta hero-cta--primary"
                                href={primaryCtaUrl}
                                eventType="cta_click"
                                eventPayload={resolvedPrimaryEventPayload}
                            >
                                {primaryCtaLabel}
                            </TrackedLink>
                            <TrackedLink
                                className="btn btn-secondary hero-cta hero-cta--secondary"
                                href={secondaryCtaUrl}
                                eventType="cta_click"
                                eventPayload={resolvedSecondaryEventPayload}
                            >
                                {secondaryCtaLabel}
                            </TrackedLink>
                        </div>

                        {guidanceNote ? (
                            <p className="hero-home-guidance text-white/78 text-sm leading-relaxed mt-3 md:mt-4 max-w-[56ch]">
                                {guidanceNote}
                            </p>
                        ) : null}

                        {hasSupportRow ? (
                            <div className="hero-support-row flex flex-wrap items-center gap-x-5 gap-y-3 mt-4 md:mt-6">
                                {showGuidedTrigger ? (
                                    <TrackedLink
                                        className="hero-guided-trigger hero-support-link hero-support-link--pill inline-flex items-center gap-2 text-sm font-medium text-white/72 hover:text-white transition-colors"
                                        href={resolvedGuidedHref}
                                        eventType="cta_click"
                                        eventPayload={{ cta: 'open_guided_finder', from: 'home_hero' }}
                                    >
                                        {guidedTriggerLabel}
                                    </TrackedLink>
                                ) : null}
                                <a
                                    className="hero-whatsapp-link inline-flex items-center gap-2 text-sm font-medium text-white/72 hover:text-white transition-colors"
                                    href={whatsAppHref}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {dict.cta.whatsapp}
                                </a>
                                {supportLinks.map((link) => (
                                    <TrackedLink
                                        key={`${link.label}-${link.href}`}
                                        className="hero-support-link hero-support-link--pill inline-flex items-center gap-2 text-sm font-medium text-white/72 hover:text-white transition-colors"
                                        href={resolveLocalizedHref(locale, link.href)}
                                        eventType="cta_click"
                                        eventPayload={link.eventPayload ?? { cta: 'hero_support_link', from: 'home_hero' }}
                                    >
                                        {link.label}
                                    </TrackedLink>
                                ))}
                            </div>
                        ) : null}
                    </div>
                        <div className="hero-home-atmosphere" aria-hidden="true">
                            <span className="hero-home-atmosphere__beam" />
                            <span className="hero-home-atmosphere__orb" />
                        </div>
                    </div>
                </Container>
            </div>
        </section>
    );
}
