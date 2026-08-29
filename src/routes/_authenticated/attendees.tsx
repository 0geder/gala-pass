import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Mail, RotateCw, Ticket as TicketIcon, Upload } from "lucide-react";
import { PageHeader } from "@/components/gala/AppShell";
import { GalaTicket } from "@/components/gala/GalaTicket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatTime, useMe, useOverview, type RosterRow } from "@/hooks/useGala";
import { importAttendees, issueMissingTickets } from "@/lib/gala.functions";
import { resendTicketEmail, retryTicketGeneration } from "@/lib/integration.functions";

export const Route = createFileRoute("/_authenticated/attendees")({
  head: () => ({
    meta: [
      { title: "Attendees | Roscommon House Met Gala" },
      {
        name: "description",
        content:
          "Full guest register for Met Gala: Burgundy and Black — student numbers, dietary requirements, tickets and attendance state.",
      },
      { property: "og:title", content: "Attendees | Roscommon House Met Gala" },
      {
        property: "og:description",
        content: "Guest register and CSV import for the Roscommon Formal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendeesPage,
});

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const split = (line: string) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = split(lines[0]!).map((h) => h.toLowerCase());
  const looksLikeHeader = header.some(
    (h) => h.includes("name") || h.includes("student") || h.includes("smid"),
  );
  const body = looksLikeHeader ? lines.slice(1) : lines;

  const idx = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  const iFirst = looksLikeHeader ? idx("first", "name") : 0;
  const iSur = looksLikeHeader ? idx("surname", "last") : 1;
  const iSmid = looksLikeHeader ? idx("student", "smid") : 2;
  const iDiet = looksLikeHeader ? idx("diet") : 3;

  return body
    .map((line) => {
      const cells = split(line);
      return {
        firstName: cells[iFirst >= 0 ? iFirst : 0] ?? "",
        surname: cells[iSur >= 0 ? iSur : 1] ?? "",
        studentNumber: cells[iSmid >= 0 ? iSmid : 2] ?? "",
        dietary: cells[iDiet >= 0 ? iDiet : 3] ?? "",
      };
    })
    .filter((r) => r.firstName && r.surname && r.studentNumber.length > 1);
}

function AttendeesPage() {
  const { data, isPending } = useOverview();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const runImport = useServerFn(importAttendees);
  const runIssue = useServerFn(issueMissingTickets);
  const runRetry = useServerFn(retryTicketGeneration);
  const runResend = useServerFn(resendTicketEmail);

  const [search, setSearch] = useState("");
  const [csv, setCsv] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<RosterRow | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const roster = data?.roster ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((r) =>
      [r.firstName, r.surname, r.studentNumber, r.email, r.ticketNumber ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [roster, search]);

  async function doImport() {
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      toast.error("No valid rows found", {
        description: "Expected: First name, Surname, Student number, Dietary",
      });
      return;
    }
    setBusy(true);
    try {
      const result = await runImport({ data: { rows } });
      toast.success(`${result.imported} attendee(s) imported`, {
        description: result.skipped.length
          ? `${result.skipped.length} duplicate(s) skipped`
          : "Tickets issued",
      });
      setCsv("");
      setImportOpen(false);
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function issueTickets() {
    setBusy(true);
    try {
      const result = await runIssue({});
      toast.success(
        result.issued > 0
          ? `${result.issued} ticket(s) issued`
          : "Every attendee already has a ticket",
      );
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue tickets");
    } finally {
      setBusy(false);
    }
  }

  async function retryTicket(attendeeId: string) {
    setRowBusyId(attendeeId);
    try {
      const result = await runRetry({ data: { attendeeId } });
      toast.success(`Ticket ${result.ticketNumber} issued`);
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue ticket");
    } finally {
      setRowBusyId(null);
    }
  }

  async function resendEmail(attendeeId: string) {
    setRowBusyId(attendeeId);
    try {
      const result = await runResend({ data: { attendeeId, origin: window.location.origin } });
      if (result.status === "sent") {
        toast.success("Ticket email sent");
      } else if (result.status === "pending") {
        toast.error("No mail provider configured — email queued");
      } else {
        toast.error("Email delivery failed");
      }
      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send email");
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="GUEST REGISTER"
        title="Attendees"
        description="Every paid Google Form submission becomes one attendee, one ticket and one unique QR token."
        action={
          me?.isAdmin ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={issueTickets} disabled={busy}>
                <TicketIcon className="mr-2 h-4 w-4" /> Issue missing tickets
              </Button>
              <Button onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
            </div>
          ) : null
        }
      />

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, student number or ticket…"
        className="mb-5 max-w-sm"
      />

      <div className="shadow-elegant overflow-x-auto rounded-sm border border-border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[9px] tracking-editorial text-muted-foreground">
              <th className="px-4 py-3">ATTENDEE</th>
              <th className="px-4 py-3">SMID</th>
              <th className="px-4 py-3">EMAIL</th>
              <th className="px-4 py-3">DIETARY</th>
              <th className="px-4 py-3">TICKET</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isPending && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No attendees match this search.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-display text-lg leading-tight">
                    {r.firstName} {r.surname}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.studentNumber}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.email}</td>
                <td className="px-4 py-3 text-xs">{r.dietary || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.ticketNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge row={r} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {r.qrToken && (
                      <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
                        View ticket
                      </Button>
                    )}
                    {me?.isAdmin && !r.ticketNumber && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rowBusyId === r.id}
                        onClick={() => retryTicket(r.id)}
                      >
                        {rowBusyId === r.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCw className="mr-1 h-3 w-3" />
                        )}
                        Retry ticket
                      </Button>
                    )}
                    {me?.isAdmin && r.ticketNumber && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rowBusyId === r.id}
                        onClick={() => resendEmail(r.id)}
                      >
                        {rowBusyId === r.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Mail className="mr-1 h-3 w-3" />
                        )}
                        Resend email
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Import attendees</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste rows from the Google Sheet as CSV. Columns:{" "}
            <em>First name, Surname, Student number, Dietary</em>. Emails are generated from the
            student number, duplicates are skipped and a unique ticket + QR token is issued
            automatically.
          </p>
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={9}
            placeholder={
              "First name,Surname,Student number,Dietary\nSamson,Okuthe,OKTSAM001,Halaal"
            }
            className="font-mono text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doImport} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Import & issue tickets
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Digital ticket</DialogTitle>
          </DialogHeader>
          {preview?.qrToken && preview.ticketNumber && (
            <GalaTicket
              event={data?.event ?? null}
              ticket={{
                firstName: preview.firstName,
                surname: preview.surname,
                studentNumber: preview.studentNumber,
                dietary: preview.dietary,
                ticketNumber: preview.ticketNumber,
                qrToken: preview.qrToken,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ row }: { row: RosterRow }) {
  if (row.returned)
    return (
      <Badge variant="outline" className="border-success text-success">
        RETURNED · {formatTime(row.returnTime)}
      </Badge>
    );
  if (row.boarded)
    return (
      <Badge variant="outline" className="border-primary text-primary">
        BOARDED · {formatTime(row.boardingTime)}
      </Badge>
    );
  if (row.ticketNumber) return <Badge variant="secondary">BOARDING PENDING</Badge>;
  return <Badge variant="outline">REGISTERED</Badge>;
}
