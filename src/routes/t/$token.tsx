import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, ShieldAlert } from "lucide-react";
import { GalaTicket } from "@/components/gala/GalaTicket";
import { getPublicTicket } from "@/lib/ticket.functions";
import { useTicketDownload } from "@/hooks/useTicketDownload";

export const Route = createFileRoute("/t/$token")({
  head: () => ({
    meta: [
      { title: "Your Ticket | Roscommon House Met Gala" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublicTicketPage,
});

const REASON_COPY: Record<string, string> = {
  revoked: "This ticket has been revoked.",
  cancelled: "This ticket has been cancelled.",
  not_found: "We couldn't find a ticket for this link.",
};

function PublicTicketPage() {
  const { token } = Route.useParams();
  const fetchTicket = useServerFn(getPublicTicket);
  const { data, isPending, isError } = useQuery({
    queryKey: ["public-ticket", token],
    queryFn: () => fetchTicket({ data: { token } }),
    retry: false,
  });
  const { ticketRef, saving, save } = useTicketDownload(
    data?.found ? data.ticket.ticketNumber : null,
  );

  return (
    <div className="min-h-screen bg-noir px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-editorial text-champagne/80">ROSCOMMON HOUSE</p>
          <h1 className="font-display mt-2 text-3xl text-ivory sm:text-4xl">
            MET GALA · BURGUNDY AND BLACK
          </h1>
        </div>

        {isPending && (
          <div className="py-20 text-center text-champagne/70">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        )}

        {!isPending && data?.found && (
          <>
            <div ref={ticketRef}>
              <GalaTicket
                event={data.ticket.event}
                ticket={{
                  firstName: data.ticket.firstName,
                  surname: data.ticket.surname,
                  studentNumber: data.ticket.studentNumber,
                  dietary: data.ticket.dietary,
                  ticketNumber: data.ticket.ticketNumber,
                  qrToken: data.ticket.qrToken,
                }}
              />
            </div>
            <p className="mt-8 text-center text-xs tracking-[0.16em] text-champagne/50">
              PRESENT THIS QR CODE WHEN BOARDING THE BUS
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {(["pdf", "png"] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  disabled={saving !== null}
                  onClick={() => save(format)}
                  className="inline-flex h-11 items-center gap-2 rounded-sm border border-gold/40 px-6 text-[10px] tracking-editorial text-champagne transition hover:border-gold hover:text-gold disabled:opacity-60"
                >
                  {saving === format ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {format === "pdf" ? "SAVE AS PDF" : "SAVE AS IMAGE"}
                </button>
              ))}
            </div>
          </>
        )}

        {!isPending && ((data && !data.found) || isError) && (
          <div className="mx-auto max-w-md rounded-sm border border-gold/25 bg-noir/40 p-8 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-4 text-sm text-champagne/80">
              {isError
                ? "This ticket couldn't be loaded right now. Please try again shortly."
                : (REASON_COPY[data?.found === false ? data.reason : "not_found"] ??
                  REASON_COPY["not_found"])}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
