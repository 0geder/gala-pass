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
  if (!value) return "16/10/2026";
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <p className="text-[9px] tracking-editorial text-noir/50">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-noir">{value}</p>
    </div>
  );
}

export function GalaTicket({ ticket, event }: { ticket: TicketData; event?: TicketEvent | null }) {
  return (
    <div className="shadow-ticket relative mx-auto flex w-full max-w-3xl overflow-hidden rounded-sm border border-border print:shadow-none">
      {/* Photo panel */}
      <div className="relative hidden w-[30%] shrink-0 sm:block">
        <img
          src="/thehands.jpeg"
          alt="Roscommon House Met Gala — sealed invitation"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 bg-ivory text-noir">
        <div className="flex-1 p-7">
          <img src="/roscommon.png" alt="Roscommon House" className="h-7 w-auto" />
          <p className="mt-5 text-[10px] tracking-editorial text-burgundy">EVENT TICKET</p>
          <h2 className="font-display -mt-1 text-4xl leading-[0.95] text-burgundy sm:text-5xl">
            FORMAL
            <br />
            <span className="font-bold text-burgundy-deep">DINNER</span>
          </h2>

          <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-noir/15 rounded-sm border border-noir/15">
            <Cell label="VENUE" value={(event?.venue ?? "Suikerbossie").toUpperCase()} />
            <Cell label="DATE" value={formatDate(event?.event_date)} />
            <Cell label="ATTENDEE" value={`${ticket.firstName} ${ticket.surname}`} />
            <Cell label="STUDENT NO" value={ticket.studentNumber} />
          </div>

          <p className="mt-4 text-[10px] tracking-editorial text-noir/50">
            DIETARY{" "}
            <span className="font-medium text-noir">{ticket.dietary?.trim() || "NONE"}</span>
          </p>
        </div>

        {/* Perforated stub */}
        <div className="relative flex w-[132px] shrink-0 flex-col items-center justify-center gap-3 border-l border-dashed border-noir/25 p-4 text-center">
          <span className="absolute top-0 left-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute bottom-0 left-0 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-background" />
          <QrImage value={ticket.qrToken} size={100} />
          <div>
            <p className="text-[8px] tracking-editorial text-noir/50">TICKET NUMBER</p>
            <p className="font-display text-sm text-burgundy">{ticket.ticketNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
