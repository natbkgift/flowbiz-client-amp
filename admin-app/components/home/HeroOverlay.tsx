"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function HeroOverlay() {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 600], [0, 40]);

    return (
        <motion.div
            style={{ y }}
            className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 will-change-transform pointer-events-none"
        />
    );
}
