
CREATE OR REPLACE FUNCTION public.next_ticket_number(_prefix TEXT DEFAULT 'RCF')
RETURNS TEXT LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT _prefix || '-' || lpad(nextval('public.ticket_number_seq')::text, 4, '0');
$$;
REVOKE ALL ON FUNCTION public.next_ticket_number(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_ticket_number(TEXT) TO authenticated;
