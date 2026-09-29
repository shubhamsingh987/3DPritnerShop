import { calculateProductPrice, type MaterialType } from "./pricing";

export const BRAND = {
  name: "FORMA",
  tagline: "A curated collection of collectible objects.",
  year: 2026,
};

export const NAV_LINKS = [
  { label: "Collection", href: "/designs" },
  { label: "About", href: "/#about" },
];

/**
 * Real photos of the pieces we sell, stored at
 * public/media/products/<imageId>.jpg. `imageId` doubles as the filename —
 * everything downstream (product cards, product pages, next/image sizing)
 * reads through this one function, so swapping a photo means replacing the
 * file, not touching any component.
 */
export function productImage(imageId: string) {
  return `/media/products/${imageId}.jpg`;
}

/**
 * Background-removed cutout (RGBA PNG, stored at
 * public/media/products/thumbs/<imageId>.png) of the same photo
 * `productImage` serves. The source photos were shot on studio backdrops
 * that vary between warm-grey, cream and pure white; putting one of these
 * on a container with `object-contain` (rather than `object-cover`) would
 * otherwise show that baked-in backdrop as a mismatched rectangle against
 * the container's own surface color — or, worse, against a dark theme.
 * The cutout has no background of its own, so whatever surface color the
 * container is painted with (`bg-surface-2`, light/dark theme-aware) is
 * what actually shows through — one consistent surface, in both themes,
 * instead of one per photo.
 *
 * Not every imageId has one — see `hasThumb`/`productMedia` below, which
 * fall back to `productImage` for close-up crops whose corners run into
 * the product itself (no flat backdrop left to key out safely). The
 * homepage's full-bleed editorial shots (Hero, FinalCta)
 * intentionally skip this entirely and always use `productImage` — they
 * want the actual studio background, not a cutout.
 */
export function productThumb(imageId: string) {
  return `/media/products/thumbs/${imageId}.png`;
}

/**
 * Every base product photo that has a generated cutout — see `productThumb`.
 * `THUMB_IMAGE_IDS` below also lists a few `-red`/`-white`/`-detail` variant
 * files left over from a removed color-picker feature; they're unused by any
 * product entry now but the files still exist on disk, so leaving their ids
 * registered is harmless and cheaper than reprocessing anything.
 */
const RECOLORABLE_IMAGE_IDS = [
  "ashtray",
  "claude-figurine-clean",
  "corset-vase",
  "crystal-phone-stand",
  "cyber-samurai",
  "gravity-dice-tower",
  "hexapod-mug-stand",
  "jewellery-stand",
  "makeup-organizer",
  "nebula-fox",
  "retro-pixel-blaster",
  "spider-emblem-coaster",
  "twist-vase",
];

/** Every imageId that actually has a generated cutout — see `productThumb`. */
const THUMB_IMAGE_IDS = new Set([
  ...RECOLORABLE_IMAGE_IDS,
  ...RECOLORABLE_IMAGE_IDS.flatMap((id) => [`${id}-red`, `${id}-white`]),
  "corset-vase-blue",
  "corset-vase-detail",
  "corset-vase-blue-detail",
]);

export function hasThumb(imageId: string) {
  return THUMB_IMAGE_IDS.has(imageId);
}

/** The cutout when one exists for this imageId, otherwise the original photo. */
export function productMedia(imageId: string) {
  return hasThumb(imageId) ? productThumb(imageId) : productImage(imageId);
}

/** Same convention as `productImage`, for a product's optional demo/how-to-use clip. */
export function productVideo(videoId: string) {
  return `/media/products/${videoId}.mp4`;
}

export type Availability = "available" | "limited" | "sold-out";

export type Product = {
  /** URL slug and canonical product id. */
  slug: string;
  name: string;
  /** A single descriptive noun, not a filterable taxonomy — there is no category browsing. */
  category: string;
  /**
   * Verified print weight from the Bambu A1 print log — drives the
   * material-cost term of the pricing formula (see lib/pricing.ts). Null
   * means the weight hasn't been verified yet: never fill this with a guess,
   * and getProductPrice returns null so the UI shows "Price unavailable"
   * instead of a fabricated number.
   */
  weightInGrams: number | null;
  /** Slicer profile string from the print log (layer height, walls, infill), when known. */
  printProfile?: string;
  /** Pricing tier the material rate is looked up by. See MATERIAL_RATES in lib/pricing.ts. */
  materialType: MaterialType;
  /** Print material, shown as a spec on the product page — display text only. */
  material: string;
  finish: string;
  /** Bounding-box dimensions — either a verified measurement, or an approximate
   *  one (owner's estimate off a Bambu A1, see `dimensionsApprox`). */
  dimensionsMm?: { width: number; depth: number; height: number } | null;
  /** True when dimensionsMm is an approximate estimate rather than a measured value. */
  dimensionsApprox?: boolean;
  /**
   * For multi-part prints — a verified-only text label shown instead of a
   * fabricated single bounding box. Never combine unverified part dimensions
   * into one guess.
   */
  dimensionsLabel?: string;
  /** One or two sentences — what the piece is. */
  description: string;
  /** A short editorial line for the product page — why it exists / how it's made. */
  story: string;
  imageId: string;
  /**
   * Extra real photos of this same piece — other angles or close-up detail
   * shots — shown in the gallery after the main `imageId` photo. Never fill
   * this with a duplicate of the main photo just to pad the gallery; only
   * add a genuinely different, useful view.
   */
  galleryImageIds?: string[];
  /** Optional short clip demonstrating how the piece is used — see `productVideo`. */
  demoVideoId?: string;
  availability: Availability;
  creator: string;
};

/**
 * The complete catalog. Weight and material are sourced strictly from the
 * verified Bambu A1 print log — a product with no verified weight carries
 * `weightInGrams: null` rather than an estimate, and `getProductPrice`
 * returns null for it (see lib/pricing.ts), so the UI shows "Price
 * unavailable" instead of a fabricated number. Dimensions marked
 * `dimensionsApprox: true` are the owner's estimate off their Bambu A1, not
 * a measured value. Three catalog entries that turned out to be duplicate
 * photos of the same physical print (two "Runestone" coaster shots, and a
 * 4-point/8-point shuriken pair that are really one six-piece fidget set)
 * were consolidated rather than kept as separate products — see the
 * `shuriken-four-point` and `celtic-coaster` entries below.
 */
export const PRODUCTS: Product[] = [
  {
    slug: "kunai",
    name: "Minato's Hiraishin Kunai",
    category: "Prop",
    weightInGrams: 42.7,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsLabel:
      "Kunai 21.5 × 98.9 × 130 mm · Handle 21.5 × 21.5 × 69.3 mm · Ring spinner 32 × 43 × 9.8 mm · Union 14 × 27 × 9.8 mm",
    description:
      "A 3D-printed interpretation of Minato's Hiraishin Kunai, complete with a ring-spinner mechanism. Built as a display piece that also gives you something to fidget with.",
    story:
      "Modeled from a traditional kunai silhouette and printed flat for a true edge line — the kind of prop that reads as forged, not printed.",
    imageId: "cyber-samurai",
    demoVideoId: "kunai-demo",
    availability: "available",
    creator: "Studio Ronin",
  },
  {
    slug: "tentacle",
    name: "Tentacle Grip Headphone Stand",
    category: "Object",
    weightInGrams: null,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 90, depth: 90, height: 180 },
    dimensionsApprox: true,
    description:
      "A sculptural tentacle headphone stand with fine suction-cup detail, coiling up from a rocky base to cradle your headphones off the desk.",
    story: "Not yet in the verified Bambu print log — weight and price will appear once a finished print is logged. Dimensions shown are an estimate.",
    imageId: "nebula-fox",
    availability: "available",
    creator: "Lumen Forge",
  },
  {
    slug: "shuriken-four-point",
    name: "Fidget Shuriken",
    category: "Prop",
    weightInGrams: 7.0,
    printProfile: "0.12mm layer, 2 walls, 15% infill",
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsLabel:
      "Set of 6 — A 88.6 × 88.6 × 2.2 mm · B 77.9 × 67.5 × 2.2 mm · C 90 × 90 × 2.2 mm · D 90 × 90 × 2.2 mm · E 85.6 × 81.4 × 2.2 mm · F 77.9 × 90 × 2.2 mm",
    description:
      "A set of six shuriken-shaped fidget pieces designed to spin and play with. A compact desk object with a distinctly ninja-inspired design.",
    story: "Printed flat as one plate of six — thin enough to spin on the center bore, tough enough to survive a desk drop.",
    imageId: "retro-pixel-blaster",
    availability: "available",
    creator: "Pixel Foundry",
  },
  {
    slug: "corset-vase",
    name: "Goth Corset Brush Holder",
    category: "Object",
    weightInGrams: 91.7,
    printProfile: "0.16mm layer, 2 walls, 7% infill",
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 110, depth: 50, height: 180 },
    dimensionsApprox: true,
    description:
      "A gothic corset-inspired organizer designed to hold makeup brushes and other small accessories. Its sculptural form makes the organizer part of the display rather than something to hide away.",
    story: "Printed as a single continuous shell — no seams, no glue joints, no visible layer lines on the laced panels.",
    imageId: "corset-vase",
    availability: "available",
    creator: "Studio Quiet",
  },
  {
    slug: "celtic-coaster",
    name: "Runestone Coaster",
    category: "Object",
    weightInGrams: 31.5,
    printProfile: "0.2mm layer, 2 walls, 15% infill",
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 90, depth: 90, height: 10 },
    description:
      "A rune-inspired coaster designed to sit beneath your coffee, drinks, or everyday desk essentials. Its carved-looking surface gives it a small artifact-like feel.",
    story: "Sold individually — pair two or more to complete a set.",
    imageId: "gravity-dice-tower",
    availability: "available",
    creator: "FORMA Studio",
  },
  {
    slug: "jewellery-stand",
    name: "Nightshade Coil",
    category: "Object",
    weightInGrams: 180.8,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 90, depth: 90, height: 220 },
    dimensionsApprox: true,
    description:
      "A tentacle-inspired jewellery stand that coils upward to hold rings along its suckers and necklaces draped from its curling arm. Its sculptural shape makes it work as both a functional stand and a desk piece.",
    story: "The tentacle base carries the same sculpting language across the collection — printed tall and slow to keep every claw and sucker crisp.",
    imageId: "jewellery-stand",
    availability: "available",
    creator: "Lumen Forge",
  },
  {
    slug: "makeup-organizer",
    name: "Makeup Organizer",
    category: "Object",
    weightInGrams: 135,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 180, depth: 90, height: 110 },
    dimensionsApprox: true,
    description: "A brush cup and tiered tray in one piece, wrapped in a carved tentacle relief.",
    story: "Weight is an estimate, not yet a verified Bambu print log entry — the price above may adjust once a finished print is actually weighed. Dimensions shown are an estimate too.",
    imageId: "makeup-organizer",
    availability: "available",
    creator: "Lumen Forge",
  },
  {
    slug: "crystal-phone-stand",
    name: "Crystal Phone Stand",
    category: "Object",
    weightInGrams: 55,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte charcoal",
    dimensionsMm: { width: 110, depth: 70, height: 130 },
    dimensionsApprox: true,
    description: "A faceted crystal cluster that doubles as a phone dock.",
    story: "Weight is an estimate, not yet a verified Bambu print log entry — the price above may adjust once a finished print is actually weighed. Dimensions shown are an estimate too.",
    imageId: "crystal-phone-stand",
    availability: "available",
    creator: "Vantage Collective",
  },
  {
    slug: "ashtray",
    name: "Ashtray",
    category: "Vessel",
    weightInGrams: 20,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 110, depth: 110, height: 35 },
    dimensionsApprox: true,
    description:
      "A round ashtray with a carved medallion base and a ring of coiled tentacle relief along its rim. Sized for everyday use on a desk or table.",
    story: "A single-piece print with no assembly — the raised rim keeps ash contained while the tentacle relief stays purely decorative.",
    imageId: "ashtray",
    availability: "available",
    creator: "FORMA Studio",
  },
  {
    slug: "block-buddy",
    name: "Claude Block",
    category: "Figure",
    weightInGrams: 20,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte orange",
    dimensionsMm: { width: 70, depth: 45, height: 65 },
    dimensionsApprox: true,
    description: "A blocky, pixel-art desk figure with a simple two-eyed face — inspired by Claude.",
    story: "A small, single-color print — no supports, no multi-part assembly, just a blocky desk companion.",
    imageId: "claude-figurine-clean",
    availability: "available",
    creator: "Pixel Foundry",
  },
  {
    slug: "spider-emblem-coaster",
    name: "Mechanical Keyboard Keys",
    category: "Accessory",
    weightInGrams: 5.7,
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 18, depth: 18, height: 10 },
    dimensionsApprox: true,
    description:
      "A set of custom keycaps for a mechanical keyboard, each stamped with a raised emblem. A small way to add a bit of character to an otherwise ordinary keyboard.",
    story: "Sold as a pair — the same mould run twice, so you always have a matched spare.",
    imageId: "spider-emblem-coaster",
    availability: "available",
    creator: "Studio Ronin",
  },
  {
    slug: "hexapod-mug-stand",
    name: "Articulated Sci-Fi Coaster",
    category: "Object",
    weightInGrams: 24.1,
    printProfile: "0.16mm layer, 2 walls, 15% infill",
    materialType: "PLA",
    material: "PLA",
    finish: "Matte black",
    dimensionsMm: { width: 172.8, depth: 160.7, height: 40.6 },
    description:
      "A futuristic articulated coaster that doubles as a mechanical fidget. The moving construction makes it as fun to handle as it is useful on a desk.",
    story: "Each leg is printed as a single interlocking joint — no pins, no glue — so the whole stand articulates under a light touch.",
    imageId: "hexapod-mug-stand",
    galleryImageIds: ["hexapod-mug-stand-detail"],
    demoVideoId: "hexapod-mug-stand-demo",
    availability: "available",
    creator: "Vantage Collective",
  },
  {
    slug: "twist-vase",
    name: "Spiral Ribbon Vase",
    category: "Object",
    weightInGrams: 70,
    materialType: "PLA",
    material: "Silk PLA",
    finish: "Silk teal-green",
    description:
      "A tall vase printed as one continuous twisting ribbon, in a shimmering teal-to-green silk PLA that shifts color as the light moves across it.",
    story: "Weight is an estimate, not yet a verified Bambu print log entry — the price above may adjust once a finished print is actually weighed. Printed in vase mode: a single unbroken wall from base to rim, with no seam.",
    imageId: "twist-vase",
    galleryImageIds: ["twist-vase-detail"],
    demoVideoId: "twist-vase-demo",
    availability: "available",
    creator: "FORMA Studio",
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

/**
 * The selling price for a catalog product, computed fresh from its weight
 * and material every call — see lib/pricing.ts. Never read/store a price
 * anywhere else in the catalog layer. Returns null when the product's
 * weight isn't verified yet — callers must handle that case explicitly
 * (e.g. "Price unavailable") rather than coercing it into a number.
 */
export function getProductPrice(
  product: Pick<Product, "weightInGrams" | "materialType">
): number | null {
  return calculateProductPrice(product.weightInGrams, product.materialType);
}

/** "PLA · 24g" — only the fields that are actually verified. */
export function formatPrintSpec(product: Product) {
  const parts: string[] = [product.material];
  if (product.weightInGrams !== null) parts.push(`${formatGrams(product.weightInGrams)}g`);
  return parts.join(" · ");
}

function formatGrams(grams: number) {
  return Number.isInteger(grams) ? String(grams) : grams.toFixed(1);
}

export const FOOTER_LINKS = {
  Collection: [
    { label: "All pieces", href: "/designs" },
    { label: "Track order", href: "/track" },
  ],
  Help: [
    { label: "FAQ", href: "/support#faq" },
    { label: "Shipping", href: "/support" },
    { label: "Returns", href: "/support" },
    { label: "Contact", href: "/support" },
  ],
  Account: [
    { label: "Orders", href: "/account/orders" },
    { label: "Profile", href: "/account/settings" },
  ],
};

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X", href: "https://x.com" },
];
