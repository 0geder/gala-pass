import { createFileRoute, Link } from "@tanstack/react-router";
import { BusFront, QrCode, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/gala/AppShell";
import { Button } from "@/components/ui/button";
import { computeStats, formatTime, useOverview } from "@/hooks/useGala";
import heroImage from "@/assets/gala-hero.jpg";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Gala Dashboard | Roscommon House Met Gala" },
      {
        name: "description",
        content:
          "Live attendance dashboard for Met Gala: Burgundy and Black — registered guests, tickets issued, boarded, returned and still out.",
      },
      { property: "og:title", content: "Gala Dashboard | Roscommon House Met Gala" },
      { property: "og:description", content: "Live boarding and return status for the Roscommon Formal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isPending, error } = useOverview();
  const roster = data?.roster ?? [];
  const stats = computeStats(roster);
  const event = data?.event;
  const stillOut = roster.filter((r) => r.boarded && !r.returned);

  const eventDate = event?.event_date
    ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "16 October 2026";

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden rounded-sm border border-border">
        <img
          src={heroImage}
          alt="Burgundy draped ballroom set for the Roscommon House Met Gala"
          width={1920}
          height={1088}
          className="h-[300px] w-full object-cover sm:h-[380px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.147_0.002_17/0.94),oklch(0.229_0.093_17.5/0.6))]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <p className="text-[10px] tracking-editorial text-champagne/80">ROSCOMMON HOUSE</p>
          <h1 className="font-display mt-3 text-4xl leading-[0.95] text-ivory sm:text-6xl">
            MET GALA
            <br />
            <span className="text-champagne">BURGUNDY AND BLACK</span>
          </h1>
          <div className="rule-gold my-5 max-w-sm" />
          <p className="text-[10px] tracking-editorial text-gold">
            THE ROSCOMMON FORMAL · {eventDate.toUpperCase()} · {(event?.venue ?? "SUIKERBOSSIE").toUpperCase()}
          </p>
        </div>
      </section>

      <PageHeader
        eyebrow="LIVE ATTENDANCE"
        title="Event Control"
        description="Real-time boarding and return status. Figures update the moment a ticket is scanned."
        action={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/scan">
                <QrCode className="mr-2 h-4 w-4" /> Scan
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/returns">
                <Undo2 className="mr-2 h-4 w-4" /> Returns
              </Link>
            </Button>
          </div>
        }
      />

      {error && (
        <p className="mb-6 rounded-sm border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load event data."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Stat label="REGISTERED" value={stats.registered} loading={isPending} />
        <Stat label="TICKETS ISSUED" value={stats.issued} loading={isPending} />
        <Stat label="BOARDED" value={stats.boarded} loading={isPending} />
        <Stat label="RETURNED" value={stats.returned} loading={isPending} />
        <Stat label="STILL OUT" value={stats.stillOut} loading={isPending} emphasis />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="shadow-elegant rounded-sm border border-border bg-card p-6">
          <h2 className="text-[10px] tracking-editorial text-primary">BUS RETURN STATUS — STILL OUT</h2>
          <div className="rule-gold my-4" />
          {stillOut.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {stats.boarded === 0
                ? "Nobody has boarded yet."
                : "Everyone who boarded has been checked back in."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stillOut.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-display text-xl leading-tight">
                      {r.firstName} {r.surname}
                    </p>
                    <p className="text-xs tracking-[0.14em] text-muted-foreground">{r.studentNumber}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Boarded {formatTime(r.boardingTime)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="shadow-elegant rounded-sm border border-border bg-card p-6">
          <h2 className="text-[10px] tracking-editorial text-primary">NOT YET BOARDED</h2>
          <div className="rule-gold my-4" />
          {stats.notBoarded === 0 ? (
            <p className="text-sm text-muted-foreground">Every registered guest has boarded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {roster
                .filter((r) => !r.boarded)
                .slice(0, 12)
                .map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-display text-xl leading-tight">
                        {r.firstName} {r.surname}
                      </p>
                      <p className="text-xs tracking-[0.14em] text-muted-foreground">{r.studentNumber}</p>
                    </div>
                    <span className="text-[10px] tracking-editorial text-muted-foreground">
                      {r.ticketNumber ?? "NO TICKET"}
                    </span>
                  </li>
                ))}
            </ul>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link to="/boarding">
              <BusFront className="mr-2 h-4 w-4" /> Open boarding roster
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  loading,
  emphasis,
}: {
  label: string;
  value: number;
  loading: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`shadow-elegant rounded-sm border p-5 ${
        emphasis ? "surface-noir border-gold/30" : "border-border bg-card"
      }`}
    >
      <p className={`text-[9px] tracking-editorial ${emphasis ? "text-gold" : "text-muted-foreground"}`}>{label}</p>
      <p className={`font-display mt-3 text-5xl leading-none ${emphasis ? "text-ivory" : "text-foreground"}`}>
        {loading ? "—" : value}
      </p>
    </div>
  );
}
