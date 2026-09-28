import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";

const FORM_ID = "1FAIpQLSdp90eQiHngWxSG6hN5a4DGyEpp4tKn2NvAVZTUAk84N1YBdA";
const FORM_EMBED_SRC = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform?embedded=true`;
const FORM_LINK = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform`;

const REMINDERS = [
  "You can buy a ticket for yourself and one other Eagle (2 tickets max).",
  "Buying for someone else? You each need to fill out your own form.",
  "Tickets are limited to Roscommon students for now.",
  "Pay first. The form only accepts entries with proof of payment attached.",
  "Use your Name, Surname and SMID (Respublica ID) as your payment reference.",
];

export const Route = createFileRoute("/get-tickets")({
  head: () => ({
    meta: [
      { title: "Tickets | Roscommon House Met Gala" },
      {
        name: "description",
        content:
          "Buy your ticket for the Roscommon House Met Gala: Burgundy and Black, 16 October 2026.",
      },
      { property: "og:title", content: "Tickets | Roscommon House Met Gala" },
      { property: "og:description", content: "Tickets R120. Roscommon students only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketsPage,
});

function TicketsPage() {
  return (
    <div className="min-h-screen bg-noir px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <BackLink label="BACK" />

        <p className="mt-10 text-[11px] tracking-editorial text-gold">TICKETS</p>
        <h1 className="font-display mt-3 text-5xl leading-[0.95] text-ivory sm:text-6xl">
          Get your ticket
        </h1>
        <p className="mt-3 text-sm tracking-[0.14em] text-champagne/70">
          R120 · 16 OCTOBER 2026 · SUIKERBOSSIE
        </p>

        <div className="rule-gold my-8" />

        <section className="rounded-sm border border-gold/25 bg-noir/40 p-6">
          <p className="text-[10px] tracking-editorial text-champagne">BEFORE YOU BUY</p>
          <ul className="mt-4 space-y-2.5 text-sm text-champagne/75">
            {REMINDERS.map((reminder) => (
              <li key={reminder} className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                {reminder}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-col gap-3 rounded-sm border border-gold/25 bg-noir/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-champagne/70">
            The form needs a Google sign-in to upload your proof of payment. If it shows blank or
            asks you to sign in below, open it directly.
          </p>
          <a
            href={FORM_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-[10px] tracking-editorial text-primary-foreground transition hover:bg-primary/90"
          >
            OPEN THE FORM <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-4 overflow-hidden rounded-sm border border-gold/25 bg-ivory">
          <iframe
            title="Roscommon House Met Gala ticket form"
            src={FORM_EMBED_SRC}
            className="h-[80vh] min-h-[640px] w-full"
            loading="lazy"
          >
            Loading the ticket form…
          </iframe>
        </div>

        <div className="mt-12">
          <BackLink label="BACK TO THE GALA" />
        </div>
      </div>
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
