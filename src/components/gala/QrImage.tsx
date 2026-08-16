import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImage({
  value,
  size = 240,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size * 2,
      color: { dark: "#0B0A0Aff", light: "#FFFFFFff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div
      className="flex items-center justify-center rounded-sm bg-white p-3"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={`QR code for ticket token ${value}`} width={size} height={size} className={className} />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </div>
  );
}
