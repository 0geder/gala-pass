import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
        content: "Sign in to the Roscommon House Met Gala ticketing, QR verification and bus attendance console.",
      },
      { property: "og:title", content: "Staff Access | Roscommon House Met Gala" },
      { property: "og:description", content: "Event staff sign-in for Met Gala: Burgundy and Black." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created", { description: "You can now sign in." });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
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

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-sm border border-sidebar-border bg-noir/60 p-6">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-champagne">
                Full name
              </Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-sidebar-border bg-transparent text-ivory"
              />
            </div>
          )}
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
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-sidebar-border bg-transparent text-ivory"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full">
            {mode === "signin" ? "Sign in" : "Create staff account"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} className="w-full" onClick={google}>
            Continue with Google
          </Button>
          <button
            type="button"
            className="w-full pt-2 text-xs text-champagne/60 underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Register as staff" : "Already registered? Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-[10px] tracking-wide text-champagne/40">
          The first account created becomes the event administrator.
        </p>
      </div>
    </div>
  );
}
