import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const VENUE_QUERY = "Suikerbossie Restaurant & Estate, 1 The Suikerbossie Road, Hout Bay";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(VENUE_QUERY)}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(VENUE_QUERY)}`;

const AERIAL = {
  src: "/venue/suikerbossie-aerial.avif",
  alt: "Aerial view of Suikerbossie Restaurant & Estate at sunset, lawns and terrace above the Atlantic in Hout Bay",
};

const GALLERY = [
  {
    src: "/venue/fairy-light-tent.jpeg",
    alt: "Long banquet table under a canopy of fairy lights with burgundy roses",
  },
  {
    src: "/venue/long-table-candles.jpeg",
    alt: "Candlelit wooden table with burgundy napkins and gold cutlery",
  },
  {
    src: "/venue/round-tables-evening.jpeg",
    alt: "Round tables set with tall red candles and gold chargers at dusk",
  },
  {
    src: "/venue/place-setting-menu.jpeg",
    alt: "Place setting with a menu card on a burgundy napkin beside champagne",
  },
  {
    src: "/venue/noir-table-florals.jpeg",
    alt: "Black tablecloth lined with deep red florals and glowing candles",
  },
  {
    src: "/venue/sunset-long-table.jpeg",
    alt: "Long table with red roses and candles overlooking a sunset",
  },
];

export const Route = createFileRoute("/venue")({
  head: () => ({
    meta: [
      { title: "The Venue | Roscommon House Met Gala" },
      {
        name: "description",
        content:
          "Suikerbossie Restaurant & Estate, Hout Bay. The venue for the Roscommon House Met Gala.",
      },
      { property: "og:title", content: "The Venue | Roscommon House Met Gala" },
      { property: "og:description", content: "Suikerbossie Restaurant & Estate, Hout Bay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VenuePage,
});

function VenuePage() {
  const [open, setOpen] = useState<(typeof GALLERY)[number] | null>(null);

  return (
    <div className="min-h-screen bg-noir px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <BackLink label="BACK" />

        <button
          type="button"
          onClick={() => setOpen(AERIAL)}
          className="group shadow-elegant relative mt-8 block w-full overflow-hidden rounded-sm border border-gold/25"
        >
          <img
            src={AERIAL.src}
            alt={AERIAL.alt}
            width={1654}
            height={860}
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/8] transition duration-700 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-noir/80 to-transparent px-5 pt-12 pb-4 text-left text-[10px] tracking-editorial text-champagne">
            THE ESTATE · SUNSET OVER THE ATLANTIC
          </span>
        </button>

        <section className="mt-14 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] tracking-editorial text-gold">THE VENUE</p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-ivory sm:text-6xl">
              Suikerbossie
            </h1>
            <p className="mt-3 text-sm tracking-[0.14em] text-champagne/70">
              RESTAURANT &amp; ESTATE · HOUT BAY
            </p>
            <div className="rule-gold my-8 max-w-md" />
            <p className="max-w-md text-base leading-relaxed text-champagne/80">
              One night on the Atlantic coast, dressed in burgundy and black. Candlelight, roses and
              gold on every table. This is where the Roscommon Formal comes to life on 16 October
              2026.
            </p>
            <a
              href="#map"
              className="mt-8 inline-flex items-center gap-2 text-[10px] tracking-editorial text-champagne/70 hover:text-gold"
            >
              <MapPin className="h-4 w-4" /> FIND US
            </a>
          </div>

          <div className="shadow-elegant mx-auto w-full max-w-sm overflow-hidden rounded-sm border border-gold/25">
            <img
              src="/thehands.jpeg"
              alt="Gloved hands holding a burgundy envelope sealed with a gold wax M, Roscommon House Met Gala 2026"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="mt-20">
          <p className="text-[11px] tracking-editorial text-gold">THE LOOK OF THE EVENING</p>
          <p className="mt-2 max-w-lg text-sm text-champagne/60">
            Burgundy, black and candlelight. A taste of the mood we are setting for the night.
          </p>
          <div className="rule-gold my-6" />

          <div className="columns-2 gap-4 sm:columns-3">
            {GALLERY.map((image) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setOpen(image)}
                className="group mb-4 block w-full overflow-hidden rounded-sm border border-gold/20 break-inside-avoid"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="w-full transition duration-500 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>

        <section id="map" className="mt-20 scroll-mt-10">
          <p className="text-[11px] tracking-editorial text-gold">FIND US</p>
          <p className="mt-2 text-sm text-champagne/60">1 The Suikerbossie Road, Hout Bay</p>
          <div className="rule-gold my-6" />
          <div className="overflow-hidden rounded-sm border border-gold/25">
            <iframe
              title="Map of Suikerbossie Restaurant & Estate"
              src={MAP_EMBED_SRC}
              className="h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={MAP_LINK}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-champagne/70 hover:text-gold"
          >
            Open in Google Maps <ExternalLink className="h-4 w-4" />
          </a>
        </section>

        <div className="mt-16">
          <BackLink label="BACK TO THE GALA" />
        </div>
      </div>

      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl border-gold/25 bg-noir p-2">
          <DialogTitle className="sr-only">{open?.alt ?? "Gallery image"}</DialogTitle>
          {open && (
            <img
              src={open.src}
              alt={open.alt}
              className="max-h-[80vh] w-full rounded-sm object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-[10px] tracking-editorial text-champagne/70 hover:text-gold"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
