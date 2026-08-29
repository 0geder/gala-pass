import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BusFront, QrCode, ShieldCheck, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
            16 OCTOBER 2026 · SUIKERBOSSIE
          </p>

          <Countdown target={EVENT_DATE} />

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12">
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                {signedIn ? "Open event console" : "Staff sign in"}
              </Link>
            </Button>
            {signedIn && (
              <Button asChild size="lg" variant="outline" className="h-12">
                <Link to="/scan">
                  <QrCode className="mr-2 h-4 w-4" /> Scanner
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <Feature
              icon={Ticket}
              title="UNIQUE TICKETS"
              body="One attendee, one ticket, one secure QR token."
            />
            <Feature
              icon={QrCode}
              title="CAMERA CHECK-IN"
              body="Scan, verify server-side, board in one tap."
            />
            <Feature
              icon={BusFront}
              title="LIVE ATTENDANCE"
              body="Know exactly who boarded and who has returned."
            />
          </div>

          <p className="mt-14 flex items-center gap-2 text-xs text-champagne/50">
            <ShieldCheck className="h-4 w-4" /> Guest details are never stored inside the QR code.
          </p>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Ticket;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-sm border border-gold/25 bg-noir/40 p-5">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-4 text-[10px] tracking-editorial text-champagne">{title}</p>
      <p className="mt-2 text-sm text-champagne/60">{body}</p>
    </div>
  );
}
