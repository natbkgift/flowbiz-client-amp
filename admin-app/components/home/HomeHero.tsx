import Image from "next/image";
import Link from "next/link";
import { HeroSearch } from "@/components/home/HeroSearch";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { HeroOverlay } from "@/components/home/HeroOverlay";

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
            <Image
                src="/images/hero-banner.webp"
                alt="AMP Pattaya Real Estate"
                width={1920}
                height={1080}
                priority
                sizes="100vw"
                loading="eager"
                fetchPriority="high"
                className="w-full h-[85vh] md:h-[90vh] min-h-[600px] object-cover block"
            />

            {/* Gradient overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <HeroOverlay />
            </div>

            {/* Content overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-8 xl:px-16 2xl:px-24 3xl:px-32">
                <div className="max-w-[700px]">
                    <h1 className="text-white text-3xl md:text-6xl font-bold font-serif mb-4 leading-tight tracking-tight">
                        {dict.home.heroTitle}
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl mb-8 font-medium">
                        {dict.home.heroSubtitle}
                    </p>

                    <HeroSearch
                        locale={locale}
                        placeholder={dict.home.searchPlaceholder}
                    />

                    <div className="flex flex-wrap gap-3 mt-6">
                        <Link className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20" href={`/${locale}/buy`}>
                            {dict.nav.buy}
                        </Link>
                        <Link className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20" href={`/${locale}/rent`}>
                            {dict.nav.rent}
                        </Link>
                        <Link className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20" href={`/${locale}/invest`}>
                            {dict.nav.invest}
                        </Link>
                        <Link className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/20" href={`/${locale}/projects`}>
                            {dict.nav.projects}
                        </Link>
                    </div>

                    <TrackedLink
                        className="inline-flex items-center gap-2 mt-8 text-white/80 hover:text-white text-sm font-medium transition-colors"
                        href={guidedHref}
                        eventType="cta_click"
                        eventPayload={{ cta: 'open_guided_finder', from: 'home_hero' }}
                    >
                        {dict.guided.heroTrigger ?? 'Not sure where to start? Let us guide you →'}
                    </TrackedLink>
                </div>
            </div>
        </section>
    );
}
