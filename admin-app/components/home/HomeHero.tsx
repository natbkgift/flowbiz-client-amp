import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { HeroOverlay } from "@/components/home/HeroOverlay";
import { Container } from "@/components/layout/Container";

export function HomeHero({
    dict,
    locale,
    guidedHref
}: {
    dict: any;
    locale: "en" | "th";
    guidedHref: string;
}) {
    return (
        /**
         * Image-First Hero Architecture
         *
         * Chrome LCP spec excludes `position:absolute` images from LCP candidates.
         * To make the Hero image the LCP element:
         *  1. The <Image> must be a block-level layout contributor
         *  2. The section height is driven by a relative container wrapping the image
         *  3. The content overlay uses `position:absolute` instead of the image
         */
        <section className="relative w-full bg-gray-900 overflow-hidden">
            {/* Image — block-level, position:static → qualifies as Chrome LCP candidate */}
            {/* Next.js optimizer serves viewport-appropriate WebP, reducing mobile payload */}
            <img
                src="/images/hero-banner.webp"
                alt="AMP Pattaya Real Estate"
                width={1920}
                height={1080}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-[85vh] md:h-[90vh] min-h-[600px] object-cover block"
                style={{ width: '100%', height: 'auto' }}
            />

            {/* Gradient overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <HeroOverlay />
            </div>

            {/* Content overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center">
                <Container variant="wide">
                    <div className="max-w-[800px]">
                        {/* Headline: weight ~500, tight tracking, 1.1 line-height, max-width 14ch for controlled wrapping */}
                        <h1 className="text-white text-[length:var(--font-h1)] font-medium font-serif mb-6 md:mb-8 leading-[1.1] tracking-tight max-w-[14ch]">
                            {dict.home.heroTitle}
                        </h1>
                        {/* Subcopy: 18px (text-lg), 1.6 lh, neutral opacity, 24px bottom spacing */}
                        <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-2xl">
                            {dict.home.heroSubtitle}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
                                href={`/${locale}/projects`}
                            >
                                {dict.nav?.projects || "Explore Projects"}
                            </Link>
                            <Link
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors border border-white/20"
                                href={`/${locale}/invest`}
                            >
                                {dict.nav?.invest || "Investment Guide"}
                            </Link>
                        </div>

                        {/* 40-56px from CTA group (mt-10 = 40px) */}
                        <TrackedLink
                            className="inline-flex items-center gap-2 mt-10 text-white/70 hover:text-white text-sm font-medium transition-colors"
                            href={guidedHref}
                            eventType="cta_click"
                            eventPayload={{ cta: 'open_guided_finder', from: 'home_hero' }}
                        >
                            {dict.guided.heroTrigger ?? 'Not sure where to start? Let us guide you →'}
                        </TrackedLink>
                    </div>
                </Container>
            </div>
        </section>
    );
}
