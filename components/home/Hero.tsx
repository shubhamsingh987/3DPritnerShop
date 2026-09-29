"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PRODUCTS, getProductPrice } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import Button, { ButtonArrow } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import RisingBubbles from "./RisingBubbles";

// WebGL needs a browser canvas, so this chunk only loads client-side.
const PrintTimelapse = dynamic(() => import("./PrintTimelapse"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;
const PRICED_PRODUCTS = PRODUCTS.map(getProductPrice).filter((p): p is number => p !== null);
const FROM_PRICE = PRICED_PRODUCTS.length > 0 ? Math.min(...PRICED_PRODUCTS) : null;

export default function Hero() {
  return (
    <section className="relative -mt-16 flex min-h-screen min-h-svh min-h-dvh items-center overflow-hidden px-5 py-14 md:px-8 lg:py-0">
      {/* Live-rendered timelapse of a pyramid printing (see PrintTimelapse). */}
      <PrintTimelapse />

      {/* Base tint: keeps the timelapse visible while lifting text contrast. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-black/20 md:bg-black/10" />

      {/* Localized spotlight, centered on the text column — smooth radial falloff so the
          floating product circles at the edges stay bright and the video reads clearly. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] md:hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 66% at 50% 56%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.34) 42%, rgba(0,0,0,0.14) 70%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        style={{
          background:
            "radial-gradient(ellipse 58% 54% at 50% 50%, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.24) 45%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0) 100%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 42% 38% at 50% 48%, var(--hero-glow), transparent 72%)",
        }}
      />

      {/* Product bubbles rise from the hero's floor and pop out at the top.
          z-20: under the text (z-30) and CTA (z-40), so they never cover
          or block them. */}
      <RisingBubbles />

      <div className="pointer-events-none relative z-30 mx-auto flex w-full min-h-[520px] max-w-[1400px] items-center justify-center py-8 lg:min-h-[92vh] lg:py-12">
        <div className="pointer-events-auto relative z-30 mx-auto flex w-full max-w-[420px] flex-col items-center px-2 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
            className="text-mono-label text-xs text-[#E8D8B8] [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]"
          >
            The Objects
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.78, ease: EASE }}
            className="text-display mt-3 text-[clamp(2rem,4vw,2.75rem)] leading-[1.05] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]"
          >
            Objects made
            <br />
            to be collected.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.86, ease: EASE }}
            className="mt-3 max-w-[32ch] text-sm text-white/80 [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]"
          >
            A curated series of sculptural pieces, designed, printed, and finished with intention.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.95, ease: EASE }}
            className="relative z-40 mt-7"
          >
            <Button as="link" href="/designs" size="lg">
              View the collection
              <ButtonArrow>
                <ArrowRight size={14} />
              </ButtonArrow>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1, ease: EASE }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-white/70"
          >
            {FROM_PRICE !== null && (
              <>
                <span>From {formatINR(FROM_PRICE)}</span>
                <span>·</span>
              </>
            )}
            <span>2–4 day delivery</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} />
              Secure checkout
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
