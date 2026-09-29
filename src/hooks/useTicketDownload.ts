import { useRef, useState } from "react";
import { toast } from "sonner";
import { downloadTicket } from "@/lib/ticket-download";

export function useTicketDownload(ticketNumber: string | null | undefined) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState<"png" | "pdf" | null>(null);

  async function save(format: "png" | "pdf") {
    const element = ticketRef.current?.firstElementChild;
    if (!(element instanceof HTMLElement) || !ticketNumber) return;
    setSaving(format);
    try {
      await downloadTicket(element, format, ticketNumber);
    } catch (err) {
      console.error("[gala] ticket download failed", err);
      toast.error("Couldn't save the ticket. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  return { ticketRef, saving, save };
}
