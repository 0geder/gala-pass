import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  firstName: z.string().min(1).max(120),
  surname: z.string().min(1).max(120),
  studentNumber: z.string().min(2).max(40),
  dietaryRequirement: z.string().max(400).optional().nullable(),
  email: z.string().email().optional().nullable(),
  formSubmissionId: z.string().max(200).optional().nullable(),
  source: z.string().max(60).optional().nullable(),
});

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/public/integrations/google-form")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["GOOGLE_FORM_WEBHOOK_SECRET"];
        if (!secret) return json({ error: "Integration not configured" }, 503);

        const provided = request.headers.get("x-webhook-secret") ?? "";
        if (!provided || !safeEqual(provided, secret)) return json({ error: "Unauthorized" }, 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return json({ error: "Invalid payload", issues: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
        }

        const origin = new URL(request.url).origin;
        const { processFormSubmission } = await import("@/lib/integration.server");
        const result = await processFormSubmission(parsed.data, origin);

        return json(result, result.status === "FAILED" ? 500 : 200);
      },
      GET: async () =>
        json({ ok: true, endpoint: "/api/public/integrations/google-form", method: "POST" }, 200),
    },
  },
});
