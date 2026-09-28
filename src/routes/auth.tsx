import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Access | Roscommon House Met Gala" },
      {
        name: "description",
        content:
          "Sign in to the Roscommon House Met Gala ticketing, QR verification and bus attendance console.",
      },
      { property: "og:title", content: "Staff Access | Roscommon House Met Gala" },
      {
        property: "og:description",
        content: "Event staff sign-in for Met Gala: Burgundy and Black.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-noir flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-[10px] tracking-editorial text-champagne/70">ROSCOMMON HOUSE</p>
          <h1 className="font-display mt-3 text-4xl leading-none text-ivory">MET GALA</h1>
          <p className="mt-2 text-[10px] tracking-editorial text-gold">BURGUNDY AND BLACK</p>
          <div className="rule-gold my-7" />
          <p className="text-xs tracking-[0.2em] text-champagne/60">STAFF & ORGANISER ACCESS</p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-sm border border-sidebar-border bg-noir/60 p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-champagne">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-sidebar-border bg-transparent text-ivory"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-champagne">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-sidebar-border bg-transparent text-ivory"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-[10px] tracking-wide text-champagne/40">
          Housecomm access only. Accounts are created by the event administrator.
        </p>
      </div>
    </div>
  );
}
