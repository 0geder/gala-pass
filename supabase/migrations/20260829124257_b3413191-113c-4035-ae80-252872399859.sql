CREATE TABLE public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'google_forms',
  form_submission_id text,
  student_number text,
  status text NOT NULL DEFAULT 'RECEIVED',
  message text,
  payload jsonb,
  attendee_id uuid REFERENCES public.attendees(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.integration_logs TO authenticated;
GRANT ALL ON public.integration_logs TO service_role;

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_logs_select_authed ON public.integration_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY integration_logs_admin_delete ON public.integration_logs
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX integration_logs_created_at_idx ON public.integration_logs (created_at DESC);
CREATE UNIQUE INDEX attendees_event_submission_uidx
  ON public.attendees (event_id, form_submission_id)
  WHERE form_submission_id IS NOT NULL;