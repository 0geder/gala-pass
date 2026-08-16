import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/gala/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMe, useOverview } from "@/hooks/useGala";
import { updateEventSettings } from "@/lib/gala.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Event Settings | Roscommon House Met Gala" },
      {
        name: "description",
        content: "Configure the Met Gala event details, student email domain, ticket prefix and ticket email copy.",
      },
      { property: "og:title", content: "Event Settings | Roscommon House Met Gala" },
      { property: "og:description", content: "Event, ticketing and email configuration for the Roscommon Formal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

type Form = {
  name: string;
  subtitle: string;
  event_date: string;
  venue: string;
  ticket_price: string;
  theme: string;
  email_domain: string;
  ticket_prefix: string;
  email_from: string;
  email_subject: string;
  email_body: string;
  google_sheet_url: string;
};

function SettingsPage() {
  const { data } = useOverview();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const save = useServerFn(updateEventSettings);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const event = data?.event;
  useEffect(() => {
    if (!event) return;
    setForm({
      name: event.name ?? "",
      subtitle: event.subtitle ?? "",
      event_date: event.event_date ?? "",
      venue: event.venue ?? "",
      ticket_price: String(event.ticket_price ?? ""),
      theme: event.theme ?? "",
      email_domain: event.email_domain ?? "@myuct.ac.za",
      ticket_prefix: event.ticket_prefix ?? "RCF",
      email_from: event.email_from ?? "",
      email_subject: event.email_subject ?? "",
      email_body: event.email_body ?? "",
      google_sheet_url: event.google_sheet_url ?? "",
    });
  }, [event]);

  if (!form || !event) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !event) return;
    setBusy(true);
    try {
      await save({
        data: {
          id: event.id,
          name: form.name,
          subtitle: form.subtitle,
          event_date: form.event_date || null,
          venue: form.venue,
          ticket_price: form.ticket_price ? Number(form.ticket_price) : 0,
          theme: form.theme,
          email_domain: form.email_domain,
          ticket_prefix: form.ticket_prefix.toUpperCase(),
          email_from: form.email_from,
          email_subject: form.email_subject,
          email_body: form.email_body,
          google_sheet_url: form.google_sheet_url,
        },
      });
      toast.success("Event settings saved");
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  const readOnly = !me?.isAdmin;

  return (
    <form onSubmit={submit} className="max-w-3xl">
      <PageHeader
        eyebrow="CONFIGURATION"
        title="Event Settings"
        description={readOnly ? "Only administrators can change these settings." : "Event identity, ticketing rules and email delivery."}
      />

      <fieldset disabled={readOnly || busy} className="space-y-8">
        <Section title="EVENT">
          <Field label="Event name" id="name">
            <Input id="name" value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Subtitle" id="subtitle">
            <Input id="subtitle" value={form.subtitle} onChange={set("subtitle")} />
          </Field>
          <Field label="Date" id="date">
            <Input id="date" type="date" value={form.event_date} onChange={set("event_date")} />
          </Field>
          <Field label="Venue" id="venue">
            <Input id="venue" value={form.venue} onChange={set("venue")} />
          </Field>
          <Field label="Ticket price (ZAR)" id="price">
            <Input id="price" inputMode="decimal" value={form.ticket_price} onChange={set("ticket_price")} />
          </Field>
          <Field label="Theme" id="theme">
            <Input id="theme" value={form.theme} onChange={set("theme")} />
          </Field>
        </Section>

        <Section title="TICKETING">
          <Field label="Student email domain" id="domain" hint="Emails are generated as studentnumber + domain.">
            <Input id="domain" value={form.email_domain} onChange={set("email_domain")} required />
          </Field>
          <Field label="Ticket prefix" id="prefix" hint="e.g. RCF → RCF-0001">
            <Input id="prefix" value={form.ticket_prefix} onChange={set("ticket_prefix")} required maxLength={8} />
          </Field>
          <Field label="Google Sheet URL" id="sheet" hint="Source of Google Form responses for synchronisation.">
            <Input id="sheet" value={form.google_sheet_url} onChange={set("google_sheet_url")} placeholder="https://docs.google.com/spreadsheets/…" />
          </Field>
        </Section>

        <Section title="TICKET EMAIL">
          <Field label="Sender address" id="from">
            <Input id="from" value={form.email_from} onChange={set("email_from")} placeholder="roscommonhouse@myuct.ac.za" />
          </Field>
          <Field label="Subject" id="subject">
            <Input id="subject" value={form.email_subject} onChange={set("email_subject")} required />
          </Field>
          <Field label="Body" id="body">
            <Textarea id="body" rows={5} value={form.email_body} onChange={set("email_body")} required />
          </Field>
          <p className="text-xs text-muted-foreground">
            Delivery credentials are never stored in the browser. Connect a mail provider secret server-side before
            enabling automatic sending.
          </p>
        </Section>

        {!readOnly && (
          <Button type="submit" disabled={busy} size="lg">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save settings
          </Button>
        )}
      </fieldset>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="shadow-elegant rounded-sm border border-border bg-card p-6">
      <h2 className="text-[10px] tracking-editorial text-primary">{title}</h2>
      <div className="rule-gold my-4" />
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 last:sm:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
