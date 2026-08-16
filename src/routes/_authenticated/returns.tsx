import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/gala/AppShell";
import { ScanConsole } from "@/components/gala/ScanConsole";
import { computeStats, formatTime, useOverview } from "@/hooks/useGala";

export const Route = createFileRoute("/_authenticated/returns")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Return Check-in | Roscommon House Met Gala" },
      {
        name: "description",
        content: "Scan the same gala ticket on the return journey and see exactly who is still out.",
      },
      { property: "og:title", content: "Return Check-in | Roscommon House Met Gala" },
      { property: "og:description", content: "Live return check-in for the Roscommon Formal bus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const { data } = useOverview();
  const roster = data?.roster ?? [];
  const stats = computeStats(roster);
  const stillOut = roster.filter((r) => r.boarded && !r.returned);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <PageHeader
          eyebrow="RETURN MODE"
          title="Return Check-in"
          description="Same ticket, return leg. Confirm each guest back onto the bus."
        />
        <ScanConsole mode="return" />
      </div>

      <aside className="shadow-elegant h-fit rounded-sm border border-border bg-card p-5">
        <h2 className="text-[10px] tracking-editorial text-primary">BUS RETURN STATUS</h2>
        <div className="rule-gold my-4" />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Mini label="Registered" value={stats.registered} />
          <Mini label="Boarded" value={stats.boarded} />
          <Mini label="Returned" value={stats.returned} />
          <Mini label="Still out" value={stats.stillOut} />
        </dl>
        <div className="rule-gold my-4" />
        <h3 className="text-[10px] tracking-editorial text-muted-foreground">STILL OUT</h3>
        {stillOut.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nobody outstanding.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {stillOut.map((r) => (
              <li key={r.id} className="py-2.5">
                <p className="font-display text-lg leading-tight">
                  {r.firstName} {r.surname}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.studentNumber} · boarded {formatTime(r.boardingTime)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[9px] tracking-editorial text-muted-foreground">{label.toUpperCase()}</dt>
      <dd className="font-display text-3xl leading-none">{value}</dd>
    </div>
  );
}
