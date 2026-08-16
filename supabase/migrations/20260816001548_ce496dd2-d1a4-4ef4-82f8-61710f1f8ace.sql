
CREATE TYPE public.app_role AS ENUM ('admin','staff');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_select_authed" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'admin'::public.app_role ELSE 'staff'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subtitle TEXT,
  event_date DATE,
  venue TEXT,
  ticket_price NUMERIC(10,2) DEFAULT 0,
  theme TEXT,
  email_domain TEXT NOT NULL DEFAULT '@myuct.ac.za',
  ticket_prefix TEXT NOT NULL DEFAULT 'RCF',
  email_from TEXT,
  email_subject TEXT NOT NULL DEFAULT 'Your Roscommon House Met Gala Ticket',
  email_body TEXT NOT NULL DEFAULT 'Welcome to the Roscommon House Met Gala: Burgundy and Black. Your ticket is attached. Please keep this ticket available on your phone and present the QR code when boarding the bus.',
  google_sheet_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_authed" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_admin_manage" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  student_number TEXT NOT NULL,
  email TEXT NOT NULL,
  dietary_requirement TEXT,
  form_submission_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, student_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendees TO authenticated;
GRANT ALL ON public.attendees TO service_role;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendees_select_authed" ON public.attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendees_admin_manage" ON public.attendees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER attendees_touch BEFORE UPDATE ON public.attendees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE SEQUENCE public.ticket_number_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE public.ticket_number_seq TO authenticated, service_role;

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id UUID NOT NULL UNIQUE REFERENCES public.attendees(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued',
  ticket_url TEXT,
  email_sent_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_select_authed" ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "tickets_admin_manage" ON public.tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
  boarded BOOLEAN NOT NULL DEFAULT false,
  boarding_time TIMESTAMPTZ,
  boarding_staff TEXT,
  bus_number TEXT,
  returned BOOLEAN NOT NULL DEFAULT false,
  return_time TIMESTAMPTZ,
  return_staff TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select_authed" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance_staff_write" ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE TRIGGER attendance_touch BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- Seed event
INSERT INTO public.events (id, name, subtitle, event_date, venue, ticket_price, theme, email_from)
VALUES ('11111111-1111-1111-1111-111111111111','MET GALA: BURGUNDY AND BLACK','THE ROSCOMMON FORMAL','2026-10-16','Suikerbossie', 450.00, 'Burgundy and Black', 'roscommonhouse@myuct.ac.za');

-- Seed attendees + tickets + attendance
WITH people(first_name, surname, student_number, dietary) AS (
  VALUES ('Samson','Okuthe','OKTSAM001','Halaal'),
         ('John','Smith','SMTJHN002','None'),
         ('Sarah','Adams','ADMSAR003','Vegetarian'),
         ('Michael','Jones','JNSMIC004','None'),
         ('Jessica','Brown','BRWJES005','Vegan')
), ins_att AS (
  INSERT INTO public.attendees (event_id, first_name, surname, student_number, email, dietary_requirement)
  SELECT '11111111-1111-1111-1111-111111111111', first_name, surname, student_number, lower(student_number)||'@myuct.ac.za', dietary
  FROM people
  RETURNING id, created_at
), ins_tick AS (
  INSERT INTO public.tickets (attendee_id, event_id, ticket_number, qr_token)
  SELECT id, '11111111-1111-1111-1111-111111111111',
         'RCF-' || lpad(nextval('public.ticket_number_seq')::text, 4, '0'),
         'RCF-' || encode(gen_random_bytes(16),'hex')
  FROM ins_att
  RETURNING id
)
INSERT INTO public.attendance (ticket_id) SELECT id FROM ins_tick;
