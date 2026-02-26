import Image from "next/image";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { HeroOverlay } from "@/components/home/HeroOverlay";
import { Container } from "@/components/layout/Container";
import heroBanner from "@/public/images/hero-banner.webp";
import { withLocale } from "@/app/_lib/i18n/routing";

export function HomeHero({
    dict,
    locale,
    guidedHref
}: {
    dict: any;
    locale: "en" | "th";
    guidedHref: string;
}) {
    const sellPathDesc = locale === "th"
        ? "ประเมินทรัพย์และวางแผนขายกับทีมที่เข้าใจตลาดพัทยา"
        : "Get valuation guidance and a sell strategy from our Pattaya team.";

    const heroPathCards = [
        {
            key: "buy",
            href: withLocale(locale, "/buy"),
            title: dict.home.pathBuy.title,
            desc: dict.home.pathBuy.desc,
            result: locale === "th" ? "เช็กลิสต์ผู้ซื้อต่างชาติ" : "Foreign-buyer checklist",
            icon: "B",
            eventPayload: { path: "buy", from: "home_hero" },
        },
        {
            key: "invest",
            href: withLocale(locale, "/invest"),
            title: dict.home.pathInvest.title,
            desc: dict.home.pathInvest.desc,
            result: locale === "th" ? "ชอร์ตลิสต์เน้นผลตอบแทน" : "Yield-focused shortlist",
            icon: "I",
            eventPayload: { path: "invest", from: "home_hero" },
        },
        {
            key: "rent",
            href: withLocale(locale, "/rent"),
            title: dict.nav.rent,
            desc: locale === "th"
                ? "เลือกทำเลและยูนิตเช่าที่เหมาะกับการอยู่อาศัย พร้อมคำแนะนำแบบไม่เสียเวลา"
                : "Find the right area and rental unit fast, with practical local guidance.",
            result: locale === "th" ? "ชอร์ตลิสต์เช่าเร็วขึ้น" : "Rental shortlist fast",
            icon: "R",
            eventPayload: { path: "rent", from: "home_hero" },
        },
        {
            key: "sell",
            href: withLocale(locale, "/sell"),
            title: dict.nav.sell,
            desc: sellPathDesc,
            result: locale === "th" ? "ประเมินราคา + แผนขาย" : "Valuation + sell plan",
            icon: "S",
            eventPayload: { path: "sell", from: "home_hero" },
        }
    ];

    return (
        <section className="relative w-full bg-gray-900 overflow-hidden min-h-[720px] sm:min-h-[760px] md:min-h-[680px] xl:min-h-[720px]">
            <Image
                src={heroBanner.src}
                alt="AMP Pattaya Real Estate"
                fill
                priority
                fetchPriority="high"
                sizes="100vw"
                className="absolute inset-0 w-full h-full object-cover object-[64%_center] sm:object-[60%_center] md:object-center block scale-[1.01]"
            />

            {/* Gradient overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/78 via-black/55 to-black/78 md:from-black/68 md:via-black/44 md:to-black/72">
                <HeroOverlay />
            </div>
            <div className="absolute inset-y-0 left-0 right-0 z-10 pointer-events-none bg-gradient-to-r from-black/70 via-black/25 to-transparent md:from-black/60 md:via-black/15 md:to-transparent" />

            {/* Content overlay — absolutely positioned, no layout impact */}
            <div className="absolute inset-0 z-20 flex flex-col justify-start md:justify-center pt-[92px] sm:pt-[100px] pb-6 md:py-28">
                <Container variant="wide">
                    <div className="hero-home-panel max-w-[min(76ch,100%)]">
                        {/* Headline: weight ~500, tight tracking, 1.1 line-height, max-width 14ch for controlled wrapping */}
                        <h1 className={`hero-home-title ${locale === "th" ? "hero-home-title--th" : ""} text-white text-[length:var(--font-h1)] font-medium font-serif mb-4 md:mb-7 leading-[1.05] tracking-tight max-w-[13.5ch]`}>
                            {dict.home.heroTitle}
                        </h1>
                        {/* Subcopy: 18px (text-lg), 1.6 lh, neutral opacity, 24px bottom spacing */}
                        <p className="hero-home-subtitle text-white/90 text-base sm:text-[15px] md:text-lg leading-relaxed mb-5 md:mb-6 max-w-[58ch]">
                            {locale === "th"
                                ? "โอกาสอสังหาริมทรัพย์พัทยาที่ผ่านการคัดกรองและตรวจสอบข้อมูลแล้ว พร้อมทีมท้องถิ่นพาชมแบบส่วนตัวตามเป้าหมายของคุณ"
                                : "Curated and verified Pattaya opportunities, guided by a local team that plans private viewings around your goals."}
                        </p>

                        <div className="hero-cta-row flex flex-wrap gap-3 md:gap-4">
                            <TrackedLink
                                className="btn btn-primary"
                                href={withLocale(locale, "/contact")}
                                eventType="cta_click"
                                eventPayload={{ cta: "request_consultation", from: "home_hero" }}
                            >
                                {locale === "th" ? "ขอคำปรึกษา" : "Request Consultation"}
                            </TrackedLink>
                            <TrackedLink
                                className="btn btn-secondary"
                                href={withLocale(locale, "/projects")}
                                eventType="cta_click"
                                eventPayload={{ cta: "browse_projects", from: "home_hero" }}
                            >
                                {locale === "th" ? "ดูโครงการ" : "Browse Projects"}
                            </TrackedLink>
                        </div>

                        <div className="hero-trust-strip mt-4 md:mt-5" role="note" aria-label={locale === "th" ? "ข้อมูลความน่าเชื่อถือ" : "Trust highlights"}>
                            <span>{locale === "th" ? "รายการคัดสรร" : "Curated Listings"}</span>
                            <span>{locale === "th" ? "ข้อมูลตรวจสอบแล้ว" : "Verified Information"}</span>
                            <span>{locale === "th" ? "ทีมท้องถิ่นพัทยา" : "Local Pattaya Team"}</span>
                            <span>{locale === "th" ? "พาชมแบบส่วนตัว" : "Private Tours Available"}</span>
                        </div>

                        <div className="hero-path-grid mt-5 md:mt-6" aria-label={locale === "th" ? "เส้นทางหลัก" : "Primary paths"}>
                            {heroPathCards.map((card) => (
                                <TrackedLink
                                    key={card.key}
                                    className="hero-path-card"
                                    href={card.href}
                                    eventType="path_entry_click"
                                    eventPayload={card.eventPayload}
                                >
                                    <div className="hero-path-card__header">
                                        <span className="hero-path-card__icon" aria-hidden="true">{card.icon}</span>
                                        <h3>{card.title}</h3>
                                    </div>
                                    <p>{card.desc}</p>
                                    <span className="hero-path-card__result">
                                        {card.result}
                                    </span>
                                </TrackedLink>
                            ))}
                        </div>

                        {/* 40-56px from CTA group (mt-10 = 40px) */}
                        <TrackedLink
                            className="hero-guided-trigger inline-flex items-center gap-2 mt-4 md:mt-6 text-white/80 hover:text-white text-sm font-medium transition-colors"
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
