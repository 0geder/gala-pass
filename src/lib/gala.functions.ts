import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EVENT_SELECT = "*";

const ticketQuery = `
  id, ticket_number, qr_token, status, issued_at, email_sent_at, ticket_url,
  attendee:attendees ( id, first_name, surname, student_number, email, dietary_requirement ),
  attendance:attendance ( id, boarded, boarding_time, boarding_staff, bus_number, returned, return_time, return_staff )
`;

function normaliseToken(raw: string) {
  const value = raw.trim();
  // Support tokens embedded in a URL, e.g. https://app/t/RCF-abc123
  const match = value.match(/(RCF-[A-Za-z0-9]{8,})/i);
  return (match?.[1] ?? value).trim();
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

async function actorLabel(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle();
  return data?.full_name ?? data?.email ?? userId;
}

/** Current signed-in staff member: profile + role. */
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    return {
      id: userId,
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      roles: roleList,
      isAdmin: roleList.includes("admin"),
    };
  });

/** Active event + full roster with ticket and attendance state. */
export const getEventOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (eventError) throw new Error(eventError.message);
    if (!event) return { event: null, roster: [] };

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select(
        `id, first_name, surname, student_number, email, dietary_requirement, created_at,
         ticket:tickets ( ${ticketQuery} )`,
      )
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const roster = (attendees ?? []).map((a: any) => {
      const ticket = Array.isArray(a.ticket) ? a.ticket[0] : a.ticket;
      const attendance = ticket
        ? Array.isArray(ticket.attendance)
          ? ticket.attendance[0]
          : ticket.attendance
        : null;
      return {
        id: a.id as string,
        firstName: a.first_name as string,
        surname: a.surname as string,
        studentNumber: a.student_number as string,
        email: a.email as string,
        dietary: (a.dietary_requirement as string | null) ?? null,
        createdAt: a.created_at as string,
        ticketNumber: (ticket?.ticket_number as string | undefined) ?? null,
        qrToken: (ticket?.qr_token as string | undefined) ?? null,
        ticketStatus: (ticket?.status as string | undefined) ?? null,
        emailSentAt: (ticket?.email_sent_at as string | undefined) ?? null,
        boarded: Boolean(attendance?.boarded),
        boardingTime: (attendance?.boarding_time as string | undefined) ?? null,
        returned: Boolean(attendance?.returned),
        returnTime: (attendance?.return_time as string | undefined) ?? null,
      };
    });

    return { event, roster };
  });

/** Verify a scanned QR token against the database. Never trusts scanner input. */
export const lookupTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string }) => z.object({ token: z.string().min(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const token = normaliseToken(data.token);
    const { supabase } = context;
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(ticketQuery)
      .eq("qr_token", token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) return { valid: false as const, reason: "not_found" as const };

    const attendee: any = Array.isArray(ticket.attendee) ? ticket.attendee[0] : ticket.attendee;
    const attendance: any = Array.isArray(ticket.attendance) ? ticket.attendance[0] : ticket.attendance;

    if (ticket.status === "revoked" || ticket.status === "cancelled") {
      return { valid: false as const, reason: ticket.status as "revoked" | "cancelled" };
    }

    return {
      valid: true as const,
      ticket: {
        id: ticket.id as string,
        ticketNumber: ticket.ticket_number as string,
        qrToken: ticket.qr_token as string,
        status: ticket.status as string,
        firstName: attendee?.first_name as string,
        surname: attendee?.surname as string,
        studentNumber: attendee?.student_number as string,
        email: attendee?.email as string,
        dietary: (attendee?.dietary_requirement as string | null) ?? null,
        boarded: Boolean(attendance?.boarded),
        boardingTime: (attendance?.boarding_time as string | null) ?? null,
        busNumber: (attendance?.bus_number as string | null) ?? null,
        returned: Boolean(attendance?.returned),
        returnTime: (attendance?.return_time as string | null) ?? null,
      },
    };
  });

/** Record boarding. Idempotent: an already-boarded ticket is never double-recorded. */
export const recordBoarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string; busNumber?: string }) =>
    z.object({ token: z.string().min(4), busNumber: z.string().max(40).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = normaliseToken(data.token);
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("id, status, attendance:attendance ( id, boarded, boarding_time )")
      .eq("qr_token", token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) return { ok: false as const, reason: "not_found" as const };
    if (ticket.status !== "issued") return { ok: false as const, reason: "invalid_status" as const };

    const attendance: any = Array.isArray(ticket.attendance) ? ticket.attendance[0] : ticket.attendance;
    if (attendance?.boarded) {
      return { ok: false as const, reason: "already_boarded" as const, boardingTime: attendance.boarding_time };
    }

    const now = new Date().toISOString();
    const staff = await actorLabel(supabase, userId);
    if (attendance?.id) {
      const { error: upErr } = await supabase
        .from("attendance")
        .update({ boarded: true, boarding_time: now, boarding_staff: staff, bus_number: data.busNumber ?? null })
        .eq("id", attendance.id)
        .eq("boarded", false);
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: insErr } = await supabase.from("attendance").insert({
        ticket_id: ticket.id,
        boarded: true,
        boarding_time: now,
        boarding_staff: staff,
        bus_number: data.busNumber ?? null,
      });
      if (insErr) throw new Error(insErr.message);
    }
    return { ok: true as const, boardingTime: now };
  });

/** Record the return leg using the same ticket. */
export const recordReturn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { token: string }) => z.object({ token: z.string().min(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = normaliseToken(data.token);
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("id, status, attendance:attendance ( id, boarded, returned, return_time )")
      .eq("qr_token", token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) return { ok: false as const, reason: "not_found" as const };

    const attendance: any = Array.isArray(ticket.attendance) ? ticket.attendance[0] : ticket.attendance;
    if (attendance?.returned) {
      return { ok: false as const, reason: "already_returned" as const, returnTime: attendance.return_time };
    }

    const now = new Date().toISOString();
    const staff = await actorLabel(supabase, userId);
    if (attendance?.id) {
      const { error: upErr } = await supabase
        .from("attendance")
        .update({ returned: true, return_time: now, return_staff: staff })
        .eq("id", attendance.id)
        .eq("returned", false);
      if (upErr) throw new Error(upErr.message);
    } else {
      const { error: insErr } = await supabase
        .from("attendance")
        .insert({ ticket_id: ticket.id, returned: true, return_time: now, return_staff: staff });
      if (insErr) throw new Error(insErr.message);
    }
    return { ok: true as const, returnTime: now };
  });

const importRow = z.object({
  firstName: z.string().min(1),
  surname: z.string().min(1),
  studentNumber: z.string().min(2),
  dietary: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  formSubmissionId: z.string().optional().nullable(),
});

/**
 * Import attendees (CSV paste or Google Sheet sync payload).
 * Deduplicates on student number, derives the student email, then issues a
 * unique ticket number + cryptographically random QR token per attendee.
 */
export const importAttendees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { rows: unknown[] }) => z.object({ rows: z.array(importRow).min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("id, email_domain, ticket_prefix")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (evErr) throw new Error(evErr.message);
    if (!event) throw new Error("No event configured");

    const { data: existing } = await supabase
      .from("attendees")
      .select("student_number")
      .eq("event_id", event.id);
    const seen = new Set((existing ?? []).map((r: { student_number: string }) => r.student_number.toUpperCase()));

    const domain = event.email_domain?.startsWith("@") ? event.email_domain : `@${event.email_domain ?? "myuct.ac.za"}`;
    let imported = 0;
    const skipped: string[] = [];

    for (const row of data.rows) {
      const smid = row.studentNumber.trim().toUpperCase();
      if (seen.has(smid)) {
        skipped.push(smid);
        continue;
      }
      seen.add(smid);
      const email = row.email?.trim() || `${smid.toLowerCase()}${domain}`;
      const { data: inserted, error: insErr } = await supabase
        .from("attendees")
        .insert({
          event_id: event.id,
          first_name: row.firstName.trim(),
          surname: row.surname.trim(),
          student_number: smid,
          email,
          dietary_requirement: row.dietary?.trim() || null,
          form_submission_id: row.formSubmissionId ?? null,
        })
        .select("id")
        .single();
      if (insErr) {
        skipped.push(smid);
        continue;
      }
      imported += 1;
      await issueTicketFor(supabase, event.id, inserted.id, event.ticket_prefix ?? "RCF");
    }

    return { imported, skipped };
  });

async function issueTicketFor(supabase: any, eventId: string, attendeeId: string, prefix: string) {
  const { data: existing } = await supabase
    .from("tickets")
    .select("id")
    .eq("attendee_id", attendeeId)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: seq, error: seqErr } = await supabase.rpc("next_ticket_number", { _prefix: prefix });
  if (seqErr) throw new Error(seqErr.message);

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const token = `${prefix}-${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({ attendee_id: attendeeId, event_id: eventId, ticket_number: seq, qr_token: token })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("attendance").insert({ ticket_id: ticket.id });
  return ticket.id as string;
}

/** Issue tickets for every attendee that does not yet have one. */
export const issueMissingTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: event } = await supabase
      .from("events")
      .select("id, ticket_prefix")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!event) throw new Error("No event configured");

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("id, tickets ( id )")
      .eq("event_id", event.id);
    if (error) throw new Error(error.message);

    let issued = 0;
    for (const a of attendees ?? []) {
      const tickets = (a as any).tickets;
      const has = Array.isArray(tickets) ? tickets.length > 0 : Boolean(tickets);
      if (has) continue;
      await issueTicketFor(supabase, event.id, (a as any).id, event.ticket_prefix ?? "RCF");
      issued += 1;
    }
    return { issued };
  });

/** Update event / ticketing / email settings. */
export const updateEventSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1),
        subtitle: z.string().nullable().optional(),
        event_date: z.string().nullable().optional(),
        venue: z.string().nullable().optional(),
        ticket_price: z.coerce.number().nullable().optional(),
        theme: z.string().nullable().optional(),
        email_domain: z.string().min(2),
        ticket_prefix: z.string().min(1).max(8),
        email_from: z.string().nullable().optional(),
        email_subject: z.string().min(1),
        email_body: z.string().min(1),
        google_sheet_url: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { id, ...patch } = data;
    const { error } = await supabase.from("events").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Queue/record ticket email delivery for one or all attendees. */
export const markTicketsEmailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ticketIds: string[] }) =>
    z.object({ ticketIds: z.array(z.string().uuid()).min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase
      .from("tickets")
      .update({ email_sent_at: new Date().toISOString() })
      .in("id", data.ticketIds);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ticketIds.length };
  });
