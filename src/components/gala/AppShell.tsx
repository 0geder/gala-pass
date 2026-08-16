import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BusFront,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  QrCode,
  Settings,
  Ticket,
  Undo2,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/useGala";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/attendees", label: "Attendees", icon: Users },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/scan", label: "QR Scanner", icon: QrCode },
  { to: "/boarding", label: "Bus Boarding", icon: BusFront },
  { to: "/returns", label: "Return Check-in", icon: Undo2 },
  { to: "/emails", label: "Ticket Emails", icon: Mail },
  { to: "/settings", label: "Event Settings", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Dash", icon: LayoutDashboard },
  { to: "/attendees", label: "Guests", icon: Users },
  { to: "/scan", label: "Scan", icon: QrCode },
  { to: "/returns", label: "Return", icon: Undo2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="surface-noir fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border lg:flex">
        <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
        <SidebarFooter me={me} onSignOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-noir/70"
            onClick={() => setOpen(false)}
          />
          <aside className="surface-noir absolute inset-y-0 left-0 flex w-72 flex-col">
            <SidebarBody pathname={pathname} onNavigate={() => setOpen(false)} />
            <SidebarFooter me={me} onSignOut={signOut} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="surface-noir sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="p-1 text-ivory">
            <Menu className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="text-[9px] tracking-editorial text-champagne/70">ROSCOMMON HOUSE</p>
            <p className="font-display text-lg leading-tight text-ivory">MET GALA</p>
          </div>
          <div className="w-8" />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="surface-noir fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-sidebar-border lg:hidden">
        {MOBILE_NAV.map((item) => {
          const activeItem = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[10px] tracking-[0.14em] transition-colors",
                activeItem ? "text-gold" : "text-champagne/60",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label.toUpperCase()}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 pt-8 pb-6">
        <p className="text-[9px] tracking-editorial text-champagne/70">ROSCOMMON HOUSE</p>
        <h1 className="font-display mt-2 text-2xl leading-none text-ivory">MET GALA</h1>
        <p className="mt-2 text-[9px] tracking-[0.22em] text-gold">BURGUNDY & BLACK</p>
        <div className="rule-gold mt-5" />
      </div>
      <nav className="space-y-0.5 px-3 pb-6">
        {NAV.map((item) => {
          const activeItem = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-[13px] tracking-wide transition-colors",
                activeItem
                  ? "bg-sidebar-accent text-ivory"
                  : "text-champagne/70 hover:bg-sidebar-accent/50 hover:text-ivory",
              )}
            >
              <item.icon className={cn("h-4 w-4", activeItem && "text-gold")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarFooter({
  me,
  onSignOut,
}: {
  me?: { email: string | null; fullName: string | null; isAdmin: boolean } | undefined;
  onSignOut: () => void;
}) {
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      <p className="truncate text-xs text-champagne">{me?.fullName ?? me?.email ?? "Staff"}</p>
      <p className="text-[9px] tracking-editorial text-gold">{me?.isAdmin ? "ADMIN" : "STAFF"}</p>
      <Button variant="ghost" size="sm" className="mt-3 w-full justify-start text-champagne/70" onClick={onSignOut}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] tracking-editorial text-primary">{eyebrow}</p>
        <h1 className="font-display mt-2 text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
