/**
 * Google Form → Apps Script → backend intake.
 * Server-only: uses the service-role client. Never import from client code.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type FormSubmission = {
  firstName: string;
  surname: string;
  studentNumber: string;
  dietaryRequirement?: string | null;
  email?: string | null;
  formSubmissionId?: string | null;
  source?: string | null;
};

export type IntakeResult = {
  status: "TICKET_ISSUED" | "DUPLICATE" | "FAILED";
  message: string;
  attendeeId?: string;
  ticketNumber?: string | null;
  emailStatus?: "sent" | "pending" | "failed";
};

async function log(entry: {
  eventId?: string | null;
  submission: FormSubmission;
  status: string;
  message: string;
  attendeeId?: string | null;
  ticketId?: string | null;
}) {
  await supabaseAdmin.from("integration_logs").insert({
    event_id: entry.eventId ?? null,
    source: entry.submission.source ?? "google_forms",
    form_submission_id: entry.submission.formSubmissionId ?? null,
    student_number: entry.submission.studentNumber?.toUpperCase() ?? null,
    status: entry.status,
    message: entry.message,
    payload: entry.submission as unknown as Record<string, unknown>,
    attendee_id: entry.attendeeId ?? null,
    ticket_id: entry.ticketId ?? null,
  } as never);
}

function randomToken(prefix: string) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Issue a ticket (and attendance shell) for an attendee. Idempotent. */
export async function issueTicketForAttendee(eventId: string, attendeeId: string, prefix: string) {
  const { data: existing } = await supabaseAdmin
    .from("tickets")
    .select("id, ticket_number, qr_token, status")
    .eq("attendee_id", attendeeId)
    .maybeSingle();
  if (existing) return existing;

  const { data: number, error: seqErr } = await supabaseAdmin.rpc("next_ticket_number", { _prefix: prefix });
  if (seqErr) throw new Error(seqErr.message);

  const { data: ticket, error } = await supabaseAdmin
    .from("tickets")
    .insert({
      attendee_id: attendeeId,
      event_id: eventId,
      ticket_number: number as string,
      qr_token: randomToken(prefix),
      status: "issued",
    } as never)
    .select("id, ticket_number, qr_token, status")
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("attendance").insert({ ticket_id: ticket.id } as never);
  return ticket;
}

/**
 * Deliver the ticket email. Real delivery only happens when a mail provider
 * secret (RESEND_API_KEY) is configured — otherwise the ticket stays queued
 * and the admin can send it from the Ticket Emails screen.
 */
export async function sendTicketEmail(params: {
  to: string;
  from?: string | null;
  subject: string;
  body: string;
  ticketNumber: string;
  qrToken: string;
  eventName: string;
  guestName: string;
  origin: string;
}): Promise<"sent" | "pending" | "failed"> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return "pending";

  const ticketUrl = `${params.origin}/t/${params.qrToken}`;
  const html = `
    <div style="font-family:Georgia,serif;background:#3B080F;color:#F4EFE5;padding:32px">
      <p style="letter-spacing:.3em;font-size:11px;color:#B89B5E;margin:0 0 8px">${params.eventName.toUpperCase()}</p>
      <h1 style="font-size:26px;margin:0 0 16px">${params.guestName}</h1>
      <p style="line-height:1.6">${params.body}</p>
      <p style="font-size:13px;color:#B89B5E">Ticket ${params.ticketNumber}</p>
      <p><a href="${ticketUrl}" style="color:#B89B5E">View your ticket &amp; QR code</a></p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: params.from || "tickets@resend.dev",
        to: [params.to],
        subject: params.subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[gala] email send failed", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[gala] email send error", err);
    return "failed";
  }
}

/** Full intake pipeline for one submission. Idempotent and never loses the attendee. */
export async function processFormSubmission(submission: FormSubmission, origin: string): Promise<IntakeResult> {
  const studentNumber = submission.studentNumber.trim().toUpperCase();
  const normalised: FormSubmission = { ...submission, studentNumber };

  const { data: event, error: evErr } = await supabaseAdmin
    .from("events")
    .select("id, name, email_domain, ticket_prefix, email_from, email_subject, email_body")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (evErr || !event) {
    await log({ submission: normalised, status: "FAILED", message: "No event configured" });
    return { status: "FAILED", message: "No event configured" };
  }

  await log({ eventId: event.id, submission: normalised, status: "RECEIVED", message: "Submission received" });

  // Idempotency: same Google submission id, or same student for this event.
  const submissionId = submission.formSubmissionId?.trim() || null;
  let existing: { id: string } | null = null;
  if (submissionId) {
    const { data } = await supabaseAdmin
      .from("attendees")
      .select("id")
      .eq("event_id", event.id)
      .eq("form_submission_id", submissionId)
      .maybeSingle();
    existing = data ?? null;
  }
  if (!existing) {
    const { data } = await supabaseAdmin
      .from("attendees")
      .select("id")
      .eq("event_id", event.id)
      .eq("student_number", studentNumber)
      .maybeSingle();
    existing = data ?? null;
  }

  if (existing) {
    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("ticket_number")
      .eq("attendee_id", existing.id)
      .maybeSingle();
    await log({
      eventId: event.id,
      submission: normalised,
      status: "DUPLICATE",
      message: "Attendee already registered — no new ticket issued",
      attendeeId: existing.id,
    });
    return {
      status: "DUPLICATE",
      message: "Attendee already registered",
      attendeeId: existing.id,
      ticketNumber: ticket?.ticket_number ?? null,
    };
  }

  const domain = event.email_domain?.startsWith("@") ? event.email_domain : `@${event.email_domain ?? "myuct.ac.za"}`;
  const email = submission.email?.trim() || `${studentNumber.toLowerCase()}${domain}`;

  const { data: attendee, error: insErr } = await supabaseAdmin
    .from("attendees")
    .insert({
      event_id: event.id,
      first_name: submission.firstName.trim(),
      surname: submission.surname.trim(),
      student_number: studentNumber,
      email,
      dietary_requirement: submission.dietaryRequirement?.trim() || null,
      form_submission_id: submissionId,
    } as never)
    .select("id, first_name, surname, email")
    .single();
  if (insErr || !attendee) {
    await log({
      eventId: event.id,
      submission: normalised,
      status: "FAILED",
      message: insErr?.message ?? "Could not create attendee",
    });
    return { status: "FAILED", message: insErr?.message ?? "Could not create attendee" };
  }

  await log({
    eventId: event.id,
    submission: normalised,
    status: "PROCESSED",
    message: "Attendee created",
    attendeeId: attendee.id,
  });

  // Attendee is safe in the database from here on — ticket failures never lose them.
  try {
    const ticket = await issueTicketForAttendee(event.id, attendee.id, event.ticket_prefix ?? "RCF");
    const emailStatus = await sendTicketEmail({
      to: attendee.email,
      from: event.email_from,
      subject: event.email_subject,
      body: event.email_body,
      ticketNumber: ticket.ticket_number,
      qrToken: ticket.qr_token,
      eventName: event.name,
      guestName: `${attendee.first_name} ${attendee.surname}`,
      origin,
    });
    if (emailStatus === "sent") {
      await supabaseAdmin
        .from("tickets")
        .update({ email_sent_at: new Date().toISOString() } as never)
        .eq("id", ticket.id);
    }
    await log({
      eventId: event.id,
      submission: normalised,
      status: "TICKET_ISSUED",
      message:
        emailStatus === "sent"
          ? `Ticket ${ticket.ticket_number} issued and emailed`
          : `Ticket ${ticket.ticket_number} issued — email ${emailStatus === "failed" ? "failed" : "queued (no mail provider configured)"}`,
      attendeeId: attendee.id,
      ticketId: ticket.id,
    });
    return {
      status: "TICKET_ISSUED",
      message: "Ticket issued",
      attendeeId: attendee.id,
      ticketNumber: ticket.ticket_number,
      emailStatus,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ticket generation failed";
    await log({
      eventId: event.id,
      submission: normalised,
      status: "FAILED",
      message: `Attendee saved, ticket generation failed: ${message}`,
      attendeeId: attendee.id,
    });
    return { status: "FAILED", message, attendeeId: attendee.id };
  }
}
