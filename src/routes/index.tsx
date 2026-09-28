import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DoorOpen, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/gala-hero.jpg";

const EVENT_DATE = new Date("2026-10-16T00:00:00");

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Countdown({ target }: { target: Date }) {
  const [parts, setParts] = useState<ReturnType<typeof getCountdown>>(null);

  useEffect(() => {
    setParts(getCountdown(target));
    const id = setInterval(() => setParts(getCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!parts) return null;

  const units: [string, number][] = [
    ["DAYS", parts.days],
    ["HOURS", parts.hours],
    ["MINUTES", parts.minutes],
    ["SECONDS", parts.seconds],
  ];

  return (
    <div className="mt-8 flex gap-6 sm:gap-10">
      {units.map(([label, value]) => (
        <div key={label}>
          <p className="font-display text-4xl tabular-nums text-ivory sm:text-5xl">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[9px] tracking-editorial text-champagne/60">{label}</p>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roscommon House Met Gala 2026 | Burgundy and Black" },
      {
        name: "description",
        content:
          "Digital ticketing, QR verification and bus attendance for the Roscommon House Met Gala: Burgundy and Black — 16 October 2026, Suikerbossie.",
      },
      { property: "og:title", content: "Roscommon House Met Gala 2026 | Burgundy and Black" },
      {
        property: "og:description",
        content: "The Roscommon Formal — digital tickets, QR check-in and live bus attendance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  return (
    <div className="min-h-screen bg-noir">
      <section className="relative min-h-screen">
        <img
          src={heroImage}
          alt="Candlelit burgundy ballroom prepared for the Roscommon House Met Gala"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.147_0.002_17/0.75),oklch(0.229_0.093_17.5/0.85))]" />

        <Link
          to={signedIn ? "/dashboard" : "/auth"}
          aria-label="Housecomm sign in"
          title="Housecomm sign in"
          className="absolute right-5 top-5 z-10 rounded-full p-2.5 text-champagne/25 transition hover:text-gold sm:right-8 sm:top-8"
        >
          <DoorOpen className="h-5 w-5" />
        </Link>

        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
          <div className="flex items-center gap-3">
            <img
              src="/roscommon.png"
              alt="Roscommon House"
              className="h-8 w-auto brightness-0 invert sm:h-9"
            />
            <p className="text-[10px] tracking-editorial text-champagne/80">ROSCOMMON HOUSE</p>
          </div>
          <h1 className="font-display mt-6 text-5xl leading-[0.9] text-ivory sm:text-7xl lg:text-8xl">
            MET GALA
            <br />
            <span className="text-champagne">BURGUNDY</span>
            <br />
            AND BLACK
          </h1>
          <div className="rule-gold my-8 max-w-md" />
          <p className="text-[11px] tracking-editorial text-gold">THE ROSCOMMON FORMAL</p>
          <p className="mt-3 text-sm tracking-[0.2em] text-champagne/70">
            16 OCTOBER 2026 ·{" "}
            <Link to="/venue" className="underline decoration-gold/50 underline-offset-4 hover:text-champagne">
              SUIKERBOSSIE
            </Link>
          </p>

          <Countdown target={EVENT_DATE} />

          <Link
            to="/venue"
            className="mt-12 inline-flex max-w-md items-center gap-4 rounded-sm border border-gold/25 bg-noir/40 p-5 transition hover:border-gold/50"
          >
            <MapPin className="h-5 w-5 shrink-0 text-gold" />
            <span>
              <span className="block text-[10px] tracking-editorial text-champagne">SEE THE VENUE</span>
              <span className="mt-1 block text-sm text-champagne/60">
                Suikerbossie Restaurant &amp; Estate, Hout Bay. Take a look at where it's happening.
              </span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
