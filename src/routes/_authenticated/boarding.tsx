import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";
import { PageHeader } from "@/components/gala/AppShell";
import { Button } from "@/components/ui/button";
import { computeStats, formatTime, useOverview } from "@/hooks/useGala";

export const Route = createFileRoute("/_authenticated/boarding")({
  head: () => ({
    meta: [
      { title: "Bus Boarding | Roscommon House Met Gala" },
      {
        name: "description",
        content: "Live bus boarding roster for the Roscommon Formal — who is on board and who is still to arrive.",
      },
      { property: "og:title", content: "Bus Boarding | Roscommon House Met Gala" },
      { property: "og:description", content: "Boarding roster and times for Met Gala: Burgundy and Black." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoardingPage,
});

function BoardingPage() {
  const { data } = useOverview();
  const roster = data?.roster ?? [];
  const stats = computeStats(roster);
  const boarded = roster.filter((r) => r.boarded);
  const pending = roster.filter((r) => !r.boarded);

  return (
    <div>
      <PageHeader
        eyebrow="DEPARTURE"
        title="Bus Boarding"
        description={`${stats.boarded} of ${stats.registered} guests on board.`}
        action={
          <Button asChild>
            <Link to="/scan">
              <QrCode className="mr-2 h-4 w-4" /> Open scanner
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <List title="ON BOARD" empty="No one has boarded yet.">
          {boarded.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-display text-xl leading-tight">
                  {r.firstName} {r.surname}
                </p>
                <p className="text-xs tracking-[0.14em] text-muted-foreground">{r.studentNumber}</p>
              </div>
              <p className="text-xs text-muted-foreground">{formatTime(r.boardingTime)}</p>
            </li>
          ))}
        </List>

        <List title="AWAITING BOARDING" empty="Everyone is on board.">
          {pending.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-display text-xl leading-tight">
                  {r.firstName} {r.surname}
                </p>
                <p className="text-xs tracking-[0.14em] text-muted-foreground">{r.studentNumber}</p>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{r.ticketNumber ?? "NO TICKET"}</span>
            </li>
          ))}
        </List>
      </div>
    </div>
  );
}

function List({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="shadow-elegant rounded-sm border border-border bg-card p-6">
      <h2 className="text-[10px] tracking-editorial text-primary">{title}</h2>
      <div className="rule-gold my-4" />
      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
    </section>
  );
}
