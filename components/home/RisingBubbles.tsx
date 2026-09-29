"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCTS, getProductPrice, productMedia } from "@/lib/constants";
import { formatINR, cn } from "@/lib/utils";

/** One bubble's lane. Each lane is a full-height column that rises on a loop
 *  (see `.bubble-lane` in globals.css); the bubble sits at the lane's top
 *  edge, so the lane's own translateY carries it from just below the hero to
 *  just above it. Negative delays mean the field is already mid-flight on
 *  first paint instead of every bubble starting from the floor at once.
 *
 *  `x` is the lane's horizontal center (% of hero width). Lanes stay out of
 *  the centered text column from `md` up; on phones only the `mobile` lanes
 *  show, hugging the edges. */
type BubbleSpec = {
  slug: string;
  x: number;
  size: number; // px at desktop scale
  duration: number; // s, one full rise
  delay: number; // s, negative = starts mid-rise
  sway: number; // px, horizontal drift amplitude
  swayDuration: number; // s
  rest: number; // % of hero height, resting spot under reduced motion
  mobile?: boolean;
};

// Five on desktop, three on phones. Durations/delays are staggered so only
// two or three are on screen at once, never bunched in the same lane.
const BUBBLES: BubbleSpec[] = [
  { slug: "kunai", x: 11, size: 196, duration: 24, delay: -3, sway: 16, swayDuration: 5.2, rest: 22, mobile: true },
  { slug: "shuriken-four-point", x: 89, size: 184, duration: 26, delay: -16, sway: 15, swayDuration: 5.8, rest: 30, mobile: true },
  { slug: "hexapod-mug-stand", x: 25, size: 170, duration: 28, delay: -17, sway: 18, swayDuration: 6.4, rest: 70, mobile: true },
  { slug: "crystal-phone-stand", x: 74, size: 164, duration: 25, delay: -6, sway: 14, swayDuration: 5.5, rest: 76 },
  { slug: "corset-vase", x: 6, size: 150, duration: 27, delay: -11, sway: 12, swayDuration: 4.9, rest: 50 },
];

/** Size multiplier per breakpoint, applied to each bubble px size. */
function scaleFor(width: number) {
  if (width < 640) return 0.62;
  if (width < 1024) return 0.8;
  return 1;
}

function useBubbleScale() {
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setScale(scaleFor(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

/** Droplets flung out when a bubble bursts: angle (deg) and travel (× radius). */
const DROPLETS = Array.from({ length: 14 }, (_, i) => ({
  angle: (360 / 14) * i + (i % 2 ? 9 : -5),
  dist: 0.62 + ((i * 37) % 10) / 22,
  size: 3 + ((i * 53) % 5),
}));
const POP_MS = 460;

export default function RisingBubbles() {
  const scale = useBubbleScale();
  const router = useRouter();
  const [popping, setPopping] = useState<string | null>(null);

  // A plain click bursts the bubble, then navigates once the burst has played.
  // Modified clicks (new tab/window) and reduced motion skip straight through.
  const onBubbleClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    if (popping) return;
    setPopping(slug);
    window.setTimeout(() => router.push(`/designs/${slug}`), POP_MS);
  };

  const bubbles = useMemo(
    () =>
      scale === null
        ? []
        : BUBBLES.map((b) => {
            const product = PRODUCTS.find((p) => p.slug === b.slug)!;
            return { ...b, product, px: Math.round(b.size * scale) };
          }),
    [scale]
  );

  // Rendered only after mount: sizes depend on the viewport, and the lanes
  // are decoration over the hero timelapse, so there's nothing to lose by
  // skipping them in the server HTML.
  if (scale === null) return null;

  return (
    <div aria-label="Featured pieces" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {bubbles.map((b) => {
        const price = getProductPrice(b.product);
        const vars = {
          "--x": `${b.x}%`,
          "--s": `${b.px}px`,
          "--dur": `${b.duration}s`,
          "--delay": `${b.delay}s`,
          "--sway": `${Math.round(b.sway * scale)}px`,
          "--sway-dur": `${b.swayDuration}s`,
          "--rest": `${b.rest}%`,
        } as CSSProperties;
        return (
          <div
            key={b.slug}
            className={cn("bubble-lane", !b.mobile && "hidden sm:block", popping === b.slug && "is-popping")}
            style={vars}
          >
            <div className="bubble-sway">
              <div className="bubble-pop">
                <Link
                  href={`/designs/${b.product.slug}`}
                  aria-label={`${b.product.name}${price !== null ? ` · ${formatINR(price)}` : ""}`}
                  onClick={(e) => onBubbleClick(e, b.product.slug)}
                  className="liquid-glass group pointer-events-auto"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a transparent cutout inside a moving CSS layer; next/image's wrapper adds nothing here */}
                  <img src={productMedia(b.product.imageId)} alt="" draggable={false} className="liquid-glass__object" />
                  <span className="liquid-glass__caustic" />
                  <span className="liquid-glass__crescent" />
                  <span className="liquid-glass__specular" />
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-text px-2.5 py-1 text-[10px] font-medium text-bg opacity-0 shadow-card transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {b.product.name}
                    {price !== null && ` · ${formatINR(price)}`}
                  </span>
                </Link>
                {popping === b.slug && (
                  <span aria-hidden className="bubble-burst">
                    <span className="bubble-burst__ring" />
                    {DROPLETS.map((d, i) => (
                      <span
                        key={i}
                        className="bubble-burst__drop"
                        style={
                          {
                            "--a": `${d.angle}deg`,
                            "--d": `${d.dist * b.px * 0.5}px`,
                            "--ds": `${d.size}px`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
