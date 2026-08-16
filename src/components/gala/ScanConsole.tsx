import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, BusFront, CheckCircle2, RotateCcw, Undo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrScanner } from "./QrScanner";
import { lookupTicket, recordBoarding, recordReturn } from "@/lib/gala.functions";
import { formatTime } from "@/hooks/useGala";

type Ticket = NonNullable<Extract<Awaited<ReturnType<typeof lookupTicket>>, { valid: true }>["ticket"]>;

type State =
  | { kind: "scanning" }
  | { kind: "loading" }
  | { kind: "invalid"; reason: string }
  | { kind: "found"; ticket: Ticket }
  | { kind: "blocked"; ticket: Ticket; message: string; detail?: string }
  | { kind: "confirmed"; ticket: Ticket; time: string; label: string };

export function ScanConsole({ mode }: { mode: "boarding" | "return" }) {
  const lookup = useServerFn(lookupTicket);
  const board = useServerFn(recordBoarding);
  const doReturn = useServerFn(recordReturn);
  const queryClient = useQueryClient();

  const [state, setState] = useState<State>({ kind: "scanning" });
  const [busNumber, setBusNumber] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => setState({ kind: "scanning" }), []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const scheduleReset = useCallback((ms: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState({ kind: "scanning" }), ms);
  }, []);

  const handleScan = useCallback(
    async (raw: string) => {
      setState({ kind: "loading" });
      try {
        const result = await lookup({ data: { token: raw } });
        if (!result.valid) {
          setState({ kind: "invalid", reason: result.reason });
          scheduleReset(3500);
          return;
        }
        const t = result.ticket;
        if (mode === "boarding" && t.boarded) {
          setState({
            kind: "blocked",
            ticket: t,
            message: "ALREADY BOARDED",
            detail: `Boarded ${formatTime(t.boardingTime)}`,
          });
          scheduleReset(4500);
          return;
        }
        if (mode === "return" && t.returned) {
          setState({
            kind: "blocked",
            ticket: t,
            message: "ALREADY RETURNED",
            detail: `Returned ${formatTime(t.returnTime)}`,
          });
          scheduleReset(4500);
          return;
        }
        setState({ kind: "found", ticket: t });
      } catch (e) {
        setState({ kind: "invalid", reason: e instanceof Error ? e.message : "lookup_failed" });
        scheduleReset(3500);
      }
    },
    [lookup, mode, scheduleReset],
  );

  async function confirm(ticket: Ticket) {
    setState({ kind: "loading" });
    try {
      const result =
        mode === "boarding"
          ? await board({ data: { token: ticket.qrToken, ...(busNumber ? { busNumber } : {}) } })
          : await doReturn({ data: { token: ticket.qrToken } });

      queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });

      if (!result.ok) {
        setState({
          kind: "blocked",
          ticket,
          message: mode === "boarding" ? "ALREADY BOARDED" : "ALREADY RETURNED",
        });
        scheduleReset(4000);
        return;
      }
      const time = "boardingTime" in result ? result.boardingTime : result.returnTime;
      setState({
        kind: "confirmed",
        ticket,
        time: formatTime(time),
        label: mode === "boarding" ? "BOARDING CONFIRMED" : "RETURN CONFIRMED",
      });
      scheduleReset(2600);
    } catch (e) {
      setState({ kind: "invalid", reason: e instanceof Error ? e.message : "action_failed" });
      scheduleReset(3500);
    }
  }

  const paused = state.kind !== "scanning";

  return (
    <div className="space-y-5">
      {mode === "boarding" && (
        <div className="flex items-center gap-3 rounded-sm border border-border bg-card p-3">
          <label htmlFor="bus" className="text-[10px] tracking-editorial text-muted-foreground">
            BUS
          </label>
          <Input
            id="bus"
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
            placeholder="Bus 1"
            className="h-9 max-w-[160px]"
          />
        </div>
      )}

      <QrScanner active paused={paused} onScan={handleScan} />

      {state.kind === "loading" && (
        <div className="rounded-sm border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Verifying ticket…
        </div>
      )}

      {state.kind === "invalid" && (
        <ResultPanel tone="danger" icon={<XCircle className="h-8 w-8" />} title="INVALID TICKET">
          <p className="text-sm opacity-90">
            {state.reason === "not_found"
              ? "This QR code is not recognised. Boarding is not permitted."
              : `Ticket rejected: ${state.reason}`}
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Scan again
          </Button>
        </ResultPanel>
      )}

      {state.kind === "blocked" && (
        <ResultPanel tone="warning" icon={<AlertTriangle className="h-8 w-8" />} title={state.message}>
          <AttendeeIdentity ticket={state.ticket} />
          {state.detail && <p className="mt-2 text-sm opacity-90">{state.detail}</p>}
          <p className="mt-1 text-xs opacity-70">No duplicate record was created.</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Scan next guest
          </Button>
        </ResultPanel>
      )}

      {state.kind === "found" && (
        <ResultPanel tone="valid" icon={<CheckCircle2 className="h-8 w-8" />} title="VALID TICKET">
          <AttendeeIdentity ticket={state.ticket} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="tracking-editorial opacity-60">TICKET</dt>
              <dd className="mt-1 font-medium">{state.ticket.ticketNumber}</dd>
            </div>
            <div>
              <dt className="tracking-editorial opacity-60">DIETARY</dt>
              <dd className="mt-1 font-medium">{state.ticket.dietary?.trim() || "None"}</dd>
            </div>
            <div>
              <dt className="tracking-editorial opacity-60">STATUS</dt>
              <dd className="mt-1 font-medium">
                {mode === "boarding"
                  ? state.ticket.boarded
                    ? "BOARDED"
                    : "NOT BOARDED"
                  : state.ticket.returned
                    ? "RETURNED"
                    : "NOT RETURNED"}
              </dd>
            </div>
            <div>
              <dt className="tracking-editorial opacity-60">
                {mode === "boarding" ? "EMAIL" : "BOARDED EARLIER"}
              </dt>
              <dd className="mt-1 truncate font-medium">
                {mode === "boarding" ? state.ticket.email : formatTime(state.ticket.boardingTime)}
              </dd>
            </div>
          </dl>
          <Button size="lg" className="mt-5 h-14 w-full text-base" onClick={() => confirm(state.ticket)}>
            {mode === "boarding" ? (
              <>
                <BusFront className="mr-2 h-5 w-5" /> BOARD BUS
              </>
            ) : (
              <>
                <Undo2 className="mr-2 h-5 w-5" /> CONFIRM RETURN
              </>
            )}
          </Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={reset}>
            Cancel
          </Button>
        </ResultPanel>
      )}

      {state.kind === "confirmed" && (
        <ResultPanel tone="success" icon={<CheckCircle2 className="h-8 w-8" />} title={`✓ ${state.label}`}>
          <AttendeeIdentity ticket={state.ticket} />
          <p className="mt-3 text-sm opacity-90">
            {mode === "boarding" ? "Boarded at" : "Returned at"} {state.time}
          </p>
          <p className="mt-1 text-xs opacity-70">Returning to scanner…</p>
        </ResultPanel>
      )}
    </div>
  );
}

function AttendeeIdentity({ ticket }: { ticket: Ticket }) {
  return (
    <div>
      <p className="font-display text-3xl leading-tight sm:text-4xl">
        {ticket.firstName.toUpperCase()} {ticket.surname.toUpperCase()}
      </p>
      <p className="mt-1 text-sm tracking-[0.16em] opacity-75">{ticket.studentNumber}</p>
    </div>
  );
}

function ResultPanel({
  tone,
  icon,
  title,
  children,
}: {
  tone: "valid" | "success" | "warning" | "danger";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const toneClass = {
    valid: "border-border bg-card text-card-foreground",
    success: "border-success bg-success text-success-foreground",
    warning: "border-warning bg-warning text-warning-foreground",
    danger: "border-destructive bg-destructive text-destructive-foreground",
  }[tone];

  return (
    <section className={`shadow-elegant rounded-sm border p-6 ${toneClass}`}>
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-sm tracking-editorial">{title}</h2>
      </div>
      <div className="rule-gold my-4 opacity-60" />
      {children}
    </section>
  );
}
