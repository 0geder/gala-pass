import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/gala/AppShell";
import { ScanConsole } from "@/components/gala/ScanConsole";

export const Route = createFileRoute("/_authenticated/scan")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "QR Scanner | Roscommon House Met Gala" },
      {
        name: "description",
        content: "Scan gala tickets with your phone camera to verify guests and confirm bus boarding instantly.",
      },
      { property: "og:title", content: "QR Scanner | Roscommon House Met Gala" },
      { property: "og:description", content: "Camera ticket verification for the Roscommon Formal bus boarding." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="BOARDING MODE"
        title="Ticket Scanner"
        description="Point the camera at the guest's ticket QR. The token is verified against the database before boarding is allowed."
      />
      <ScanConsole mode="boarding" />
    </div>
  );
}
