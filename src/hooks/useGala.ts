import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getEventOverview, getMe } from "@/lib/gala.functions";

export type RosterRow = Awaited<ReturnType<typeof getEventOverview>>["roster"][number];

export function useOverview() {
  const fetchOverview = useServerFn(getEventOverview);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["gala", "overview"],
    queryFn: () => fetchOverview(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("gala-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "attendees" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gala", "overview"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMe() {
  const fetchMe = useServerFn(getMe);
  return useQuery({ queryKey: ["gala", "me"], queryFn: () => fetchMe(), staleTime: 60_000 });
}

export function computeStats(roster: RosterRow[]) {
  const registered = roster.length;
  const issued = roster.filter((r) => Boolean(r.ticketNumber)).length;
  const boarded = roster.filter((r) => r.boarded).length;
  const returned = roster.filter((r) => r.returned).length;
  return { registered, issued, boarded, returned, stillOut: boarded - returned, notBoarded: registered - boarded };
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
