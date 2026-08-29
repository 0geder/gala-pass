import { QrImage } from "./QrImage";

export type TicketData = {
  firstName: string;
  surname: string;
  studentNumber: string;
  dietary?: string | null;
  ticketNumber: string;
  qrToken: string;
};

export type TicketEvent = {
  name?: string | null;
  subtitle?: string | null;
  event_date?: string | null;
  venue?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "16 OCTOBER 2026";
  const d = new Date(`${value}T00:00:00`);
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();
}

export function GalaTicket({ ticket, event }: { ticket: TicketData; event?: TicketEvent | null }) {
  return (
    <div className="shadow-ticket mx-auto flex w-full max-w-3xl overflow-hidden rounded-sm border border-border print:shadow-none">
      {/* Stub */}
      <div className="surface-noir relative hidden w-[34%] shrink-0 flex-col justify-between p-7 sm:flex">
        <div>
          <p className="text-[10px] tracking-editorial text-champagne">ROSCOMMON HOUSE</p>
          <div className="rule-gold my-4" />
          <h3 className="font-display text-4xl leading-[0.95] text-ivory">
            MET
            <br />
            GALA
          </h3>
          <p className="mt-3 text-[10px] tracking-editorial text-gold">BURGUNDY & BLACK</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] tracking-editorial text-champagne/70">ADMIT ONE</p>
          <p className="font-display text-2xl text-ivory">{ticket.ticketNumber}</p>
          <p className="text-[10px] tracking-[0.2em] text-champagne/60">THE ROSCOMMON FORMAL</p>
        </div>
        <div
          className="absolute top-0 right-0 h-full w-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--color-champagne) 0 6px, transparent 6px 12px)",
          }}
        />
      </div>

      {/* Main */}
      <div className="flex-1 bg-ivory p-7 text-noir">
        <img src="/roscommon.png" alt="Roscommon House" className="h-9 w-auto" />
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-editorial text-burgundy">
              FORMAL DINNER · INVITATION
            </p>
            <h2 className="font-display mt-2 text-3xl leading-tight text-burgundy-deep sm:text-4xl">
              {event?.name ?? "MET GALA: BURGUNDY AND BLACK"}
            </h2>
            <p className="mt-1 text-[11px] tracking-[0.22em] text-noir/60">
              {event?.subtitle ?? "THE ROSCOMMON FORMAL"}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] tracking-editorial text-noir/50">TICKET</p>
            <p className="font-display text-xl text-burgundy">{ticket.ticketNumber}</p>
          </div>
        </div>

        <div className="rule-gold my-6" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] tracking-editorial text-noir/50">ATTENDEE</p>
              <p className="font-display text-3xl leading-tight text-noir">
                {ticket.firstName} {ticket.surname}
              </p>
              <p className="mt-1 text-xs tracking-[0.18em] text-noir/60">{ticket.studentNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
              <div>
                <p className="text-[10px] tracking-editorial text-noir/50">DATE</p>
                <p className="mt-1 font-medium">{formatDate(event?.event_date)}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-editorial text-noir/50">VENUE</p>
                <p className="mt-1 font-medium">{(event?.venue ?? "Suikerbossie").toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-editorial text-noir/50">DIETARY</p>
                <p className="mt-1 font-medium">{ticket.dietary?.trim() || "NONE"}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-editorial text-noir/50">ADMITS</p>
                <p className="mt-1 font-medium">ONE</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <QrImage value={ticket.qrToken} size={168} />
            <p className="text-[9px] tracking-[0.16em] text-noir/45">SCAN AT BOARDING</p>
          </div>
        </div>
      </div>
    </div>
  );
}
