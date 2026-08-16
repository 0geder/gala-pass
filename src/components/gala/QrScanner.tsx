import { useEffect, useRef, useState } from "react";
import { CameraOff, Keyboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REGION_ID = "gala-qr-region";

/**
 * Mobile-first camera scanner. The camera library is browser-only, so it is
 * dynamically imported after mount.
 */
export function QrScanner({
  active,
  onScan,
  paused,
}: {
  active: boolean;
  paused: boolean;
  onScan: (token: string) => void;
}) {
  const scannerRef = useRef<any>(null);
  const lastRef = useRef<{ token: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setStatus("starting");

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(REGION_ID, { verbose: false });
        scannerRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
          (decoded: string) => {
            const now = Date.now();
            const last = lastRef.current;
            if (last && last.token === decoded && now - last.at < 2500) return;
            lastRef.current = { token: decoded, at: now };
            onScanRef.current(decoded);
          },
          () => {},
        );
        if (!cancelled) setStatus("running");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Camera unavailable");
        setShowManual(true);
      }
    })();

    return () => {
      cancelled = true;
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance) {
        instance
          .stop()
          .then(() => instance.clear())
          .catch(() => {});
      }
    };
  }, [active]);

  useEffect(() => {
    const instance = scannerRef.current;
    if (!instance || status !== "running") return;
    try {
      if (paused) instance.pause(true);
      else instance.resume();
    } catch {
      /* scanner not in a pausable state */
    }
  }, [paused, status]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-sm border border-gold/30 bg-noir">
        <div id={REGION_ID} className="min-h-[300px] w-full [&_video]:!w-full [&_video]:object-cover" />
        {status !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-ivory">
            {status === "error" ? (
              <>
                <CameraOff className="h-8 w-8 text-gold" />
                <p className="text-sm text-champagne">{error ?? "Camera unavailable"}</p>
                <p className="text-xs text-champagne/60">Use manual entry below.</p>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <p className="text-xs tracking-editorial text-champagne">STARTING CAMERA</p>
              </>
            )}
          </div>
        )}
        {status === "running" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-sm border-2 border-gold/70 shadow-[0_0_0_9999px_oklch(0.147_0.002_17/0.45)]" />
          </div>
        )}
      </div>

      {!showManual ? (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowManual(true)}>
          <Keyboard className="mr-2 h-4 w-4" /> Enter ticket token manually
        </Button>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim().length > 3) {
              onScanRef.current(manual.trim());
              setManual("");
            }
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="RCF-a7f92b81…"
            className="font-mono"
          />
          <Button type="submit">Look up</Button>
        </form>
      )}
    </div>
  );
}
