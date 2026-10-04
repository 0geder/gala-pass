import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";

const RUNNING_ORDER = [
  { time: "5:00 PM", item: "Arrivals, Welcome Drinks & Photobooth" },
  { time: "6:30 PM", item: "The Choir Begins" },
  { time: "7:00 PM", item: "Programme Opens: Academic Awards" },
  { time: "8:00 PM", item: "Main Course & Photobooth" },
  { time: "8:45 PM", item: "Back to Your Seats" },
  { time: "9:00 PM", item: "Subcommittees Announced" },
  { time: "10:05 PM", item: "Awards & Recognition" },
  { time: "10:30 PM", item: "Dancing" },
  { time: "11:45 PM", item: "Farewell" },
];

export const Route = createFileRoute("/programme")({
  head: () => ({
    meta: [
      { title: "Programme | Roscommon House Met Gala" },
      {
        name: "description",
        content:
          "The running order for The Roscommon Met: Burgundy & Black, 16 October 2026 at Suikerbossie.",
      },
      { property: "og:title", content: "Programme | Roscommon House Met Gala" },
      { property: "og:description", content: "Tonight's programme for The Roscommon Met." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgrammePage,
});

function ProgrammePage() {
  return (
    <div className="min-h-screen bg-noir px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <BackLink label="BACK" />

        <header className="mt-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 font-display text-xl text-champagne italic">
            M
          </span>
          <p className="mt-6 text-[10px] tracking-editorial text-gold">
            ROSCOMMON HOUSE COMMITTEE PRESENTS
          </p>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] text-ivory sm:text-6xl">
            The <span className="text-champagne italic">Roscommon</span>
            <br />
            Met
          </h1>
          <p className="mt-4 text-sm text-champagne/70">
            Burgundy &amp; Black · An Evening of Elegance
          </p>
          <p className="font-display mt-3 text-lg text-champagne">16 October 2026 · Suikerbossie</p>
        </header>

        <section className="mt-16">
          <p className="text-center text-[10px] tracking-editorial text-gold">THE RUNNING ORDER</p>
          <h2 className="font-display mt-3 text-center text-3xl text-ivory sm:text-4xl">
            Tonight's Programme
          </h2>
          <div className="rule-gold mx-auto my-8 max-w-16" />

          <ol className="mx-auto max-w-md">
            {RUNNING_ORDER.map(({ time, item }, index) => (
              <li
                key={time}
                className="grid grid-cols-[4.75rem_1.75rem_1fr] sm:grid-cols-[5.5rem_2rem_1fr]"
              >
                <span className="font-display py-3 text-right text-sm leading-7 text-champagne/70 sm:text-base">
                  {time}
                </span>
                <span className="relative flex justify-center">
                  <span
                    className={`absolute w-px bg-gold/30 ${
                      index === 0
                        ? "top-[1.7rem] bottom-0"
                        : index === RUNNING_ORDER.length - 1
                          ? "top-0 h-[1.7rem]"
                          : "top-0 bottom-0"
                    }`}
                  />
                  <span className="relative mt-[1.45rem] h-2 w-2 rounded-full bg-gold" />
                </span>
                <span className="font-display py-3 text-lg leading-7 text-ivory sm:text-xl">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-14 text-center">
          <a
            href="/roscommon-met-programme.pdf"
            download
            className="inline-flex h-11 items-center gap-2 rounded-sm border border-gold/40 px-6 text-[10px] tracking-editorial text-champagne transition hover:border-gold hover:text-gold"
          >
            <Download className="h-4 w-4" /> DOWNLOAD THE PROGRAMME
          </a>
        </div>

        <div className="mt-14">
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
