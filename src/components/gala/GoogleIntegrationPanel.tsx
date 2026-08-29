import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getIntegrationStatus } from "@/lib/integration.functions";

const STATUS_TONE: Record<string, string> = {
  TICKET_ISSUED: "border-primary/40 text-primary",
  PROCESSED: "border-border text-muted-foreground",
  RECEIVED: "border-border text-muted-foreground",
  DUPLICATE: "border-accent/50 text-accent",
  FAILED: "border-destructive/50 text-destructive",
};

function formatStamp(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GoogleIntegrationPanel() {
  const fetchStatus = useServerFn(getIntegrationStatus);
  const [showLog, setShowLog] = useState(true);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["gala", "integration"],
    queryFn: () => fetchStatus(),
    refetchInterval: 30_000,
  });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const endpoint = `${origin}${data?.endpoint ?? "/api/public/integrations/google-form"}`;
  const connected = Boolean(data?.configured);
  const logs = data?.logs ?? [];

  return (
    <section className="shadow-elegant rounded-sm border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[10px] tracking-editorial text-primary">GOOGLE FORMS INTEGRATION</h2>
          <div className="rule-gold my-4" />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Integration status</p>
          <p className="text-sm">
            {connected ? "● Connected — webhook secret configured" : "○ Not configured — webhook secret missing"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Ticket email delivery</p>
          <p className="text-sm">
            {data?.mailProviderConfigured
              ? "● Ready — tickets email automatically"
              : "○ Requires configuration — tickets are queued for manual sending"}
          </p>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs text-muted-foreground">Webhook endpoint (paste into Apps Script API_URL)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-sm border border-border bg-background px-3 py-2 text-xs">
              {endpoint}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(endpoint);
                toast.success("Endpoint copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Apps Script must send the header <code>X-Webhook-Secret</code>. The secret is stored server-side and is
            never shown here.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last submission received</p>
          <p className="text-sm">{formatStamp(data?.lastSubmissionAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last successful ticket</p>
          <p className="text-sm">
            {data?.lastIssuedMessage ? `${data.lastIssuedMessage} · ${formatStamp(data.lastIssuedAt)}` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          className="text-[10px] tracking-editorial text-primary"
        >
          {showLog ? "HIDE INTEGRATION LOG" : "SHOW INTEGRATION LOG"}
        </button>
        {showLog && (
          <div className="mt-3 max-h-80 overflow-auto rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-normal">Time</th>
                  <th className="px-3 py-2 font-normal">Student</th>
                  <th className="px-3 py-2 font-normal">Status</th>
                  <th className="px-3 py-2 font-normal">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      No submissions received yet.
                    </td>
                  </tr>
                )}
                {logs.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(row.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2">{row.student_number ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={STATUS_TONE[row.status] ?? "border-border"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
