/**
 * HeroOverlay — pure CSS gradient, no JS required.
 *
 * The previous implementation used framer-motion (useScroll + useTransform)
 * to apply a subtle 0–40px parallax on the gradient overlay. The visual
 * effect was imperceptible on mobile and cost ~50 KB of client JS (framer-motion)
 * loaded eagerly on the LCP path. Replaced with a static CSS gradient.
 *
 * PHASE 1 PERF LOCK — DO NOT re-add framer-motion here.
 * Any scroll-linked animation on the hero overlay belongs in a separate
 * lazily-loaded component that is NOT in the above-the-fold critical path.
 */
export function HeroOverlay() {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 pointer-events-none" />
    );
}
