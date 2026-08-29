import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicTicket = {
  ticketNumber: string;
  qrToken: string;
  firstName: string;
  surname: string;
  studentNumber: string;
  dietary: string | null;
  event: {
    name: string | null;
    subtitle: string | null;
    event_date: string | null;
    venue: string | null;
  } | null;
};

function normaliseToken(raw: string) {
  const value = raw.trim();
  // Support tokens embedded in a URL, e.g. https://app/t/RCF-abc123
  const match = value.match(/(RCF-[A-Za-z0-9]{8,})/i);
  return (match?.[1] ?? value).trim();
}

/**
 * Public ticket lookup by QR token — no auth required, used by the emailed
 * ticket link. Returns only the single matching attendee, never a roster.
 */
export const getPublicTicket = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().min(4).max(120) }).parse(input),
  )
  .handler(
    async ({
      data,
    }): Promise<
      | { found: true; ticket: PublicTicket }
      | { found: false; reason: "not_found" | "revoked" | "cancelled" }
    > => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const token = normaliseToken(data.token);

      const { data: ticket, error } = await supabaseAdmin
        .from("tickets")
        .select(
          `ticket_number, qr_token, status,
         attendee:attendees ( first_name, surname, student_number, dietary_requirement ),
         event:events ( name, subtitle, event_date, venue )`,
        )
        .eq("qr_token", token)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!ticket) return { found: false, reason: "not_found" };
      if (ticket.status === "revoked" || ticket.status === "cancelled") {
        return { found: false, reason: ticket.status as "revoked" | "cancelled" };
      }

      const attendee = Array.isArray(ticket.attendee) ? ticket.attendee[0] : ticket.attendee;
      const event = Array.isArray(ticket.event) ? ticket.event[0] : ticket.event;
      if (!attendee) return { found: false, reason: "not_found" };

      return {
        found: true,
        ticket: {
          ticketNumber: ticket.ticket_number,
          qrToken: ticket.qr_token,
          firstName: attendee.first_name,
          surname: attendee.surname,
          studentNumber: attendee.student_number,
          dietary: attendee.dietary_requirement,
          event: event
            ? {
                name: event.name,
                subtitle: event.subtitle,
                event_date: event.event_date,
                venue: event.venue,
              }
            : null,
        },
      };
    },
  );
