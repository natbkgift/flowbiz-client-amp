"use client"
import { motion } from "framer-motion"

export function Reveal({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            viewport={{ once: true, margin: "-80px" }}
        >
            {children}
        </motion.div>
    )
}
