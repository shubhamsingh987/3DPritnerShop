"use client";

import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PRODUCTS } from "@/lib/constants";

type Testimonial = {
  name: string;
  location: string;
  productSlug: string;
  rating: number;
  quote: string;
};

// PLACEHOLDERS — not real reviews. Swap each entry for a genuine customer
// review (with their permission) before launch; never publish invented ones.
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Customer name",
    location: "City",
    productSlug: "kunai",
    rating: 5,
    quote: "Placeholder — a short, real customer quote about this piece goes here.",
  },
  {
    name: "Customer name",
    location: "City",
    productSlug: "corset-vase",
    rating: 5,
    quote: "Placeholder — what they noticed about the finish, the detail, or the packaging.",
  },
  {
    name: "Customer name",
    location: "City",
    productSlug: "hexapod-mug-stand",
    rating: 5,
    quote: "Placeholder — where it lives in their home or on their desk now.",
  },
  {
    name: "Customer name",
    location: "City",
    productSlug: "crystal-phone-stand",
    rating: 5,
    quote: "Placeholder — one or two lines is plenty; keep their own words.",
  },
];

const cardSx = {
  flex: { xs: "0 0 82%", sm: "0 0 calc(50% - 8px)", lg: "1 1 0" },
  minWidth: 0,
  scrollSnapAlign: "start",
  bgcolor: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  boxShadow: "var(--shadow-card)",
  transition: "transform 0.3s var(--ease-standard), border-color 0.3s",
  "&:hover": { transform: "translateY(-4px)", borderColor: "var(--color-border-strong)" },
} as const;

export default function Testimonials() {
  return (
    <Box component="section" sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 10, md: 14 } }}>
      <Box sx={{ mx: "auto", maxWidth: 1152 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <p className="text-mono-label text-xs text-text-faint">From collectors</p>
          <Chip
            label="Placeholder"
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: 10, color: "var(--color-text-dim)", borderColor: "var(--color-border-strong)" }}
          />
        </Stack>
        <h2 className="text-display mt-3 text-2xl leading-[1.15] text-text md:text-3xl">
          What people say once it arrives.
        </h2>

        {/* Flex row: scroll-snapping carousel on phones, 2-up on tablets,
            all four in one row on desktop. */}
        <Box
          sx={{
            mt: 5,
            display: "flex",
            gap: 2,
            flexWrap: { xs: "nowrap", sm: "wrap", lg: "nowrap" },
            overflowX: { xs: "auto", sm: "visible" },
            scrollSnapType: "x mandatory",
            pb: { xs: 1, sm: 0 },
            mx: { xs: -2.5, sm: 0 },
            px: { xs: 2.5, sm: 0 },
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {TESTIMONIALS.map((t, i) => {
            const product = PRODUCTS.find((p) => p.slug === t.productSlug);
            return (
              <Card key={i} elevation={0} sx={cardSx}>
                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
                  <Rating value={t.rating} readOnly size="small" sx={{ color: "var(--color-accent)" }} />
                  <Typography
                    component="blockquote"
                    sx={{ m: 0, flexGrow: 1, fontSize: 15, lineHeight: 1.6, color: "var(--color-text)" }}
                  >
                    “{t.quote}”
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: 14,
                        bgcolor: "var(--color-accent-soft)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {t.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                        {t.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "var(--color-text-faint)" }} noWrap>
                        {t.location}
                        {product && (
                          <>
                            {" · "}
                            <Link href={`/designs/${product.slug}`} className="underline-offset-2 hover:underline">
                              {product.name}
                            </Link>
                          </>
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
