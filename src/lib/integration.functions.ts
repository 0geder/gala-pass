import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Recent Google Forms integration activity + configuration status. */
export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: logs, error } = await supabase
      .from("integration_logs")
      .select("id, created_at, student_number, status, message, source, form_submission_id")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const rows = logs ?? [];
    const lastSubmission = rows.find((r: { status: string }) => r.status === "RECEIVED")?.created_at ?? null;
    const lastIssued = rows.find((r: { status: string }) => r.status === "TICKET_ISSUED") ?? null;

    return {
      configured: Boolean(process.env["GOOGLE_FORM_WEBHOOK_SECRET"]),
      mailProviderConfigured: Boolean(process.env["RESEND_API_KEY"]),
      endpoint: "/api/public/integrations/google-form",
      lastSubmissionAt: lastSubmission as string | null,
      lastIssuedMessage: (lastIssued?.message as string | undefined) ?? null,
      lastIssuedAt: (lastIssued?.created_at as string | undefined) ?? null,
      logs: rows,
    };
  });

/** Admin: (re)generate the ticket for an attendee whose ticket failed or is missing. */
export const retryTicketGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attendeeId: string }) => z.object({ attendeeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { data: attendee, error } = await supabase
      .from("attendees")
      .select("id, event_id")
      .eq("id", data.attendeeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!attendee) throw new Error("Attendee not found");

    const { data: event } = await supabase
      .from("events")
      .select("ticket_prefix")
      .eq("id", attendee.event_id)
      .maybeSingle();

    const { issueTicketForAttendee } = await import("@/lib/integration.server");
    const ticket = await issueTicketForAttendee(attendee.event_id, attendee.id, event?.ticket_prefix ?? "RCF");
    return { ok: true as const, ticketNumber: ticket.ticket_number as string };
  });

/** Admin: resend (or send) the ticket email for one attendee. */
export const resendTicketEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attendeeId: string; origin: string }) =>
    z.object({ attendeeId: z.string().uuid(), origin: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { data: attendee, error } = await supabase
      .from("attendees")
      .select("id, first_name, surname, email, event_id, tickets ( id, ticket_number, qr_token )")
      .eq("id", data.attendeeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!attendee) throw new Error("Attendee not found");

    const ticketRel = (attendee as { tickets: unknown }).tickets;
    const ticket = (Array.isArray(ticketRel) ? ticketRel[0] : ticketRel) as
      | { id: string; ticket_number: string; qr_token: string }
      | undefined;
    if (!ticket) throw new Error("No ticket issued yet — retry ticket generation first");

    const { data: event } = await supabase
      .from("events")
      .select("name, email_from, email_subject, email_body")
      .eq("id", attendee.event_id)
      .maybeSingle();

    const { sendTicketEmail } = await import("@/lib/integration.server");
    const status = await sendTicketEmail({
      to: attendee.email,
      from: event?.email_from,
      subject: event?.email_subject ?? "Your Met Gala Ticket",
      body: event?.email_body ?? "Your ticket is attached.",
      ticketNumber: ticket.ticket_number,
      qrToken: ticket.qr_token,
      eventName: event?.name ?? "Roscommon House Met Gala",
      guestName: `${attendee.first_name} ${attendee.surname}`,
      origin: data.origin,
    });

    if (status === "sent") {
      await supabase
        .from("tickets")
        .update({ email_sent_at: new Date().toISOString() } as never)
        .eq("id", ticket.id);
    }
    return { ok: status === "sent", status };
  });
