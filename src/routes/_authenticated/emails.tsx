import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { PageHeader } from "@/components/gala/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMe, useOverview } from "@/hooks/useGala";
import { getIntegrationStatus, resendTicketEmail } from "@/lib/integration.functions";

export const Route = createFileRoute("/_authenticated/emails")({
  head: () => ({
    meta: [
      { title: "Ticket Emails | Roscommon House Met Gala" },
      {
        name: "description",
        content: "Prepare and track delivery of personalised Met Gala tickets to each attendee's student email.",
      },
      { property: "og:title", content: "Ticket Emails | Roscommon House Met Gala" },
      { property: "og:description", content: "Ticket email management for the Roscommon Formal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailsPage,
});

function EmailsPage() {
  const { data } = useOverview();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const runResend = useServerFn(resendTicketEmail);
  const fetchStatus = useServerFn(getIntegrationStatus);
  const { data: status } = useQuery({ queryKey: ["gala", "integration-status"], queryFn: () => fetchStatus() });
  const [busy, setBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const event = data?.event;
  const roster = (data?.roster ?? []).filter((r) => r.ticketNumber);
  const pending = roster.filter((r) => !r.emailSentAt);
  const mailProviderConfigured = status?.mailProviderConfigured ?? false;

  async function sendOne(attendeeId: string) {
    setRowBusyId(attendeeId);
    try {
      const result = await runResend({ data: { attendeeId, origin: window.location.origin } });
      if (result.status === "sent") toast.success("Ticket email sent");
      else if (result.status === "pending") toast.error("No mail provider configured — email queued");
      else toast.error("Email delivery failed");
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send email");
    } finally {
      setRowBusyId(null);
    }
  }

  async function sendAll() {
    setBusy(true);
    let sent = 0;
    let failed = 0;
    try {
      for (const r of pending) {
        try {
          const result = await runResend({ data: { attendeeId: r.id, origin: window.location.origin } });
          if (result.status === "sent") sent += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      if (sent > 0) toast.success(`${sent} ticket email(s) sent`);
      if (failed > 0) toast.error(`${failed} email(s) could not be sent`);
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="DELIVERY"
        title="Ticket Emails"
        description="Each attendee receives their personalised ticket at the address derived from their student number."
        action={
          me?.isAdmin && pending.length > 0 ? (
            <Button onClick={sendAll} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send {pending.length} pending
            </Button>
          ) : null
        }
      />

      <section className="shadow-elegant mb-8 rounded-sm border border-border bg-card p-6">
        <h2 className="text-[10px] tracking-editorial text-primary">EMAIL TEMPLATE</h2>
        <div className="rule-gold my-4" />
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[10px] tracking-editorial text-muted-foreground">FROM</dt>
            <dd>{event?.email_from || "Not configured"}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-editorial text-muted-foreground">SUBJECT</dt>
            <dd>{event?.email_subject}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-editorial text-muted-foreground">BODY</dt>
            <dd className="whitespace-pre-wrap text-muted-foreground">{event?.email_body}</dd>
          </div>
        </dl>
        {!mailProviderConfigured && (
          <p className="mt-5 rounded-sm border border-accent/40 bg-accent/10 p-3 text-xs text-muted-foreground">
            No mail provider is configured yet, so sending will queue rather than deliver. Add a{" "}
            <code>RESEND_API_KEY</code> server secret to enable delivery.
          </p>
        )}
      </section>

      <div className="shadow-elegant overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[9px] tracking-editorial text-muted-foreground">
              <th className="px-4 py-3">ATTENDEE</th>
              <th className="px-4 py-3">TICKET</th>
              <th className="px-4 py-3">EMAIL</th>
              <th className="px-4 py-3">DELIVERY</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-display text-lg leading-tight">
                    {r.firstName} {r.surname}
                  </p>
                  <p className="text-[10px] tracking-[0.14em] text-muted-foreground">{r.studentNumber}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.ticketNumber}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.email}</td>
                <td className="px-4 py-3">
                  {r.emailSentAt ? (
                    <Badge variant="outline" className="border-success text-success">
                      <MailCheck className="mr-1 h-3 w-3" /> SENT
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Mail className="mr-1 h-3 w-3" /> PENDING
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {me?.isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rowBusyId === r.id}
                      onClick={() => sendOne(r.id)}
                    >
                      {rowBusyId === r.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Mail className="mr-1 h-3 w-3" />
                      )}
                      {r.emailSentAt ? "Resend" : "Send"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
