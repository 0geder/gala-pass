import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/gala/AppShell";
import { GalaTicket } from "@/components/gala/GalaTicket";
import { QrImage } from "@/components/gala/QrImage";
import { Button } from "@/components/ui/button";
import { useOverview, type RosterRow } from "@/hooks/useGala";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets | Roscommon House Met Gala" },
      {
        name: "description",
        content: "Every issued Met Gala ticket with its own unique QR token, rendered in the Burgundy and Black design.",
      },
      { property: "og:title", content: "Tickets | Roscommon House Met Gala" },
      { property: "og:description", content: "Unique digital tickets and QR tokens for the Roscommon Formal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketsPage,
});

function TicketsPage() {
  const { data } = useOverview();
  const roster = (data?.roster ?? []).filter((r) => r.qrToken && r.ticketNumber);
  const [selected, setSelected] = useState<RosterRow | null>(null);
  const active = selected ?? roster[0] ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="TICKET ATELIER"
        title="Issued Tickets"
        description="Each ticket carries a cryptographically random token — never a name or student number."
      />

      {roster.length === 0 ? (
        <p className="rounded-sm border border-border bg-card p-6 text-sm text-muted-foreground">
          No tickets issued yet. Import attendees to generate tickets.
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="shadow-elegant h-fit max-h-[560px] overflow-y-auto rounded-sm border border-border bg-card">
            {roster.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 ${
                  active?.id === r.id ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <span>
                  <span className="font-display block text-base leading-tight">
                    {r.firstName} {r.surname}
                  </span>
                  <span className="text-[10px] tracking-[0.14em] text-muted-foreground">{r.studentNumber}</span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{r.ticketNumber}</span>
              </button>
            ))}
          </aside>

          {active?.qrToken && active.ticketNumber && (
            <div className="space-y-6">
              <GalaTicket
                event={data?.event ?? null}
                ticket={{
                  firstName: active.firstName,
                  surname: active.surname,
                  studentNumber: active.studentNumber,
                  dietary: active.dietary,
                  ticketNumber: active.ticketNumber,
                  qrToken: active.qrToken,
                }}
              />
              <div className="shadow-elegant flex flex-wrap items-center gap-6 rounded-sm border border-border bg-card p-6">
                <QrImage value={active.qrToken} size={140} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] tracking-editorial text-muted-foreground">QR TOKEN</p>
                  <p className="mt-1 font-mono text-xs break-all">{active.qrToken}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    This token maps to ticket {active.ticketNumber} → {active.firstName} {active.surname} (
                    {active.studentNumber}). Scanning resolves it server-side.
                  </p>
                  <Button className="mt-4" variant="outline" onClick={() => window.print()}>
                    Print / save as PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
